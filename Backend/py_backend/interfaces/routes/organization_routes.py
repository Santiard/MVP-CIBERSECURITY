from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_admin, is_org_user, is_staff
from app.db import engine
from infraestructure.database import EmpresaORM, UsuarioORM, UsuarioOrganizacionORM
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _user_ids_from_payload(data: dict) -> list[int] | None:
    """Si no vienen claves de usuarios, no se toca la membresía. Si vienen, se reemplaza la lista (puede ser vacía)."""
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


def _sync_usuario_empresa(session: Session, id_empresa: int, user_ids: list[int]) -> None:
    for uid in user_ids:
        u = session.get(UsuarioORM, uid)
        if u is None:
            raise HTTPException(status_code=422, detail=f"Usuario {uid} no existe")
        if not (u.activo):
            raise HTTPException(status_code=422, detail=f"Usuario {uid} está inactivo")
    for row in session.exec(
        select(UsuarioOrganizacionORM).where(UsuarioOrganizacionORM.id_empresa == id_empresa)
    ).all():
        session.delete(row)
    for uid in user_ids:
        session.add(UsuarioOrganizacionORM(id_usuario=uid, id_empresa=id_empresa))
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
            _sync_usuario_empresa(session, empresa.id_empresa, user_ids_payload)
            session.commit()
        session.refresh(empresa)
        return empresa


@router.get("")
def list_organizations(current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if not is_org_user(current_user):
            if not is_staff(current_user):
                return []
            return session.exec(select(EmpresaORM)).all()
        allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
        if not allowed_ids:
            return []
        stmt = select(EmpresaORM).where(EmpresaORM.id_empresa.in_(allowed_ids))
        return session.exec(stmt).all()


@router.get("/{org_id}/users")
def list_organization_users(org_id: int, current_user=Depends(auth_middleware)):
    """Usuarios asignados a la empresa (tabla usuario_organizacion)."""
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
        links = session.exec(
            select(UsuarioOrganizacionORM).where(UsuarioOrganizacionORM.id_empresa == org_id)
        ).all()
        result: list[dict] = []
        for link in links:
            u = session.get(UsuarioORM, link.id_usuario)
            if u is None:
                continue
            result.append(
                {
                    "id_usuario": u.id_usuario,
                    "nombre": u.nombre,
                    "correo": u.correo,
                    "activo": u.activo,
                }
            )
        return result


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
        for link in session.exec(
            select(UsuarioOrganizacionORM).where(UsuarioOrganizacionORM.id_empresa == org_id)
        ).all():
            session.delete(link)
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
