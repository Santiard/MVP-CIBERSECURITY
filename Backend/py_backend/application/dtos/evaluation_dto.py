from datetime import date
from typing import Any, Optional

from pydantic import BaseModel


class EvaluationDTO(BaseModel):
    id: Optional[str] = None
    organization_id: int
    answers: Optional[dict[str, Any]] = None
    user_id: Optional[int] = None
    fecha: Optional[date] = None
    estado: Optional[str] = None
