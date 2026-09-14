from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel, Session, select

from app.access_control import require_admin, require_roles, role_lower
from app.db import engine
from app.schemas import RiskRead
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database.models import (
    ControlORM,
    FormularioORM,
    FormularioPreguntaORM,
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
    def list_items(session: Session = Depends(_get_session), _model: type[SQLModel] = model, current_user: dict = Depends(auth_middleware)):
        if resource == "questionnaires" and role_lower(current_user) == "evaluator":
            from infraestructure.database.models import EvaluacionORM, FormularioORM
            uid = int(current_user["user_id"])
            stmt = (
                select(_model)
                .join(EvaluacionORM, EvaluacionORM.id_formulario == FormularioORM.id_formulario)
                .where(EvaluacionORM.id_evaluador == uid)
                .distinct()
            )
        else:
            stmt = select(_model).order_by(getattr(_model, pk_name))
        rows = session.exec(stmt).all()
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
    read_roles=("admin", "evaluator"),
    write_roles=("admin",),
)

@router.post("/questionnaires/generate-random", name="generate_random_form", dependencies=[Depends(require_roles("admin"))])
def generate_random_form(
    payload: dict,
    session: Session = Depends(_get_session)
):
    """
    Genera un Formulario aleatorio asegurando al menos 1 pregunta por cada Control ISO.
    Si total_preguntas > cantidad_controles, se rellenará con preguntas aleatorias del banco.
    """
    import random
    from infraestructure.database.models import PreguntaControlORM
    
    total_preguntas = int(payload.get("total_preguntas", 20))
    nombre = payload.get("nombre", "Formulario Autogenerado")
    descripcion = payload.get("descripcion", "Autogenerado aleatoriamente.")
    
    # 1. Obtener todos los controles
    controles = session.exec(select(ControlORM)).all()
    if not controles:
        raise HTTPException(status_code=400, detail="No hay controles ISO en la base de datos.")
    
    # 2. Por cada control, obtener sus preguntas
    preguntas_seleccionadas = set()
    todas_preguntas_banco = session.exec(select(PreguntaORM)).all()
    if not todas_preguntas_banco:
        raise HTTPException(status_code=400, detail="El banco de preguntas está vacío.")
        
    for control in controles:
        # Preguntas vinculadas a este control
        links = session.exec(select(PreguntaControlORM).where(PreguntaControlORM.id_control == control.id_control)).all()
        if links:
            elegida = random.choice(links)
            preguntas_seleccionadas.add(elegida.id_pregunta)

    # Si nos pasamos de total_preguntas por asegurar 1 por control, lo acotamos (o lo dejamos, según requerimiento)
    # Rellenar si faltan
    if len(preguntas_seleccionadas) < total_preguntas:
        restantes = [p.id_pregunta for p in todas_preguntas_banco if p.id_pregunta not in preguntas_seleccionadas]
        random.shuffle(restantes)
        faltantes = total_preguntas - len(preguntas_seleccionadas)
        for i in range(min(faltantes, len(restantes))):
            preguntas_seleccionadas.add(restantes[i])
            
    # 3. Crear el Formulario
    nuevo_form = FormularioORM(
        nombre=nombre,
        descripcion=descripcion,
        aplica_nivel_bajo=bool(payload.get("aplica_nivel_bajo", False)),
        aplica_nivel_medio=bool(payload.get("aplica_nivel_medio", False)),
        aplica_nivel_alto=bool(payload.get("aplica_nivel_alto", False)),
        activo=True
    )
    session.add(nuevo_form)
    session.commit()
    session.refresh(nuevo_form)
    
    # 4. Vincular preguntas al Formulario
    for id_pregunta in list(preguntas_seleccionadas)[:total_preguntas]:
        link = FormularioPreguntaORM(id_formulario=nuevo_form.id_formulario, id_pregunta=id_pregunta)
        session.add(link)
    
    session.commit()
    return _serialize(nuevo_form)

_register_single_pk_crud(
    "questionnaires",
    FormularioORM,
    "id_formulario",
    write_roles=("admin",),
)
_register_single_pk_crud(
    "controls",
    ControlORM,
    "id_control",
    write_roles=("admin",),
)


@router.get("/questions/by-questionnaire/{formulario_id}", name="list_questions_by_questionnaire")
def list_questions_by_questionnaire(formulario_id: int, session: Session = Depends(_get_session)):
    """Preguntas de un formulario via tabla intermedia."""
    links = session.exec(
        select(FormularioPreguntaORM).where(FormularioPreguntaORM.id_formulario == formulario_id)
    ).all()
    result = []
    for lnk in links:
        pregunta = session.get(PreguntaORM, lnk.id_pregunta)
        if pregunta:
            row = pregunta.model_dump()
            row["id_formulario"] = formulario_id
            result.append(row)
    return result


_register_single_pk_crud("questions", PreguntaORM, "id_pregunta", write_roles=("admin",))
_register_single_pk_crud("vulnerabilities", VulnerabilidadORM, "id_vulnerabilidad", write_roles=("admin",))


@router.get(
    "/risks/by-control/{control_id}",
    response_model=list[RiskRead],
    name="list_risks_by_control",
)
def list_risks_by_control(control_id: int, session: Session = Depends(_get_session)):
    """Riesgos asociados a un control."""
    rows = session.exec(select(RiesgoORM).where(RiesgoORM.id_control == control_id)).all()
    out: list[RiskRead] = []
    for row in rows:
        if row.id_riesgo is None:
            continue
        out.append(RiskRead.model_validate(row))
    return out


_register_single_pk_crud("risks", RiesgoORM, "id_riesgo", write_roles=("admin",))
