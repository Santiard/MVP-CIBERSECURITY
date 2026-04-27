from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel, Session, select

from app.access_control import require_admin, require_roles
from app.db import engine
from app.schemas import RiskRead
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database.models import (
    ControlORM,
    PreguntaORM,
    RiesgoORM,
    RolORM,
    UsuarioORM,
    VulnerabilidadORM,
)
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(
    tags=["core-entities"],
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


def _register_single_pk_crud(
    resource: str,
    model: type[SQLModel],
    pk_name: str,
    validate_password: bool = False,
    *,
    read_roles: tuple[str, ...] | None = None,
    write_roles: tuple[str, ...] | None = None,
) -> None:
    read_deps = [Depends(require_roles(*read_roles))] if read_roles else []
    write_deps = [Depends(require_roles(*write_roles))] if write_roles else []

    @router.get(f"/{resource}", name=f"list_{resource}", dependencies=read_deps)
    def list_items(session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        rows = session.exec(select(_model)).all()
        return [_serialize(row) for row in rows]

    @router.get(f"/{resource}/{{item_id}}", name=f"get_{resource}", dependencies=read_deps)
    def get_item(item_id: int, session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        return _serialize(item)

    @router.post(f"/{resource}", name=f"create_{resource}", dependencies=write_deps)
    def create_item(payload: dict[str, Any], session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        data = dict(payload)
        data.pop(pk_name, None)

        if validate_password:
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

    @router.patch(f"/{resource}/{{item_id}}", name=f"update_{resource}", dependencies=write_deps)
    def update_item(
        item_id: int,
        payload: dict[str, Any],
        session: Session = Depends(_get_session),
        _model: type[SQLModel] = model,
    ):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")

        if validate_password and "password" in payload:
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

    @router.delete(f"/{resource}/{{item_id}}", name=f"delete_{resource}", dependencies=write_deps)
    def delete_item(item_id: int, session: Session = Depends(_get_session), _model: type[SQLModel] = model):
        item = session.get(_model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{resource} not found")
        session.delete(item)
        session.commit()
        return {"deleted": True, "resource": resource, "id": item_id}


_register_single_pk_crud("roles", RolORM, "id_rol", write_roles=("admin",))
_register_single_pk_crud(
    "users",
    UsuarioORM,
    "id_usuario",
    validate_password=True,
    read_roles=("admin",),
    write_roles=("admin",),
)
_register_single_pk_crud(
    "questionnaires",
    ControlORM,
    "id_control",
    write_roles=("admin",),
)


@router.get("/questions/by-control/{control_id}", name="list_questions_by_control")
def list_questions_by_control(control_id: int, session: Session = Depends(_get_session)):
    """Preguntas de un control (cuestionario); el listado global `GET /questions` no filtra por control."""
    rows = session.exec(select(PreguntaORM).where(PreguntaORM.id_control == control_id)).all()
    return [_serialize(row) for row in rows]


_register_single_pk_crud("questions", PreguntaORM, "id_pregunta", write_roles=("admin",))
_register_single_pk_crud("vulnerabilities", VulnerabilidadORM, "id_vulnerabilidad", write_roles=("admin",))


@router.get(
    "/risks/by-control/{control_id}",
    response_model=list[RiskRead],
    name="list_risks_by_control",
)
def list_risks_by_control(control_id: int, session: Session = Depends(_get_session)):
    """Riesgos asociados a un control (`id_control`); complementa POST/PATCH `/risks` con `id_control` en el cuerpo."""
    rows = session.exec(select(RiesgoORM).where(RiesgoORM.id_control == control_id)).all()
    out: list[RiskRead] = []
    for row in rows:
        if row.id_riesgo is None:
            continue
        out.append(RiskRead.model_validate(row))
    return out


_register_single_pk_crud("risks", RiesgoORM, "id_riesgo", write_roles=("admin",))
