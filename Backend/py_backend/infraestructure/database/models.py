from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel


class RolORM(SQLModel, table=True):
    __tablename__ = "roles"

    id_rol: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()

    usuarios: list["UsuarioORM"] = Relationship(back_populates="rol")


class UsuarioORM(SQLModel, table=True):
    __tablename__ = "usuarios"

    id_usuario: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()
    correo: str = Field()
    telefono: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)
    password: str = Field()
    id_rol: int = Field(foreign_key="roles.id_rol")

    rol: Optional["RolORM"] = Relationship(back_populates="usuarios")
    evaluaciones: list["EvaluacionORM"] = Relationship(back_populates="usuario")
    asignaciones_empresa: list["UsuarioOrganizacionORM"] = Relationship(back_populates="usuario")
    password_reset_tokens: list["PasswordResetTokenORM"] = Relationship(back_populates="usuario")


class EmpresaORM(SQLModel, table=True):
    __tablename__ = "empresas"

    id_empresa: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()
    sector: str = Field()
    tamano: str = Field()
    correo: Optional[str] = Field(default=None)
    nit: Optional[str] = Field(default=None)
    direccion: Optional[str] = Field(default=None)
    telefono: Optional[str] = Field(default=None)

    evaluaciones: list["EvaluacionORM"] = Relationship(back_populates="empresa")
    activos: list["ActivoORM"] = Relationship(back_populates="empresa")
    asignaciones_usuario: list["UsuarioOrganizacionORM"] = Relationship(back_populates="empresa")


class EvaluacionControlORM(SQLModel, table=True):
    """UML: una Evaluación evalúa uno o más Controles (alcance de la evaluación)."""

    __tablename__ = "evaluacion_control"

    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion", primary_key=True)
    id_control: int = Field(foreign_key="controles.id_control", primary_key=True)


class EvaluacionORM(SQLModel, table=True):
    __tablename__ = "evaluaciones"

    id_evaluacion: Optional[int] = Field(default=None, primary_key=True)
    fecha: date = Field()
    estado: str = Field()
    id_usuario: int = Field(foreign_key="usuarios.id_usuario")
    id_empresa: int = Field(foreign_key="empresas.id_empresa")
    datos_respuestas: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    usuario: Optional["UsuarioORM"] = Relationship(back_populates="evaluaciones")
    empresa: Optional["EmpresaORM"] = Relationship(back_populates="evaluaciones")
    respuestas: list["RespuestaORM"] = Relationship(back_populates="evaluacion")
    resultados: list["ResultadoORM"] = Relationship(back_populates="evaluacion")
    score: Optional["ScoreORM"] = Relationship(back_populates="evaluacion")
    controles: list["ControlORM"] = Relationship(
        back_populates="evaluaciones",
        link_model=EvaluacionControlORM,
    )


class ControlORM(SQLModel, table=True):
    __tablename__ = "controles"

    id_control: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()
    descripcion: str = Field()
    dimensiones: int = Field(default=0)
    activo: bool = Field(default=True)
    confidencialidad: bool = Field()
    integridad: bool = Field()
    disponibilidad: bool = Field()

    preguntas: list["PreguntaORM"] = Relationship(back_populates="control")
    indicadores: list["IndicadorORM"] = Relationship(back_populates="control")
    resultados: list["ResultadoORM"] = Relationship(back_populates="control")
    evaluaciones: list["EvaluacionORM"] = Relationship(
        back_populates="controles",
        link_model=EvaluacionControlORM,
    )
    riesgos: list["RiesgoORM"] = Relationship(back_populates="control")


class PreguntaORM(SQLModel, table=True):
    __tablename__ = "preguntas"

    id_pregunta: Optional[int] = Field(default=None, primary_key=True)
    texto: str = Field()
    peso: float = Field()
    id_control: int = Field(foreign_key="controles.id_control")

    control: Optional["ControlORM"] = Relationship(back_populates="preguntas")
    respuestas: list["RespuestaORM"] = Relationship(back_populates="pregunta")


class RespuestaORM(SQLModel, table=True):
    __tablename__ = "respuestas"

    id_respuesta: Optional[int] = Field(default=None, primary_key=True)
    valor: int = Field()
    comentario: Optional[str] = Field(default=None)
    id_pregunta: int = Field(foreign_key="preguntas.id_pregunta")
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion")

    pregunta: Optional["PreguntaORM"] = Relationship(back_populates="respuestas")
    evaluacion: Optional["EvaluacionORM"] = Relationship(back_populates="respuestas")



class NivelMadurezORM(SQLModel, table=True):
    __tablename__ = "niveles_madurez"

    id_nivel: Optional[int] = Field(default=None, primary_key=True)
    nivel: int = Field()
    descripcion: str = Field()

    resultados: list["ResultadoORM"] = Relationship(back_populates="nivel")


class ResultadoORM(SQLModel, table=True):
    __tablename__ = "resultados"

    id_resultado: Optional[int] = Field(default=None, primary_key=True)
    puntaje: float = Field()
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion")
    id_control: int = Field(foreign_key="controles.id_control")
    id_nivel: int = Field(foreign_key="niveles_madurez.id_nivel")

    evaluacion: Optional["EvaluacionORM"] = Relationship(back_populates="resultados")
    control: Optional["ControlORM"] = Relationship(back_populates="resultados")
    nivel: Optional["NivelMadurezORM"] = Relationship(back_populates="resultados")


class ScoreORM(SQLModel, table=True):
    __tablename__ = "scores"

    id_score: Optional[int] = Field(default=None, primary_key=True)
    valor_total: float = Field()
    id_evaluacion: int = Field(foreign_key="evaluaciones.id_evaluacion", sa_column_kwargs={"unique": True})

    evaluacion: Optional["EvaluacionORM"] = Relationship(back_populates="score")


class IndicadorORM(SQLModel, table=True):
    __tablename__ = "indicadores"

    id_indicador: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()
    formula: str = Field()
    frecuencia: str = Field()
    id_control: int = Field(foreign_key="controles.id_control")

    control: Optional["ControlORM"] = Relationship(back_populates="indicadores")


class ActivoORM(SQLModel, table=True):
    __tablename__ = "activos"

    id_activo: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()
    valor: int = Field()
    id_empresa: int = Field(foreign_key="empresas.id_empresa")

    empresa: Optional["EmpresaORM"] = Relationship(back_populates="activos")
    riesgos: list["RiesgoORM"] = Relationship(back_populates="activo")


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
    descripcion: str = Field()
    impacto: int = Field()
    probabilidad: int = Field()
    id_activo: int = Field(foreign_key="activos.id_activo")
    id_control: Optional[int] = Field(default=None, foreign_key="controles.id_control")

    activo: Optional["ActivoORM"] = Relationship(back_populates="riesgos")
    control: Optional["ControlORM"] = Relationship(back_populates="riesgos")
    amenazas: list["AmenazaORM"] = Relationship(back_populates="riesgos", link_model=RiesgoAmenazaORM)
    vulnerabilidades: list["VulnerabilidadORM"] = Relationship(
        back_populates="riesgos",
        link_model=RiesgoVulnerabilidadORM,
    )


class AmenazaORM(SQLModel, table=True):
    __tablename__ = "amenazas"

    id_amenaza: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field()

    riesgos: list["RiesgoORM"] = Relationship(back_populates="amenazas", link_model=RiesgoAmenazaORM)


class VulnerabilidadORM(SQLModel, table=True):
    __tablename__ = "vulnerabilidades"

    id_vulnerabilidad: Optional[int] = Field(default=None, primary_key=True)
    descripcion: str = Field()

    riesgos: list["RiesgoORM"] = Relationship(
        back_populates="vulnerabilidades",
        link_model=RiesgoVulnerabilidadORM,
    )


class PasswordResetTokenORM(SQLModel, table=True):
    """Token opaco de un solo uso para restablecer contraseña (hash persistido)."""

    __tablename__ = "password_reset_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: int = Field(foreign_key="usuarios.id_usuario", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    expires_at: datetime = Field()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    used_at: Optional[datetime] = Field(default=None)

    usuario: Optional["UsuarioORM"] = Relationship(back_populates="password_reset_tokens")


class UsuarioOrganizacionORM(SQLModel, table=True):
    """Asignación usuario ↔ empresa (organización), alineado al dominio Empresa del UML."""

    __tablename__ = "usuario_organizacion"

    id_usuario: int = Field(foreign_key="usuarios.id_usuario", primary_key=True)
    id_empresa: int = Field(foreign_key="empresas.id_empresa", primary_key=True)

    usuario: Optional["UsuarioORM"] = Relationship(back_populates="asignaciones_empresa")
    empresa: Optional["EmpresaORM"] = Relationship(back_populates="asignaciones_usuario")
