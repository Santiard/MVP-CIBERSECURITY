from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user, is_staff, role_lower
from app.db import engine
from app.schemas import (
    ControlLinkedRead,
    EvaluationCreate,
    EvaluationLinkControlsBody,
    EvaluationRead,
    EvaluationUpdate,
)
from infraestructure.database import ControlORM, EvaluacionControlORM, EvaluacionORM
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
    return ev


def _eval_to_read(e: EvaluacionORM) -> EvaluationRead:
    eid = e.id_evaluacion or 0
    return EvaluationRead(
        id=eid,
        organization_id=e.id_empresa,
        answers=e.datos_respuestas or {},
        created_at=e.creado_en,
        user_id=e.id_usuario,
        id_evaluacion=e.id_evaluacion,
        id_empresa=e.id_empresa,
        id_usuario=e.id_usuario,
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
    fecha_eval = input_data.fecha or date.today()

    with Session(engine) as session:
        exists = session.exec(
            select(EvaluacionORM).where(
                (EvaluacionORM.id_empresa == id_empresa)
                & (EvaluacionORM.id_usuario == uid)
                & (EvaluacionORM.fecha == fecha_eval)
            )
        ).first()
        if exists:
            raise HTTPException(
                status_code=409,
                detail="Ya existe una evaluación para este usuario, empresa y fecha",
            )

    payload = input_data.model_dump()
    payload["user_id"] = uid
    payload["fecha"] = fecha_eval
    if not payload.get("estado"):
        payload["estado"] = "pendiente"
    item = controller.create(payload)
    return _eval_to_read(item)


@router.get("", response_model=list[EvaluationRead])
def list_evaluations(
    organization_id: int | None = None,
    id_empresa: int | None = None,
    current_user: dict = Depends(auth_middleware),
):
    org_filter = organization_id if organization_id is not None else id_empresa
    with Session(engine) as session:
        stmt = select(EvaluacionORM)
        if org_filter is not None:
            stmt = stmt.where(EvaluacionORM.id_empresa == org_filter)
        if is_org_user(current_user):
            uid = int(current_user["user_id"])
            allowed_ids = get_assigned_organization_ids(session, uid)
            if not allowed_ids:
                return []
            stmt = stmt.where(EvaluacionORM.id_empresa.in_(allowed_ids)).where(EvaluacionORM.id_usuario == uid)
            if org_filter is not None and org_filter not in allowed_ids:
                return []
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

    patch = input_data.model_dump(exclude_unset=True)
    if "answers" in patch and patch.get("answers") is not None and titular_uid is not None:
        if role_lower(current_user) != "user" or int(current_user["user_id"]) != titular_uid:
            raise HTTPException(
                status_code=403,
                detail="Solo el usuario titular de la evaluación (rol «user») puede guardar respuestas del cuestionario.",
            )
    if is_org_user(current_user):
        if patch.get("user_id") is not None and int(patch["user_id"]) != int(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="No puede reasignar la evaluación a otro usuario")
    repo_patch: dict = {}
    if "organization_id" in patch and patch["organization_id"] is not None:
        repo_patch["organization_id"] = patch["organization_id"]
    if "answers" in patch:
        repo_patch["answers"] = patch["answers"]
    if "user_id" in patch and patch["user_id"] is not None:
        repo_patch["user_id"] = patch["user_id"]
    if "estado" in patch:
        repo_patch["estado"] = patch["estado"]
    if "fecha" in patch:
        repo_patch["fecha"] = patch["fecha"]

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


@router.get("/{evaluation_id}/controles", response_model=list[ControlLinkedRead])
def list_controls_for_evaluation(
    evaluation_id: int,
    current_user: dict = Depends(auth_middleware),
):
    """Controles enlazados a la evaluación (tabla evaluacion_control)."""
    with Session(engine) as session:
        _evaluacion_con_acceso(session, evaluation_id, current_user)
        stmt = (
            select(ControlORM)
            .join(
                EvaluacionControlORM,
                EvaluacionControlORM.id_control == ControlORM.id_control,
            )
            .where(EvaluacionControlORM.id_evaluacion == evaluation_id)
        )
        rows = session.exec(stmt).all()
        return [ControlLinkedRead.model_validate(c) for c in rows]


@router.delete("/{evaluation_id}/controles/{control_id}")
def detach_control_from_evaluation(
    evaluation_id: int,
    control_id: int,
    current_user: dict = Depends(auth_middleware),
):
    """Quita el vínculo Evaluación–Control (no borra el control)."""
    with Session(engine) as session:
        _evaluacion_con_acceso(session, evaluation_id, current_user)
        link = session.exec(
            select(EvaluacionControlORM).where(
                EvaluacionControlORM.id_evaluacion == evaluation_id,
                EvaluacionControlORM.id_control == control_id,
            )
        ).first()
        if link is None:
            raise HTTPException(
                status_code=404,
                detail="Este control no está vinculado a la evaluación",
            )
        session.delete(link)
        session.commit()
    return {"deleted": True, "evaluation_id": evaluation_id, "control_id": control_id}


@router.post("/{evaluation_id}/controles", status_code=201)
def attach_controls_bulk(
    evaluation_id: int,
    body: EvaluationLinkControlsBody,
    current_user: dict = Depends(auth_middleware),
):
    """Enlaza varios controles a la vez (omitir los ya enlazados)."""
    with Session(engine) as session:
        _evaluacion_con_acceso(session, evaluation_id, current_user)
        created = 0
        for control_id in body.control_ids:
            ctrl = session.get(ControlORM, control_id)
            if ctrl is None:
                raise HTTPException(status_code=404, detail=f"Control {control_id} no existe")
            exists = session.exec(
                select(EvaluacionControlORM).where(
                    EvaluacionControlORM.id_evaluacion == evaluation_id,
                    EvaluacionControlORM.id_control == control_id,
                )
            ).first()
            if exists is None:
                session.add(EvaluacionControlORM(id_evaluacion=evaluation_id, id_control=control_id))
                created += 1
        session.commit()
    return {
        "evaluation_id": evaluation_id,
        "control_ids": body.control_ids,
        "new_links": created,
    }


@router.post("/{evaluation_id}/controles/{control_id}", status_code=201)
def attach_control_to_evaluation(
    evaluation_id: int,
    control_id: int,
    current_user: dict = Depends(auth_middleware),
):
    """UML: asociar un Control al alcance de una Evaluación (tabla evaluacion_control)."""
    with Session(engine) as session:
        _evaluacion_con_acceso(session, evaluation_id, current_user)
        ctrl = session.get(ControlORM, control_id)
        if ctrl is None:
            raise HTTPException(status_code=404, detail="Control no encontrado")
        exists = session.exec(
            select(EvaluacionControlORM).where(
                EvaluacionControlORM.id_evaluacion == evaluation_id,
                EvaluacionControlORM.id_control == control_id,
            )
        ).first()
        if exists:
            return {"evaluation_id": evaluation_id, "control_id": control_id, "linked": True, "already": True}
        session.add(EvaluacionControlORM(id_evaluacion=evaluation_id, id_control=control_id))
        session.commit()
    return {"evaluation_id": evaluation_id, "control_id": control_id, "linked": True}
