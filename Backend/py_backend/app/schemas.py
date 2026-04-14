from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class OrganizationCreate(BaseModel):
    name: str
    email: Optional[str] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class OrganizationRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        orm_mode = True

class EvaluationCreate(BaseModel):
    organization_id: int
    answers: Optional[Dict[str, Any]] = {}
    user_id: Optional[int] = None


class EvaluationUpdate(BaseModel):
    organization_id: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = None

class EvaluationRead(BaseModel):
    id: int
    organization_id: int
    answers: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None

    class Config:
        orm_mode = True
