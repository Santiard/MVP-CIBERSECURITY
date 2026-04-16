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
        # SQLEvaluationRepository acepta dict con user_id opcional vía setattr
        save_dict = {
            "organization_id": payload.organization_id,
            "answers": payload.answers,
            "user_id": evaluation.get("user_id"),
            "fecha": evaluation.get("fecha"),
            "estado": evaluation.get("estado"),
        }
        return self._repo.save(save_dict)

    def find_by_id(self, id: int) -> Optional[Any]:
        return self._repo.find_by_id(int(id))

    def update(self, id: int, payload: dict) -> Optional[Any]:
        return self._repo.update(int(id), payload)

    def delete(self, id: int) -> bool:
        return self._repo.delete(int(id))