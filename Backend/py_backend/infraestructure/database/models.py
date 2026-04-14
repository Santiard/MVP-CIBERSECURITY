from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class RolORM(SQLModel, table=True):
    __tablename__ = "roles"

    id_rol: Optional[int] = Field(default=None, primary_key=True)
    nombre: str

    usuarios: list[UsuarioORM] = Relationship(back_populates="rol")


class UsuarioORM(SQLModel, table=True):
    __tablename__ = "usuarios"

    id_usuario: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    correo: str = Field(sa_column_kwargs={"unique": True})
    telefono: Optional[str] = None
    activo: bool = True
    password: str
    id_rol: int = Field(foreign_key="roles.id_rol")

    rol: Optional[RolORM] = Relationship(back_populates="usuarios")
    evaluaciones: list[EvaluacionORM] = Relationship(back_populates="usuario")


class EmpresaORM(SQLModel, table=True):
    __tablename__ = "empresas"

    id_empresa: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    sector: str
    tamano: str

    evaluaciones: list[EvaluacionORM] = Relationship(back_populates="empresa")
    activos: list[ActivoORM] = Relationship(back_populates="empresa")


class EvaluacionORM(SQLModel, table=True):
    __tablename__ = "evaluaciones"

    id_evaluacion: Optional[int] = Field(default=None, primary_key=True)
    fecha: date
    estado: str
    id_usuario: int = Field(foreign_key="usuarios.id_usuario")
    id_empresa: int = Field(foreign_key="empresas.id_empresa")

    usuario: Optional[UsuarioORM] = Relationship(back_populates="evaluaciones")
    empresa: Optional[EmpresaORM] = Relationship(back_populates="evaluaciones")
    respuestas: list[RespuestaORM] = Relationship(back_populates="evaluacion")
    resultados: list[ResultadoORM] = Relationship(back_populates="evaluacion")
    score: Optional[ScoreORM] = Relationship(back_populates="evaluacion")


class ControlORM(SQLModel, table=True):
    __tablename__ = "controles"

    id_control: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    descripcion: str
    dimensiones: int = 0
    activo: bool = True
    confidencialidad: bool
    integridad: bool
    disponibilidad: bool

    preguntas: list[PreguntaORM] = Relationship(back_populates="control")
    indicadores: list[IndicadorORM] = Relationship(back_populates="control")
    resultados: list[ResultadoORM] = Relationship(back_populates="control")


class PreguntaORM(SQLModel, table=True):
    __tablename__ = "preguntas"

    id_pregunta: Optional[int] = Field(default=None, primary_key=True)
    texto: str
    peso: float
    id_control: int = Field(foreign_key="controles.id_control")

    control: Optional[ControlORM] = Relationship(back_populates="preguntas")
    respuestas: list[RespuestaORM] = Relationship(back_populates="pregunta")


class RespuestaORM(SQLModel, table=True):
    __tablename__ = "respuestas"

    id_respuesta: Optional[int] = Field(default=None, primary_key=True)
    valor: int
    comentario: str
    id_pregunta: int = Field(foreign_key="preguntas.id_pregunta")
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion")

    pregunta: Optional[PreguntaORM] = Relationship(back_populates="respuestas")
    evaluacion: Optional[EvaluacionORM] = Relationship(back_populates="respuestas")


class NivelMadurezORM(SQLModel, table=True):
    __tablename__ = "niveles_madurez"

    id_nivel: Optional[int] = Field(default=None, primary_key=True)
    nivel: int
    descripcion: str

    resultados: list[ResultadoORM] = Relationship(back_populates="nivel")


class ResultadoORM(SQLModel, table=True):
    __tablename__ = "resultados"

    id_resultado: Optional[int] = Field(default=None, primary_key=True)
    puntaje: float
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion")
    id_control: int = Field(foreign_key="controles.id_control")
    id_nivel: int = Field(foreign_key="niveles_madurez.id_nivel")

    evaluacion: Optional[EvaluacionORM] = Relationship(back_populates="resultados")
    control: Optional[ControlORM] = Relationship(back_populates="resultados")
    nivel: Optional[NivelMadurezORM] = Relationship(back_populates="resultados")


class ScoreORM(SQLModel, table=True):
    __tablename__ = "scores"

    id_score: Optional[int] = Field(default=None, primary_key=True)
    valor_total: float
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion", sa_column_kwargs={"unique": True})

    evaluacion: Optional[EvaluacionORM] = Relationship(back_populates="score")


class IndicadorORM(SQLModel, table=True):
    __tablename__ = "indicadores"

    id_indicador: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    formula: str
    frecuencia: str
    id_control: int = Field(foreign_key="controles.id_control")

    control: Optional[ControlORM] = Relationship(back_populates="indicadores")


class ActivoORM(SQLModel, table=True):
    __tablename__ = "activos"

    id_activo: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    valor: int
    id_empresa: int = Field(foreign_key="empresas.id_empresa")

    empresa: Optional[EmpresaORM] = Relationship(back_populates="activos")
    riesgos: list[RiesgoORM] = Relationship(back_populates="activo")


class RiesgoAmenazaORM(SQLModel, table=True):
    __tablename__ = "riesgo_amenaza"

    id_riesgo: int = Field(foreign_key="riesgos.id_riesgo", primary_key=True)
    id_amenaza: int = Field(foreign_key="amenazas.id_amenaza", primary_key=True)


class RiesgoVulnerabilidadORM(SQLModel, table=True):
    __tablename__ = "riesgo_vulnerabilidad"

    id_riesgo: int = Field(foreign_key="riesgos.id_riesgo", primary_key=True)
    id_vulnerabilidad: int = Field(foreign_key="vulnerabilidades.id_vulnerabilidad", primary_key=True)


class RiesgoORM(SQLModel, table=True):
    __tablename__ = "riesgos"

    id_riesgo: Optional[int] = Field(default=None, primary_key=True)
    descripcion: str
    impacto: int
    probabilidad: int
    id_activo: int = Field(foreign_key="activos.id_activo")

    activo: Optional[ActivoORM] = Relationship(back_populates="riesgos")
    amenazas: list[AmenazaORM] = Relationship(back_populates="riesgos", link_model=RiesgoAmenazaORM)
    vulnerabilidades: list[VulnerabilidadORM] = Relationship(
        back_populates="riesgos",
        link_model=RiesgoVulnerabilidadORM,
    )


class AmenazaORM(SQLModel, table=True):
    __tablename__ = "amenazas"

    id_amenaza: Optional[int] = Field(default=None, primary_key=True)
    nombre: str

    riesgos: list[RiesgoORM] = Relationship(back_populates="amenazas", link_model=RiesgoAmenazaORM)


class VulnerabilidadORM(SQLModel, table=True):
    __tablename__ = "vulnerabilidades"

    id_vulnerabilidad: Optional[int] = Field(default=None, primary_key=True)
    descripcion: str

    riesgos: list[RiesgoORM] = Relationship(
        back_populates="vulnerabilidades",
        link_model=RiesgoVulnerabilidadORM,
    )


class UsuarioOrganizacionORM(SQLModel, table=True):
    __tablename__ = "usuario_organizacion"

    id_usuario: int = Field(foreign_key="usuarios.id_usuario", primary_key=True)
    id_organization: int = Field(foreign_key="organization.id", primary_key=True)
