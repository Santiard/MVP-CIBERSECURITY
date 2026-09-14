from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user, is_staff, role_lower
from app.db import engine
from app.schemas import (
    EvaluationCreate,
    EvaluationRead,
    EvaluationUpdate,
)
from infraestructure.database import FormularioORM, EvaluacionORM, UsuarioORM, RolORM
from interfaces.controllers.evaluation_controller import EvaluationController
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

controller = EvaluationController()


def _evaluacion_con_acceso(session: Session, evaluation_id: int, current_user: dict) -> EvaluacionORM:
    ev = session.get(EvaluacionORM, evaluation_id)
    if ev is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    if is_org_user(current_user):
        allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if ev.id_empresa not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para esta evaluación")
        if ev.id_usuario != int(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="No autorizado para esta evaluación")
    elif role_lower(current_user) == "evaluator":
        if ev.id_evaluador is not None and ev.id_evaluador != int(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="No autorizado: Evaluación asignada a otro evaluador")
    return ev


def _eval_to_read(e: EvaluacionORM) -> EvaluationRead:
    eid = e.id_evaluacion or 0
    return EvaluationRead(
        id=eid,
        organization_id=e.id_empresa,
        id_formulario=e.id_formulario,
        answers=e.datos_respuestas or {},
        created_at=e.creado_en,
        user_id=e.id_usuario,
        evaluator_id=e.id_evaluador,
        id_evaluacion=e.id_evaluacion,
        id_empresa=e.id_empresa,
        id_usuario=e.id_usuario,
        id_evaluador=e.id_evaluador,
        fecha=e.fecha,
        estado=e.estado,
    )


@router.post("", response_model=EvaluationRead)
def create_evaluation(input_data: EvaluationCreate, current_user: dict = Depends(auth_middleware)):
    id_empresa = int(input_data.organization_id)
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if id_empresa not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para crear evaluaciones de esta organización")

    self_uid = int(current_user["user_id"])
    if is_org_user(current_user):
        if input_data.user_id is not None and int(input_data.user_id) != self_uid:
            raise HTTPException(
                status_code=403,
                detail="No puede crear evaluaciones asignadas a otro usuario",
            )
        uid = self_uid
    else:
        uid = int(input_data.user_id) if input_data.user_id is not None else self_uid

    # Validar que el Formulario aplique al rol del usuario
    with Session(engine) as session:
        target_user = session.get(UsuarioORM, uid)
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuario asignado no encontrado")
        rol_obj = session.get(RolORM, target_user.id_rol)
        target_role = rol_obj.nombre if rol_obj else ""

        form = session.get(FormularioORM, input_data.id_formulario)
        if not form:
            raise HTTPException(status_code=404, detail="Formulario no encontrado")

        if target_role == "user_nivel_bajo" and not form.aplica_nivel_bajo:
            raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel bajo.")
        elif target_role == "user_nivel_medio" and not form.aplica_nivel_medio:
            raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel medio.")
        elif target_role == "user_nivel_alto" and not form.aplica_nivel_alto:
            raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel alto.")

    fecha_eval = input_data.fecha or date.today()

    payload = input_data.model_dump()
    payload["user_id"] = uid
    if input_data.evaluator_id is not None:
        payload["evaluator_id"] = input_data.evaluator_id
    elif role_lower(current_user) == "evaluator":
        payload["evaluator_id"] = self_uid
    payload["fecha"] = fecha_eval
    if not payload.get("estado"):
        payload["estado"] = "pendiente"
    
    item = controller.create(payload)
    return _eval_to_read(item)


@router.get("", response_model=list[EvaluationRead])
def list_evaluations(
    organization_id: int | None = None,
    id_empresa: int | None = None,
    evaluator_id: int | None = None,
    id_evaluador: int | None = None,
    current_user: dict = Depends(auth_middleware),
):
    org_filter = organization_id if organization_id is not None else id_empresa
    eval_filter = evaluator_id if evaluator_id is not None else id_evaluador
    with Session(engine) as session:
        stmt = select(EvaluacionORM)
        if org_filter is not None:
            stmt = stmt.where(EvaluacionORM.id_empresa == org_filter)
        if eval_filter is not None:
            stmt = stmt.where(EvaluacionORM.id_evaluador == eval_filter)
        if is_org_user(current_user):
            uid = int(current_user["user_id"])
            allowed_ids = get_assigned_organization_ids(session, uid)
            if not allowed_ids:
                return []
            stmt = stmt.where(EvaluacionORM.id_empresa.in_(allowed_ids)).where(EvaluacionORM.id_usuario == uid)
            if org_filter is not None and org_filter not in allowed_ids:
                return []
        elif role_lower(current_user) == "evaluator":
            uid = int(current_user["user_id"])
            stmt = stmt.where(EvaluacionORM.id_evaluador == uid)
        rows = session.exec(stmt).all()
        return [_eval_to_read(e) for e in rows]


@router.get("/{evaluation_id}", response_model=EvaluationRead)
def get_evaluation(evaluation_id: int, current_user: dict = Depends(auth_middleware)):
    with Session(engine) as session:
        item = _evaluacion_con_acceso(session, evaluation_id, current_user)
        return _eval_to_read(item)


@router.patch("/{evaluation_id}", response_model=EvaluationRead)
def update_evaluation(
    evaluation_id: int,
    input_data: EvaluationUpdate,
    current_user: dict = Depends(auth_middleware),
):
    titular_uid: int | None = None
    with Session(engine) as session:
        item = session.get(EvaluacionORM, evaluation_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")
        titular_uid = item.id_usuario
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if item.id_empresa not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")
            if item.id_usuario != int(current_user["user_id"]):
                raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")
            target_org = (
                input_data.organization_id if input_data.organization_id is not None else item.id_empresa
            )
            if target_org not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")
        
        # Validar cambio de formulario
        if input_data.id_formulario is not None and input_data.id_formulario != item.id_formulario:
            target_user = session.get(UsuarioORM, item.id_usuario)
            rol_obj = session.get(RolORM, target_user.id_rol)
            target_role = rol_obj.nombre if rol_obj else ""
            form = session.get(FormularioORM, input_data.id_formulario)
            if not form:
                raise HTTPException(status_code=404, detail="Formulario no encontrado")
            if target_role == "user_nivel_bajo" and not form.aplica_nivel_bajo:
                raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel bajo.")
            elif target_role == "user_nivel_medio" and not form.aplica_nivel_medio:
                raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel medio.")
            elif target_role == "user_nivel_alto" and not form.aplica_nivel_alto:
                raise HTTPException(status_code=400, detail=f"El formulario '{form.nombre}' no aplica para usuarios de nivel alto.")

    patch = input_data.model_dump(exclude_unset=True)
    if "answers" in patch and patch.get("answers") is not None:
        with Session(engine) as session:
            ev = session.get(EvaluacionORM, evaluation_id)
        role = role_lower(current_user)
        uid = int(current_user["user_id"])
        is_titular = role == "user" and titular_uid is not None and uid == titular_uid
        is_assigned_evaluator = role == "evaluator" and ev is not None and ev.id_evaluador == uid
        if not is_titular and not is_assigned_evaluator and role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Solo el usuario titular o el evaluador asignado pueden guardar respuestas del cuestionario.",
            )
    if is_org_user(current_user):
        if patch.get("user_id") is not None and int(patch["user_id"]) != int(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="No puede reasignar la evaluación a otro usuario")
    repo_patch: dict = {}
    if "organization_id" in patch and patch["organization_id"] is not None:
        repo_patch["organization_id"] = patch["organization_id"]
    if "evaluator_id" in patch:
        repo_patch["evaluator_id"] = patch["evaluator_id"]
    if "answers" in patch:
        repo_patch["answers"] = patch["answers"]
    if "user_id" in patch and patch["user_id"] is not None:
        repo_patch["user_id"] = patch["user_id"]
    if "estado" in patch:
        repo_patch["estado"] = patch["estado"]
    if "fecha" in patch:
        repo_patch["fecha"] = patch["fecha"]
    if "id_formulario" in patch:
        repo_patch["id_formulario"] = patch["id_formulario"]

    updated = controller.repo.update(evaluation_id, repo_patch)
    if updated is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    return _eval_to_read(updated)


@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: int, current_user: dict = Depends(auth_middleware)):
    if is_org_user(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para eliminar evaluaciones")
    if not is_staff(current_user):
        raise HTTPException(status_code=403, detail="No autorizado para eliminar evaluaciones")
    with Session(engine) as session:
        if session.get(EvaluacionORM, evaluation_id) is None:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    deleted = controller.repo.delete(evaluation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    return {"deleted": True, "id": evaluation_id}
