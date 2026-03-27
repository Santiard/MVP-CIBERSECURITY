from typing import Any

from application.dtos.evaluation_dto import EvaluationDTO
from domain.repositories.evaluation_repository import EvaluationRepository


class CreateEvaluationUseCase:
    def __init__(self, repository: EvaluationRepository) -> None:
        self.repository = repository

    def execute(self, input_dto: EvaluationDTO) -> Any:
        payload = {
            "organization_id": input_dto.organization_id,
            "answers": input_dto.answers or {},
        }
        return self.repository.save(payload)
