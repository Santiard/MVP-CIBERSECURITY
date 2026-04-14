from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user
from app.db import engine
from app.repositories.evaluation_repository import SQLOrganizationRepository
from app.schemas import OrganizationCreate, OrganizationRead, OrganizationUpdate
from app.validation import is_numeric_string, is_valid_email, normalize_optional_string
from infraestructure.database import OrganizationModel
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/organizations", tags=["organizations"])
repo = SQLOrganizationRepository()


def _validate_org_payload(payload: dict) -> dict:
    data = dict(payload)

    if "name" in data and data["name"] is not None and not str(data["name"]).strip():
        raise HTTPException(status_code=422, detail="El nombre de la organización es requerido")

    email = normalize_optional_string(data.get("email")) if "email" in data else None
    if email is not None and not is_valid_email(email):
        raise HTTPException(status_code=422, detail="El correo de la organización no es válido")
    if "email" in data:
        data["email"] = email

    nit = normalize_optional_string(data.get("nit")) if "nit" in data else None
    if nit is not None and not is_numeric_string(nit):
        raise HTTPException(status_code=422, detail="El NIT solo puede contener números")
    if "nit" in data:
        data["nit"] = nit

    if "phone" in data:
        data["phone"] = normalize_optional_string(data.get("phone"))
    if "address" in data:
        data["address"] = normalize_optional_string(data.get("address"))

    return data


@router.post("", response_model=OrganizationRead)
def create_organization(input_data: OrganizationCreate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para crear organizaciones")

    payload = _validate_org_payload(input_data.model_dump())
    return repo.save(payload)


@router.get("")
def list_organizations(current_user=Depends(auth_middleware)):
    if not is_org_user(current_user):
        return repo.find_all()

    with Session(engine) as session:
        allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
        if not allowed_ids:
            return []

        stmt = select(OrganizationModel).where(OrganizationModel.id.in_(allowed_ids))
        return session.exec(stmt).all()


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(org_id: int, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if org_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para ver esta organización")

    organization = repo.find_by_id(org_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@router.patch("/{org_id}", response_model=OrganizationRead)
def update_organization(org_id: int, input_data: OrganizationUpdate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if org_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para modificar esta organización")

    payload = _validate_org_payload(input_data.model_dump(exclude_unset=True))
    organization = repo.update(org_id, payload)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@router.delete("/{org_id}")
def delete_organization(org_id: int, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if org_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para eliminar esta organización")

    deleted = repo.delete(org_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"deleted": True, "id": org_id}
