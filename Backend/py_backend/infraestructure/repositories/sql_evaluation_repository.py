from typing import Any, Optional

from app.repositories.evaluation_repository import SQLEvaluationRepository
from domain.repositories.evaluation_repository import EvaluationRepository


class SqlEvaluationRepository(EvaluationRepository):
    """SQLModel-backed evaluation repository adapter."""

    def __init__(self) -> None:
        self._repo = SQLEvaluationRepository()

    def save(self, evaluation: Any) -> Any:
        class _Payload:
            def __init__(self, organization_id: int, answers: dict[str, Any]) -> None:
                self.organization_id = organization_id
                self.answers = answers

        payload = _Payload(
            organization_id=int(evaluation["organization_id"]),
            answers=evaluation.get("answers", {}),
        )
        return self._repo.save(payload)

    def find_by_id(self, id: int) -> Optional[Any]:
        return self._repo.find_by_id(int(id))