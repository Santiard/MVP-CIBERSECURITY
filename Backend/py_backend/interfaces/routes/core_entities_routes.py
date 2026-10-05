from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel, Session, select

from app.access_control import require_admin, require_roles, role_lower
from app.db import engine
from app.schemas import RiskRead, ControlRead, DimensionRead, ControlCreate, ControlUpdate
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database.models import (
    DimensionORM,
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
    from infraestructure.database.models import FormularioRolORM
    roles_ids = payload.get("roles_ids", [])
    
    nuevo_form = FormularioORM(
        nombre=nombre,
        descripcion=descripcion,
        activo=True
    )
    session.add(nuevo_form)
    session.commit()
    session.refresh(nuevo_form)
    
    # 3.5. Vincular roles
    for rid in roles_ids:
        link_rol = FormularioRolORM(id_formulario=nuevo_form.id_formulario, id_rol=int(rid))
        session.add(link_rol)
    session.commit()
    
    # 4. Vincular preguntas al Formulario
    for id_pregunta in list(preguntas_seleccionadas)[:total_preguntas]:
        link = FormularioPreguntaORM(id_formulario=nuevo_form.id_formulario, id_pregunta=id_pregunta)
        session.add(link)
    
    session.commit()
    return _serialize(nuevo_form)

@router.get("/questionnaires", name="list_questionnaires", dependencies=[Depends(require_roles("admin", "evaluator"))])
def list_questionnaires(session: Session = Depends(_get_session), current_user: dict = Depends(auth_middleware)):
    from infraestructure.database.models import EvaluacionORM, FormularioORM, FormularioRolORM
    
    if role_lower(current_user) == "evaluator":
        uid = int(current_user["user_id"])
        stmt = (
            select(FormularioORM)
            .join(EvaluacionORM, EvaluacionORM.id_formulario == FormularioORM.id_formulario)
            .where(EvaluacionORM.id_evaluador == uid)
            .distinct()
        )
    else:
        stmt = select(FormularioORM).order_by(FormularioORM.id_formulario)
        
    rows = session.exec(stmt).all()
    out = []
    for row in rows:
        d = _serialize(row)
        roles = session.exec(select(FormularioRolORM.id_rol).where(FormularioRolORM.id_formulario == row.id_formulario)).all()
        d["roles_ids"] = roles
        out.append(d)
    return out

@router.get("/questionnaires/{item_id}", name="get_questionnaires", dependencies=[Depends(require_roles("admin", "evaluator"))])
def get_questionnaires(item_id: int, session: Session = Depends(_get_session)):
    from infraestructure.database.models import FormularioRolORM
    item = session.get(FormularioORM, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="questionnaires not found")
    d = _serialize(item)
    roles = session.exec(select(FormularioRolORM.id_rol).where(FormularioRolORM.id_formulario == item.id_formulario)).all()
    d["roles_ids"] = roles
    return d

@router.post("/questionnaires", name="create_questionnaires", dependencies=[Depends(require_roles("admin"))])
def create_questionnaires(payload: dict[str, Any], session: Session = Depends(_get_session)):
    from infraestructure.database.models import FormularioRolORM
    data = dict(payload)
    roles_ids = data.pop("roles_ids", [])
    data.pop("id_formulario", None)
    
    item = FormularioORM(**data)
    session.add(item)
    session.commit()
    session.refresh(item)
    
    for rid in roles_ids:
        session.add(FormularioRolORM(id_formulario=item.id_formulario, id_rol=int(rid)))
    session.commit()
    
    d = _serialize(item)
    d["roles_ids"] = roles_ids
    return d

@router.patch("/questionnaires/{item_id}", name="update_questionnaires", dependencies=[Depends(require_roles("admin"))])
def update_questionnaires(item_id: int, payload: dict[str, Any], session: Session = Depends(_get_session)):
    from infraestructure.database.models import FormularioRolORM
    item = session.get(FormularioORM, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="questionnaires not found")
        
    roles_ids = payload.get("roles_ids")
    
    for k, v in payload.items():
        if k in ("id_formulario", "roles_ids"): continue
        if hasattr(item, k):
            setattr(item, k, v)
            
    if roles_ids is not None:
        session.exec(delete(FormularioRolORM).where(FormularioRolORM.id_formulario == item.id_formulario))
        for rid in roles_ids:
            session.add(FormularioRolORM(id_formulario=item.id_formulario, id_rol=int(rid)))
            
    session.add(item)
    session.commit()
    session.refresh(item)
    
    d = _serialize(item)
    final_roles = session.exec(select(FormularioRolORM.id_rol).where(FormularioRolORM.id_formulario == item.id_formulario)).all()
    d["roles_ids"] = final_roles
    return d

@router.delete("/questionnaires/{item_id}", name="delete_questionnaires", dependencies=[Depends(require_roles("admin"))])
def delete_questionnaires(item_id: int, session: Session = Depends(_get_session)):
    from infraestructure.database.models import FormularioRolORM
    item = session.get(FormularioORM, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="questionnaires not found")
    session.exec(delete(FormularioRolORM).where(FormularioRolORM.id_formulario == item.id_formulario))
    session.delete(item)
    session.commit()
    return {"deleted": True, "resource": "questionnaires", "id": item_id}


@router.get("/controls", response_model=list[ControlRead], name="list_controls")
def list_controls(session: Session = Depends(_get_session)):
    return session.exec(select(ControlORM).order_by(ControlORM.id_control)).all()

@router.get("/controls/{control_id}", response_model=ControlRead, name="get_control")
def get_control(control_id: int, session: Session = Depends(_get_session)):
    c = session.get(ControlORM, control_id)
    if not c: raise HTTPException(404, "Control no encontrado")
    return c

@router.post("/controls", response_model=ControlRead, name="create_control", dependencies=[Depends(require_roles("admin"))])
def create_control(payload: ControlCreate, session: Session = Depends(_get_session)):
    c = ControlORM(
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        activo=payload.activo,
        rec_alta=payload.rec_alta,
        rec_media=payload.rec_media,
        rec_baja=payload.rec_baja
    )
    if payload.dimensiones_ids:
        dims = session.exec(select(DimensionORM).where(col(DimensionORM.id_dimension).in_(payload.dimensiones_ids))).all()
        c.dimensiones = list(dims)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@router.put("/controls/{control_id}", response_model=ControlRead, name="update_control", dependencies=[Depends(require_roles("admin"))])
def update_control(control_id: int, payload: ControlUpdate, session: Session = Depends(_get_session)):
    c = session.get(ControlORM, control_id)
    if not c:
        raise HTTPException(404, "Control no encontrado")
    
    update_data = payload.model_dump(exclude_unset=True)
    dim_ids = update_data.pop("dimensiones_ids", None)
    
    for key, val in update_data.items():
        setattr(c, key, val)
        
    if dim_ids is not None:
        dims = session.exec(select(DimensionORM).where(col(DimensionORM.id_dimension).in_(dim_ids))).all()
        c.dimensiones = list(dims)
        
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@router.delete("/controls/{control_id}", name="delete_control", dependencies=[Depends(require_roles("admin"))])
def delete_control(control_id: int, session: Session = Depends(_get_session)):
    c = session.get(ControlORM, control_id)
    if not c:
        raise HTTPException(404, "Control no encontrado")
    session.delete(c)
    session.commit()
    return {"deleted": True, "id": control_id}


_register_single_pk_crud("dimensions", DimensionORM, "id_dimension", write_roles=("admin",))



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
