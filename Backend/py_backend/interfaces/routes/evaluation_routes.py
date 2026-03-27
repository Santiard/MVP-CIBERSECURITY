from fastapi import APIRouter, Depends

from app.repositories.evaluation_repository import SQLEvaluationRepository
from app.schemas import EvaluationCreate, EvaluationRead
from interfaces.controllers.evaluation_controller import EvaluationController
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/evaluations", tags=["evaluations"])
controller = EvaluationController()
repo = SQLEvaluationRepository()


@router.post("", response_model=EvaluationRead)
def create_evaluation(input_data: EvaluationCreate, _=Depends(auth_middleware)):
    return controller.create(input_data.model_dump())


@router.get("")
def list_evaluations(_=Depends(auth_middleware)):
    return repo.find_all()


@router.get("/{evaluation_id}")
def get_evaluation(evaluation_id: int, _=Depends(auth_middleware)):
    return controller.get_by_id(evaluation_id)
