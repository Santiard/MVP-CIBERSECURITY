from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_admin, is_org_user, is_staff, role_lower
from app.db import engine
from infraestructure.database import EmpresaORM, RolORM, UsuarioORM, EvaluacionORM
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _user_ids_from_payload(data: dict) -> list[int] | None:
    if "user_ids" not in data and "usuario_ids" not in data:
        return None
    raw = data.get("user_ids", data.get("usuario_ids", []))
    if not isinstance(raw, list):
        raise HTTPException(status_code=422, detail="user_ids debe ser una lista de enteros")
    out: list[int] = []
    for item in raw:
        try:
            out.append(int(item))
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="user_ids contiene valores no numéricos")
    return list(dict.fromkeys(out))


def _validate_org_member_user_ids(session: Session, id_empresa: int, user_ids: list[int]) -> None:
    for uid in user_ids:
        u = session.get(UsuarioORM, uid)
        if u is None:
            raise HTTPException(status_code=422, detail=f"Usuario {uid} no existe.")
        if not u.activo:
            raise HTTPException(status_code=422, detail=f"Usuario {uid} está inactivo.")
        
        rol_obj = session.get(RolORM, u.id_rol)
        if not rol_obj or not rol_obj.nombre.startswith("user_nivel_"):
            raise HTTPException(
                status_code=422,
                detail=f"Solo pueden asignarse usuarios con roles de empresa (usuario {uid}).",
            )
        
        if u.id_empresa is not None and u.id_empresa != id_empresa:
            raise HTTPException(
                status_code=422,
                detail=f"El usuario {uid} ya está asignado a otra empresa.",
            )


def _sync_usuario_empresa(session: Session, id_empresa: int, user_ids: list[int]) -> None:
    # Validate existance again just in case
    for uid in user_ids:
        u = session.get(UsuarioORM, uid)
        if u is None or not u.activo:
            raise HTTPException(status_code=422, detail=f"Usuario {uid} inválido")
            
    # Detach current users
    current_users = session.exec(select(UsuarioORM).where(UsuarioORM.id_empresa == id_empresa)).all()
    for u in current_users:
        u.id_empresa = None
        session.add(u)
        
    # Attach new users
    for uid in user_ids:
        u = session.get(UsuarioORM, uid)
        u.id_empresa = id_empresa
        session.add(u)
    session.flush()


@router.post("")
def create_organization(input_data: dict, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para crear empresas")
    if not is_staff(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para crear empresas")
    data = dict(input_data)
    if "name" not in data or not str(data["name"]).strip():
        raise HTTPException(status_code=422, detail="El nombre de la empresa es requerido")
    if "sector" not in data or not str(data["sector"]).strip():
        raise HTTPException(status_code=422, detail="El sector es requerido")
    if "size" not in data or not str(data["size"]).strip():
        raise HTTPException(status_code=422, detail="El tamaño es requerido")
    user_ids_payload = _user_ids_from_payload(data)
    with Session(engine) as session:
        empresa = EmpresaORM(
            nombre=data["name"],
            sector=data["sector"],
            tamano=data["size"],
        )
        session.add(empresa)
        session.commit()
        session.refresh(empresa)
        assert empresa.id_empresa is not None
        if user_ids_payload is not None:
            _validate_org_member_user_ids(session, empresa.id_empresa, user_ids_payload)
            _sync_usuario_empresa(session, empresa.id_empresa, user_ids_payload)
            session.commit()
        session.refresh(empresa)
        return empresa


@router.get("")
def list_organizations(current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if is_org_user(current_user):
            allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
            if not allowed_ids:
                return []
            stmt = select(EmpresaORM).where(EmpresaORM.id_empresa.in_(allowed_ids))
            return session.exec(stmt).all()
        elif role_lower(current_user) == "evaluator":
            uid = int(current_user["user_id"])
            stmt = (
                select(EmpresaORM)
                .join(EvaluacionORM, EmpresaORM.id_empresa == EvaluacionORM.id_empresa)
                .where(EvaluacionORM.id_evaluador == uid)
                .distinct()
            )
            return session.exec(stmt).all()
        elif is_admin(current_user):
            return session.exec(select(EmpresaORM)).all()
        else:
            return []


@router.get("/eligible-members")
def list_eligible_organization_members(
    for_empresa: int | None = None,
    current_user=Depends(auth_middleware),
):
    if not is_staff(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    with Session(engine) as session:
        stmt_users = (
            select(UsuarioORM)
            .join(RolORM)
            .where(RolORM.nombre.startswith("user_nivel_"))
            .where(UsuarioORM.activo == True)
        )
        candidates = list(session.exec(stmt_users).all())

        if for_empresa is None:
            eligible = [u for u in candidates if u.id_empresa is None]
        else:
            eligible = [u for u in candidates if u.id_empresa is None or u.id_empresa == for_empresa]

        return [
            {
                "id_usuario": u.id_usuario,
                "nombre": u.nombre,
                "correo": u.correo,
                "activo": u.activo,
            }
            for u in eligible
            if u.id_usuario is not None
        ]


@router.get("/{org_id}/users")
def list_organization_users(org_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if not is_org_user(current_user) and not is_staff(current_user):
            raise HTTPException(status_code=403, detail="No autorizado")
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if org_id not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para ver esta empresa")
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
        users = session.exec(select(UsuarioORM).where(UsuarioORM.id_empresa == org_id)).all()
        return [
            {
                "id_usuario": u.id_usuario,
                "nombre": u.nombre,
                "correo": u.correo,
                "activo": u.activo,
            }
            for u in users
        ]


@router.get("/{org_id}")
def get_organization(org_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if not is_org_user(current_user) and not is_staff(current_user):
            raise HTTPException(status_code=403, detail="No autorizado")
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if org_id not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para ver esta empresa")
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        return empresa


@router.patch("/{org_id}")
def update_organization(org_id: int, input_data: dict, current_user=Depends(auth_middleware)):
    if not is_org_user(current_user) and not is_staff(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")
    data = dict(input_data)
    user_ids_payload = _user_ids_from_payload(data)
    if user_ids_payload is not None and is_org_user(current_user):
        raise HTTPException(
            status_code=403,
            detail="Los usuarios de organización no pueden modificar la lista de miembros; use un administrador o evaluador",
        )
    data.pop("user_ids", None)
    data.pop("usuario_ids", None)

    with Session(engine) as session:
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if org_id not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para modificar esta empresa")
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if "name" in data and str(data["name"]).strip():
            empresa.nombre = data["name"]
        if "sector" in data and str(data["sector"]).strip():
            empresa.sector = data["sector"]
        if "size" in data and str(data["size"]).strip():
            empresa.tamano = data["size"]
        session.add(empresa)
        session.commit()
        session.refresh(empresa)
        if user_ids_payload is not None:
            _validate_org_member_user_ids(session, org_id, user_ids_payload)
            _sync_usuario_empresa(session, org_id, user_ids_payload)
            session.commit()
            session.refresh(empresa)
        return empresa


@router.delete("/{org_id}")
def delete_organization(org_id: int, current_user=Depends(auth_middleware)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Solo un administrador puede eliminar empresas")
    with Session(engine) as session:
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
        current_users = session.exec(select(UsuarioORM).where(UsuarioORM.id_empresa == org_id)).all()
        for u in current_users:
            u.id_empresa = None
            session.add(u)
        session.flush()
        
        try:
            session.delete(empresa)
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar la empresa: hay evaluaciones u otros registros vinculados. Elimínalos primero (p. ej. desde Asignaciones).",
            ) from None
        return {"deleted": True, "id": org_id}
