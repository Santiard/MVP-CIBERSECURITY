from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.access_control import get_assigned_organization_ids, is_org_user
from app.db import engine
from infraestructure.database import EvaluacionORM
from interfaces.controllers.evaluation_controller import EvaluationController
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("", response_model=EvaluationRead)
def create_evaluation(input_data: EvaluationCreate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if input_data.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para crear evaluaciones de esta organización")
    # Set the user_id from the current user if not provided
    payload = input_data.model_dump()
    if payload.get("user_id") is None:
        payload["user_id"] = int(current_user["user_id"])
    return controller.create(payload)
from datetime import date

@router.post("")
def create_evaluation(input_data: dict, current_user=Depends(auth_middleware)):
    data = dict(input_data)
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if data.get("id_empresa") not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para crear evaluaciones de esta empresa")
    # Validar duplicado: misma empresa, usuario y fecha
    with Session(engine) as session:
        id_empresa = data.get("id_empresa")
        id_usuario = data.get("id_usuario") or int(current_user["user_id"])
        fecha_eval = data.get("fecha") or date.today()
        exists = session.exec(
            select(EvaluacionORM).where(
                (EvaluacionORM.id_empresa == id_empresa) &
                (EvaluacionORM.id_usuario == id_usuario) &
                (EvaluacionORM.fecha == fecha_eval)
            )
        ).first()
        if exists:
            raise HTTPException(status_code=409, detail="Ya existe una evaluación para este usuario, empresa y fecha")
        evaluacion = EvaluacionORM(
            id_empresa=id_empresa,
            id_usuario=id_usuario,
            fecha=fecha_eval,
            estado=data.get("estado", "pendiente")
        )
        session.add(evaluacion)
        session.commit()
        session.refresh(evaluacion)
        return evaluacion


@router.get("")
def list_evaluations(organization_id: int | None = None, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        stmt = select(EvaluationModel)

        if organization_id is not None:
            stmt = stmt.where(EvaluationModel.organization_id == organization_id)

        if is_org_user(current_user):
            allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
            if not allowed_ids:
                return []
            stmt = stmt.where(EvaluationModel.organization_id.in_(allowed_ids))

            if organization_id is not None and organization_id not in allowed_ids:
                return []

        return session.exec(stmt).all()
@router.get("")
def list_evaluations(id_empresa: int | None = None, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        stmt = select(EvaluacionORM)
        if id_empresa is not None:
            stmt = stmt.where(EvaluacionORM.id_empresa == id_empresa)
        if is_org_user(current_user):
            allowed_ids = get_assigned_organization_ids(session, int(current_user["user_id"]))
            if not allowed_ids:
                return []
            stmt = stmt.where(EvaluacionORM.id_empresa.in_(allowed_ids))
            if id_empresa is not None and id_empresa not in allowed_ids:
                return []
        return session.exec(stmt).all()


@router.get("/{evaluation_id}")
def get_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    item = controller.get_by_id(evaluation_id)
    if is_org_user(current_user):
        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if item.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para ver esta evaluación")
    return item
@router.get("/{evaluation_id}")
def get_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        item = session.get(EvaluacionORM, evaluation_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if item.id_empresa not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para ver esta evaluación")
        return item


@router.patch("/{evaluation_id}", response_model=EvaluationRead)
def update_evaluation(evaluation_id: int, input_data: EvaluationUpdate, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        current_item = repo.find_by_id(evaluation_id)
        if current_item is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))

        target_org_id = input_data.organization_id if input_data.organization_id is not None else current_item.organization_id
        if target_org_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")

    item = repo.update(evaluation_id, input_data.model_dump(exclude_unset=True))
    if item is None:
        @router.patch("/{evaluation_id}")
        def update_evaluation(evaluation_id: int, input_data: dict, current_user=Depends(auth_middleware)):
            with Session(engine) as session:
                item = session.get(EvaluacionORM, evaluation_id)
                if item is None:
                    raise HTTPException(status_code=404, detail="Evaluación no encontrada")
                if is_org_user(current_user):
                    allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
                    if item.id_empresa not in allowed:
                        raise HTTPException(status_code=403, detail="No autorizado para modificar esta evaluación")
                data = dict(input_data)
                if "estado" in data and str(data["estado"]).strip():
                    item.estado = data["estado"]
                if "fecha" in data:
                    item.fecha = data["fecha"]
                session.add(item)
                session.commit()
                session.refresh(item)
                return item
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return item


@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    if is_org_user(current_user):
        current_item = repo.find_by_id(evaluation_id)
        if current_item is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        with Session(engine) as session:
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
        if current_item.organization_id not in allowed:
            raise HTTPException(status_code=403, detail="No autorizado para eliminar esta evaluación")

    deleted = repo.delete(evaluation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"deleted": True, "id": evaluation_id}
@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: int, current_user=Depends(auth_middleware)):
    with Session(engine) as session:
        item = session.get(EvaluacionORM, evaluation_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")
        if is_org_user(current_user):
            allowed = set(get_assigned_organization_ids(session, int(current_user["user_id"])))
            if item.id_empresa not in allowed:
                raise HTTPException(status_code=403, detail="No autorizado para eliminar esta evaluación")
        session.delete(item)
        session.commit()
        return {"deleted": True, "id": evaluation_id}
