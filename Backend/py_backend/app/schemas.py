from pydantic import BaseModel
from typing import Optional, Dict, Any

class OrganizationCreate(BaseModel):
    name: str

class OrganizationRead(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class EvaluationCreate(BaseModel):
    organization_id: int
    answers: Optional[Dict[str, Any]] = {}

class EvaluationRead(BaseModel):
    id: int
    organization_id: int
    answers: Optional[Dict[str, Any]] = {}

    class Config:
        orm_mode = True
