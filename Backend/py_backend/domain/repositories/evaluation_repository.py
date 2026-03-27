from abc import ABC, abstractmethod
from typing import Any, Optional


class EvaluationRepository(ABC):
    @abstractmethod
    def save(self, evaluation: Any) -> Any:
        raise NotImplementedError

    @abstractmethod
    def find_by_id(self, id: str) -> Optional[Any]:
        raise NotImplementedError
