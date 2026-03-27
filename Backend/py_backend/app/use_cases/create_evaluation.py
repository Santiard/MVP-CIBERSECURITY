from app.schemas import EvaluationCreate
from app.repositories.evaluation_repository import SQLEvaluationRepository


class CreateEvaluationUseCase:
    def __init__(self, repo: SQLEvaluationRepository):
        self.repo = repo

    def execute(self, payload: EvaluationCreate):
        return self.repo.save(payload)
