from fastapi import HTTPException

from application.dtos.evaluation_dto import EvaluationDTO
from application.use_cases.create_evaluation_use_case import CreateEvaluationUseCase
from infraestructure.repositories.sql_evaluation_repository import SqlEvaluationRepository


class EvaluationController:
    def __init__(self) -> None:
        repo = SqlEvaluationRepository()
        self.create_evaluation_use_case = CreateEvaluationUseCase(repo)
        self.repo = repo

    def create(self, input_data: dict):
        dto = EvaluationDTO(**input_data)
        return self.create_evaluation_use_case.execute(dto)

    def get_by_id(self, evaluation_id: int):
        item = self.repo.find_by_id(evaluation_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        return item
