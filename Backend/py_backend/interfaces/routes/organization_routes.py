from fastapi import APIRouter, Depends, HTTPException

from app.repositories.evaluation_repository import SQLOrganizationRepository
from app.schemas import OrganizationCreate, OrganizationRead
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/organizations", tags=["organizations"])
repo = SQLOrganizationRepository()


@router.post("", response_model=OrganizationRead)
def create_organization(input_data: OrganizationCreate, _=Depends(auth_middleware)):
    return repo.save(input_data.name)


@router.get("")
def list_organizations(_=Depends(auth_middleware)):
    return repo.find_all()


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(org_id: int, _=Depends(auth_middleware)):
    organization = repo.find_by_id(org_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization
