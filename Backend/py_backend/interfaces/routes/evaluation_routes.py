from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user
from app.db import engine
from app.repositories.evaluation_repository import SQLEvaluationRepository
from app.schemas import EvaluationCreate, EvaluationRead, EvaluationUpdate
from infraestructure.database import EvaluationModel
from interfaces.controllers.evaluation_controller import EvaluationController
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/evaluations", tags=["evaluations"])
controller = EvaluationController()
repo = SQLEvaluationRepository()


@router.post("", response_model=EvaluationRead)
def create_evaluation(input_data: EvaluationCreate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if input_data.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para crear evaluaciones de esta organización")
    return controller.create(input_data.model_dump())


@router.get("")
def list_evaluations(organization_id: int | None = None, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        stmt = select(EvaluationModel)

        if organization_id is not None:
            stmt = stmt.where(EvaluationModel.organization_id == organization_id)

        if is_org_user(current_user):
            allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
            if not allowed_ids:
                return []
            stmt = stmt.where(EvaluationModel.organization_id.in_(allowed_ids))

            if organization_id is not None and organization_id not in allowed_ids:
                return []

        return session.exec(stmt).all()


@router.get("/{evaluation_id}")
def get_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    item = controller.get_by_id(evaluation_id)
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if item.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para ver esta evaluación")
    return item


@router.patch("/{evaluation_id}", response_model=EvaluationRead)
def update_evaluation(evaluation_id: int, input_data: EvaluationUpdate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        current_item = repo.find_by_id(evaluation_id)
        if current_item is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))

        target_org_id = input_data.organization_id if input_data.organization_id is not None else current_item.organization_id
        if target_org_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")

    item = repo.update(evaluation_id, input_data.model_dump(exclude_unset=True))
    if item is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return item


@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        current_item = repo.find_by_id(evaluation_id)
        if current_item is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if current_item.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para eliminar esta evaluación")

    deleted = repo.delete(evaluation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"deleted": True, "id": evaluation_id}
