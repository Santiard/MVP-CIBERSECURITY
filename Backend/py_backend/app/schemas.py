from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

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
    organization_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("organization_id", "id_empresa"),
    )
    answers: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("user_id", "id_usuario"))
    fecha: Optional[date] = None
    estado: Optional[str] = None

    @model_validator(mode="after")
    def _require_empresa(self) -> EvaluationCreate:
        if self.organization_id is None:
            raise ValueError("Debe enviarse organization_id o id_empresa")
        return self


class EvaluationUpdate(BaseModel):
    organization_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("organization_id", "id_empresa"))
    answers: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("user_id", "id_usuario"))
    estado: Optional[str] = None
    fecha: Optional[date] = None


class EvaluationRead(BaseModel):
    """Lectura API: nombres en inglés + alias en español para el front."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    answers: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None
    id_evaluacion: Optional[int] = None
    id_empresa: Optional[int] = None
    id_usuario: Optional[int] = None
    fecha: Optional[date] = None
    estado: Optional[str] = None


class ControlLinkedRead(BaseModel):
    """Control (cuestionario) vinculado a una evaluación."""

    model_config = ConfigDict(from_attributes=True)

    id_control: int
    nombre: str
    descripcion: str
    dimensiones: int = 0
    activo: bool = True
    confidencialidad: bool
    integridad: bool
    disponibilidad: bool


class EvaluationLinkControlsBody(BaseModel):
    """Enlazar varios controles al alcance de una evaluación (idempotente: ignora duplicados)."""

    control_ids: list[int] = Field(min_length=1)


class RiskRead(BaseModel):
    """Riesgo con vínculo opcional a control (UML)."""

    model_config = ConfigDict(from_attributes=True)

    id_riesgo: int
    descripcion: str
    impacto: int
    probabilidad: int
    id_activo: int
    id_control: Optional[int] = None
