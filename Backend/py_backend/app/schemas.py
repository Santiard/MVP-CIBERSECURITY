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
    id_formulario: int
    answers: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("user_id", "id_usuario"))
    evaluator_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("evaluator_id", "id_evaluador"))
    fecha: Optional[date] = None
    estado: Optional[str] = None

    @model_validator(mode="after")
    def _require_empresa(self) -> EvaluationCreate:
        if self.organization_id is None:
            raise ValueError("Debe enviarse organization_id o id_empresa")
        return self


class EvaluationUpdate(BaseModel):
    organization_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("organization_id", "id_empresa"))
    id_formulario: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("user_id", "id_usuario"))
    evaluator_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("evaluator_id", "id_evaluador"))
    estado: Optional[str] = None
    fecha: Optional[date] = None


class EvaluationRead(BaseModel):
    """Lectura API: nombres en inglés + alias en español para el front."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    id_formulario: int
    answers: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None
    evaluator_id: Optional[int] = None
    id_evaluacion: Optional[int] = None
    id_empresa: Optional[int] = None
    id_usuario: Optional[int] = None
    id_evaluador: Optional[int] = None
    fecha: Optional[date] = None
    estado: Optional[str] = None


class FormularioRead(BaseModel):
    """Esquema de lectura para Formularios (Plantillas)."""

    model_config = ConfigDict(from_attributes=True)

    id_formulario: int
    nombre: str
    descripcion: str
    activo: bool
    aplica_nivel_bajo: bool
    aplica_nivel_medio: bool
    aplica_nivel_alto: bool


class ControlRead(BaseModel):
    """Esquema de lectura para Controles ISO."""

    model_config = ConfigDict(from_attributes=True)

    id_control: int
    nombre: str
    descripcion: str
    dimensiones: int = 0
    activo: bool = True
    confidencialidad: bool
    integridad: bool
    disponibilidad: bool
    rec_alta: str
    rec_media: str
    rec_baja: str


class FormularioRandomCreate(BaseModel):
    """Payload para autogenerar un Formulario."""
    nombre: str
    descripcion: str
    aplica_nivel_bajo: bool = False
    aplica_nivel_medio: bool = False
    aplica_nivel_alto: bool = False
    total_preguntas: int = 20


class RiskRead(BaseModel):
    """Riesgo con vínculo opcional a control (UML)."""

    model_config = ConfigDict(from_attributes=True)

    id_riesgo: int
    descripcion: str
    impacto: int
    probabilidad: int
    id_activo: int
    id_control: Optional[int] = None


# ── Banco de Preguntas ────────────────────────────────────────────────────────

class BankQuestionCreate(BaseModel):
    """Payload para crear una pregunta en el banco global."""
    texto: str
    dimension: Optional[str] = None
    peso: float = 1.0


class BankQuestionUpdate(BaseModel):
    """Campos editables de una pregunta del banco."""
    texto: Optional[str] = None
    dimension: Optional[str] = None
    peso: Optional[float] = None


class BankQuestionRead(BaseModel):
    """Representación de una pregunta del banco."""
    model_config = ConfigDict(from_attributes=True)

    id_pregunta: int
    texto: str
    dimension: Optional[str] = None
    peso: float
    controles_iso: list[int] = []   # IDs de los Controles ISO vinculados
    formularios: list[int] = []     # IDs de los Formularios que la incluyen
