"""Recuperación de contraseña con token firmado temporal (único uso)."""

from __future__ import annotations

import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, col, select

from app.auth_schemas import ConfirmPasswordResetBody, PasswordResetNeutralResponse, RequestPasswordResetBody
from app.db import engine
from app.password_reset_email import send_password_reset_email
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database import PasswordResetTokenORM, UsuarioORM

_logger = logging.getLogger(__name__)

router = APIRouter(tags=["password-reset"])

PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "60"))
PASSWORD_RESET_FRONTEND_BASE = (
    os.getenv("PASSWORD_RESET_FRONTEND_BASE", "http://localhost:3001").rstrip("/")
)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _invalidate_pending_for_user(session: Session, id_usuario: int) -> None:
    pending = session.exec(
        select(PasswordResetTokenORM).where(
            PasswordResetTokenORM.id_usuario == id_usuario,
            col(PasswordResetTokenORM.used_at).is_(None),
        )
    ).all()
    for row in pending:
        session.delete(row)


@router.post("/auth/request-password-reset", response_model=PasswordResetNeutralResponse)
def request_password_reset(body: RequestPasswordResetBody) -> PasswordResetNeutralResponse:
    neutral = PasswordResetNeutralResponse()

    email = body.email.strip().lower()
    if not email:
        return neutral

    with Session(engine) as session:
        user = session.exec(select(UsuarioORM).where(UsuarioORM.correo == email)).first()
        if user is None or not user.activo or user.id_usuario is None:
            return neutral

        _invalidate_pending_for_user(session, user.id_usuario)

        raw_token = secrets.token_urlsafe(48)
        th = _hash_token(raw_token)
        exp = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
        row = PasswordResetTokenORM(
            id_usuario=user.id_usuario,
            token_hash=th,
            expires_at=exp,
        )
        session.add(row)
        session.flush()

        link = f"{PASSWORD_RESET_FRONTEND_BASE}/recover-password?token={raw_token}"
        try:
            send_password_reset_email(email, reset_link=link)
            session.commit()
        except Exception:
            session.rollback()
            _logger.exception("Error al enviar el correo; no se registró token para usuario id=%s", user.id_usuario)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No se pudo enviar el correo. Intenta más tarde o contacta al administrador.",
            ) from None

    return neutral


@router.post("/auth/confirm-password-reset")
def confirm_password_reset(body: ConfirmPasswordResetBody) -> dict[str, str]:
    if not is_strong_password(body.new_password):
        raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)

    token = body.token.strip()
    if len(token) < 20:
        raise HTTPException(status_code=400, detail="Token inválido.")

    th = _hash_token(token)
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        row = session.exec(select(PasswordResetTokenORM).where(PasswordResetTokenORM.token_hash == th)).first()
        if row is None:
            raise HTTPException(
                status_code=400,
                detail="El enlace no es válido o ha caducado. Solicita uno nuevo desde «Recuperar contraseña».",
            )
        if row.used_at is not None:
            raise HTTPException(
                status_code=400,
                detail="Este enlace ya fue utilizado. Solicita un nuevo correo si aún necesitas cambiar tu contraseña.",
            )
        exp = row.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            raise HTTPException(
                status_code=400,
                detail="El enlace ha caducado. Solicita uno nuevo desde «Recuperar contraseña».",
            )

        user = session.get(UsuarioORM, row.id_usuario)
        if user is None:
            raise HTTPException(status_code=400, detail="Usuario no encontrado.")
        user.password = body.new_password
        session.add(user)
        row.used_at = now
        session.add(row)
        session.commit()

    return {"message": "Contraseña actualizada correctamente."}
