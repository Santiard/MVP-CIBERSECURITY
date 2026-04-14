from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user
from app.db import engine
from infraestructure.database import EmpresaORM
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/organizations", tags=["organizations"])





@router.post("")
def create_organization(input_data: dict, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para crear empresas")
    data = dict(input_data)
    if "name" not in data or not str(data["name"]).strip():
        raise HTTPException(status_code=422, detail="El nombre de la empresa es requerido")
    if "sector" not in data or not str(data["sector"]).strip():
        raise HTTPException(status_code=422, detail="El sector es requerido")
    if "size" not in data or not str(data["size"]).strip():
        raise HTTPException(status_code=422, detail="El tamaño es requerido")
    with Session(engine) as session:
        empresa = EmpresaORM(
            nombre=data["name"],
            sector=data["sector"],
            tamano=data["size"]
        )
        session.add(empresa)
        session.commit()
        session.refresh(empresa)
        return empresa


@router.get("")
def list_organizations(current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if not is_org_user(current_user):
            return session.exec(select(EmpresaORM)).all()
        allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
        if not allowed_ids:
            return []
        stmt = select(EmpresaORM).where(EmpresaORM.id_empresa.in_(allowed_ids))
        return session.exec(stmt).all()


@router.get("/{org_id}")
def get_organization(org_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
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
    with Session(engine) as session:
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if org_id not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para modificar esta empresa")
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        data = dict(input_data)
        if "name" in data and str(data["name"]).strip():
            empresa.nombre = data["name"]
        if "sector" in data and str(data["sector"]).strip():
            empresa.sector = data["sector"]
        if "size" in data and str(data["size"]).strip():
            empresa.tamano = data["size"]
        session.add(empresa)
        session.commit()
        session.refresh(empresa)
        return empresa


@router.delete("/{org_id}")
def delete_organization(org_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if org_id not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para eliminar esta empresa")
        empresa = session.get(EmpresaORM, org_id)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        session.delete(empresa)
        session.commit()
        return {"deleted": True, "id": org_id}
