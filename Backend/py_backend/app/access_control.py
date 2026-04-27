from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from infraestructure.database import UsuarioOrganizacionORM


def role_lower(current_user: dict) -> str:
    return str(current_user.get("role", "")).lower()


def is_admin(current_user: dict) -> bool:
    return role_lower(current_user) == "admin"


def is_evaluator(current_user: dict) -> bool:
    return role_lower(current_user) == "evaluator"


def is_staff(current_user: dict) -> bool:
    """Administrador o evaluador (no es usuario solo de organización)."""
    return is_admin(current_user) or is_evaluator(current_user)


def require_roles(*allowed_roles: str) -> Callable[..., dict]:
    allowed = {r.lower() for r in allowed_roles}

    async def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        if role_lower(current_user) not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para esta operación",
            )
        return current_user

    return _checker


require_admin = require_roles("admin")
require_staff = require_roles("admin", "evaluator")


def get_assigned_organization_ids(session: Session, user_id: int) -> list[int]:
    rows = session.exec(
        select(UsuarioOrganizacionORM).where(UsuarioOrganizacionORM.id_usuario == user_id)
    ).all()
    return [row.id_empresa for row in rows]


def is_org_user(current_user: dict) -> bool:
    """Rol `user`: usuario de empresa; el alcance se restringe por `usuario_organizacion`."""
    return role_lower(current_user) == "user"