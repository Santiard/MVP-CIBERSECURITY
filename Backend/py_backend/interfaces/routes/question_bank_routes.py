"""
Rutas del Banco de Preguntas (many-to-many con Controles/Formularios).
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.access_control import require_admin
from app.db import engine
from app.repositories.question_bank_repository import (
    create_bank_question,
    delete_bank_question,
    get_bank_question,
    link_question_to_control,
    list_bank_questions,
    list_questions_by_control,
    unlink_question_from_control,
    update_bank_question,
)
from app.schemas import BankQuestionCreate, BankQuestionRead, BankQuestionUpdate
from interfaces.middlewares.auth_middleware import auth_middleware

router = APIRouter(
    prefix="/question-bank",
    tags=["question-bank"],
    dependencies=[Depends(auth_middleware)],
)


def _get_session():
    with Session(engine) as session:
        yield session


@router.get("", response_model=list[BankQuestionRead])
def list_questions(session: Session = Depends(_get_session), _: dict = Depends(require_admin)):
    """Lista todas las preguntas del banco con los formularios donde están vinculadas."""
    return list_bank_questions(session)


@router.get("/{id_pregunta}", response_model=BankQuestionRead)
def get_question(id_pregunta: int, session: Session = Depends(_get_session), _: dict = Depends(require_admin)):
    """Detalle de una pregunta del banco."""
    return get_bank_question(session, id_pregunta)


@router.post("", response_model=BankQuestionRead, status_code=201)
def create_question(
    payload: BankQuestionCreate,
    session: Session = Depends(_get_session),
    _: dict = Depends(require_admin),
):
    """Crea una nueva pregunta en el banco global (sin asignarla aún a ningún formulario)."""
    return create_bank_question(session, payload.texto, payload.dimension, payload.peso)


@router.patch("/{id_pregunta}", response_model=BankQuestionRead)
def update_question(
    id_pregunta: int,
    payload: BankQuestionUpdate,
    session: Session = Depends(_get_session),
    _: dict = Depends(require_admin),
):
    """Edita texto, dimensión o peso. El cambio se refleja en TODOS los formularios que la usan."""
    return update_bank_question(session, id_pregunta, payload.texto, payload.dimension, payload.peso)


@router.delete("/{id_pregunta}")
def delete_question(
    id_pregunta: int,
    session: Session = Depends(_get_session),
    _: dict = Depends(require_admin),
):
    """Elimina una pregunta del banco y la desvincula de todos los formularios."""
    return delete_bank_question(session, id_pregunta)


@router.post("/{id_pregunta}/link/{id_control}", response_model=BankQuestionRead, status_code=201)
def link_question(
    id_pregunta: int,
    id_control: int,
    session: Session = Depends(_get_session),
    _: dict = Depends(require_admin),
):
    """Vincula una pregunta del banco a un formulario específico."""
    return link_question_to_control(session, id_pregunta, id_control)


@router.delete("/{id_pregunta}/link/{id_control}")
def unlink_question(
    id_pregunta: int,
    id_control: int,
    session: Session = Depends(_get_session),
    _: dict = Depends(require_admin),
):
    """Desvincula una pregunta de un formulario (la pregunta permanece en el banco)."""
    return unlink_question_from_control(session, id_pregunta, id_control)


@router.get("/by-control/{id_control}", response_model=list[BankQuestionRead])
def list_by_control(
    id_control: int,
    session: Session = Depends(_get_session),
):
    """Devuelve todas las preguntas vinculadas a un formulario (control) específico."""
    return list_questions_by_control(session, id_control)
