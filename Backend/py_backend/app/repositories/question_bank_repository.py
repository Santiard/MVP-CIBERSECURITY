"""
Repositorio para el Banco de Preguntas (many-to-many con Controles).
"""
from typing import Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from infraestructure.database.models import PreguntaControlORM, PreguntaORM


def _to_read(pregunta: PreguntaORM, session: Session) -> dict:
    """Convierte un ORM de pregunta a dict serializable con IDs de controles vinculados."""
    links = session.exec(
        select(PreguntaControlORM).where(PreguntaControlORM.id_pregunta == pregunta.id_pregunta)
    ).all()
    return {
        "id_pregunta": pregunta.id_pregunta,
        "texto": pregunta.texto,
        "dimension": pregunta.dimension,
        "peso": pregunta.peso,
        "controles": [lnk.id_control for lnk in links],
    }


def list_bank_questions(session: Session) -> list[dict]:
    """Devuelve todas las preguntas del banco con sus controles vinculados."""
    preguntas = session.exec(select(PreguntaORM).order_by(PreguntaORM.id_pregunta)).all()
    return [_to_read(p, session) for p in preguntas]


def get_bank_question(session: Session, id_pregunta: int) -> dict:
    """Devuelve una pregunta específica con sus controles vinculados."""
    pregunta = session.get(PreguntaORM, id_pregunta)
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    return _to_read(pregunta, session)


def create_bank_question(session: Session, texto: str, dimension: Optional[str], peso: float) -> dict:
    """Crea una nueva pregunta en el banco global (sin vínculo a ningún formulario)."""
    pregunta = PreguntaORM(texto=texto.strip(), dimension=dimension, peso=peso)
    session.add(pregunta)
    session.commit()
    session.refresh(pregunta)
    return _to_read(pregunta, session)


def update_bank_question(
    session: Session,
    id_pregunta: int,
    texto: Optional[str],
    dimension: Optional[str],
    peso: Optional[float],
) -> dict:
    """Actualiza campos de una pregunta del banco. Refleja automáticamente en todos los formularios que la usan."""
    pregunta = session.get(PreguntaORM, id_pregunta)
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    if texto is not None:
        pregunta.texto = texto.strip()
    if dimension is not None:
        pregunta.dimension = dimension
    if peso is not None:
        pregunta.peso = peso
    session.add(pregunta)
    session.commit()
    session.refresh(pregunta)
    return _to_read(pregunta, session)


def delete_bank_question(session: Session, id_pregunta: int) -> dict:
    """Elimina una pregunta del banco y todos sus vínculos con formularios."""
    pregunta = session.get(PreguntaORM, id_pregunta)
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # Eliminar vínculos en pregunta_control
    links = session.exec(
        select(PreguntaControlORM).where(PreguntaControlORM.id_pregunta == id_pregunta)
    ).all()
    for lnk in links:
        session.delete(lnk)

    session.delete(pregunta)
    session.commit()
    return {"deleted": True, "id_pregunta": id_pregunta}


def link_question_to_control(session: Session, id_pregunta: int, id_control: int) -> dict:
    """Vincula una pregunta del banco a un formulario (control)."""
    # Verificar que existen
    if not session.get(PreguntaORM, id_pregunta):
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # Verificar si el vínculo ya existe
    existing = session.exec(
        select(PreguntaControlORM).where(
            PreguntaControlORM.id_pregunta == id_pregunta,
            PreguntaControlORM.id_control == id_control,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="La pregunta ya está vinculada a este formulario")

    link = PreguntaControlORM(id_pregunta=id_pregunta, id_control=id_control)
    session.add(link)
    session.commit()
    pregunta = session.get(PreguntaORM, id_pregunta)
    return _to_read(pregunta, session)  # type: ignore[arg-type]


def unlink_question_from_control(session: Session, id_pregunta: int, id_control: int) -> dict:
    """Desvincula una pregunta de un formulario (sin eliminar la pregunta del banco)."""
    link = session.exec(
        select(PreguntaControlORM).where(
            PreguntaControlORM.id_pregunta == id_pregunta,
            PreguntaControlORM.id_control == id_control,
        )
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="El vínculo entre pregunta y formulario no existe")
    session.delete(link)
    session.commit()
    pregunta = session.get(PreguntaORM, id_pregunta)
    return _to_read(pregunta, session)  # type: ignore[arg-type]


def list_questions_by_control(session: Session, id_control: int) -> list[dict]:
    """Devuelve todas las preguntas vinculadas a un formulario (control) específico."""
    links = session.exec(
        select(PreguntaControlORM).where(PreguntaControlORM.id_control == id_control)
    ).all()
    result = []
    for lnk in links:
        pregunta = session.get(PreguntaORM, lnk.id_pregunta)
        if pregunta:
            result.append(_to_read(pregunta, session))
    return result
