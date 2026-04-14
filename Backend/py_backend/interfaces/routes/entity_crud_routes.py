from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel, select

from app.db import engine
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database.models import (
    ActivoORM,
    AmenazaORM,
    ControlORM,
    EmpresaORM,
    EvaluacionORM,
    IndicadorORM,
    NivelMadurezORM,
    PreguntaORM,
    RespuestaORM,
    ResultadoORM,
    RiesgoAmenazaORM,
    RiesgoORM,
    RiesgoVulnerabilidadORM,
    RolORM,
    ScoreORM,
    UsuarioORM,
    UsuarioOrganizacionORM,
    VulnerabilidadORM,
)
from interfaces.middlewares.auth_middleware import auth_middleware


router = APIRouter(
    prefix="/entities",
    tags=["entity-crud"],
    dependencies=[Depends(auth_middleware)],
)


def _get_session():
    with Session(engine) as session:
        yield session


def _serialize(item: Any) -> dict[str, Any]:
    if isinstance(item, SQLModel):
        return item.model_dump()
    if hasattr(item, "dict"):
        return item.dict()
    return dict(item)


def _register_single_pk_crud(resource: str, model: type[SQLModel], pk_name: str) -> None:
    @router.get(f"/{resource}", name=f"list_{resource}")
    def list_items(session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        rows = session.exec(select(_model)).all()
        return [_serialize(row) for row in rows]

    @router.get(f"/{resource}/{{item_id}}", name=f"get_{resource}")
    def get_item(item_id: int, session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        return _serialize(item)

    @router.post(f"/{resource}", name=f"create_{resource}")
    def create_item(payload: dict[str, Any], session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        data = dict(payload)
        data.pop(pk_name, None)
        if resource == "usuarios":
            password = str(data.get("password") or "")
            if not is_strong_password(password):
                raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)
        try:
            item = _model(**data)
            session.add(item)
            session.commit()
            session.refresh(item)
            return _serialize(item)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Invalid payload for {resource}: {exc}")

    @router.patch(f"/{resource}/{{item_id}}", name=f"update_{resource}")
    def update_item(
        item_id: int,
        payload: dict[str, Any],
        session: Session = Depends(_get_session),
        _model: type[SQLModel] = model,
    ):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")

        if resource == "usuarios" and "password" in payload:
            password = str(payload.get("password") or "")
            if not is_strong_password(password):
                raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)

        for key, value in payload.items():
            if key == pk_name:
                continue
            if hasattr(item, key):
                setattr(item, key, value)

        session.add(item)
        session.commit()
        session.refresh(item)
        return _serialize(item)

    @router.delete(f"/{resource}/{{item_id}}", name=f"delete_{resource}")
    def delete_item(item_id: int, session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        session.delete(item)
        session.commit()
        return {"deleted": True, "resource": resource, "id": item_id}


def _register_composite_pk_crud(resource: str, model: type[SQLModel], pk_one: str, pk_two: str) -> None:
    @router.get(f"/{resource}", name=f"list_{resource}")
    def list_items(session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        rows = session.exec(select(_model)).all()
        return [_serialize(row) for row in rows]

    @router.post(f"/{resource}", name=f"create_{resource}")
    def create_item(payload: dict[str, Any], session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        try:
            item = _model(**payload)
            session.add(item)
            session.commit()
            session.refresh(item)
            return _serialize(item)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Invalid payload for {resource}: {exc}")

    @router.get(f"/{resource}/{{pk1}}/{{pk2}}", name=f"get_{resource}")
    def get_item(
        pk1: int,
        pk2: int,
        session: Session = Depends(_get_session),
        _model: type[SQLModel] = model,
    ):
        stmt = select(_model).where(getattr(_model, pk_one) == pk1, getattr(_model, pk_two) == pk2)
        item = session.exec(stmt).first()
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        return _serialize(item)

    @router.delete(f"/{resource}/{{pk1}}/{{pk2}}", name=f"delete_{resource}")
    def delete_item(
        pk1: int,
        pk2: int,
        session: Session = Depends(_get_session),
        _model: type[SQLModel] = model,
    ):
        stmt = select(_model).where(getattr(_model, pk_one) == pk1, getattr(_model, pk_two) == pk2)
        item = session.exec(stmt).first()
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        session.delete(item)
        session.commit()
        return {"deleted": True, "resource": resource, pk_one: pk1, pk_two: pk2}


_register_single_pk_crud("roles", RolORM, "id_rol")
_register_single_pk_crud("usuarios", UsuarioORM, "id_usuario")
_register_single_pk_crud("empresas", EmpresaORM, "id_empresa")
_register_single_pk_crud("evaluaciones", EvaluacionORM, "id_evaluacion")
_register_single_pk_crud("controles", ControlORM, "id_control")
_register_single_pk_crud("preguntas", PreguntaORM, "id_pregunta")
_register_single_pk_crud("respuestas", RespuestaORM, "id_respuesta")
_register_single_pk_crud("niveles-madurez", NivelMadurezORM, "id_nivel")
_register_single_pk_crud("resultados", ResultadoORM, "id_resultado")
_register_single_pk_crud("scores", ScoreORM, "id_score")
_register_single_pk_crud("indicadores", IndicadorORM, "id_indicador")
_register_single_pk_crud("activos", ActivoORM, "id_activo")
_register_single_pk_crud("riesgos", RiesgoORM, "id_riesgo")
_register_single_pk_crud("amenazas", AmenazaORM, "id_amenaza")
_register_single_pk_crud("vulnerabilidades", VulnerabilidadORM, "id_vulnerabilidad")

_register_composite_pk_crud("riesgo-amenaza", RiesgoAmenazaORM, "id_riesgo", "id_amenaza")
_register_composite_pk_crud("riesgo-vulnerabilidad", RiesgoVulnerabilidadORM, "id_riesgo", "id_vulnerabilidad")
_register_composite_pk_crud("usuario-organizacion", UsuarioOrganizacionORM, "id_usuario", "id_organization")