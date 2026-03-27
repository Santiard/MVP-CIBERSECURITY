from typing import Any, Optional

from pydantic import BaseModel


class EvaluationDTO(BaseModel):
    id: Optional[str] = None
    organization_id: str
    answers: Optional[dict[str, Any]] = None
