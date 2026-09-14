from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user



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
    from infraestructure.database.models import UsuarioORM
    user = session.get(UsuarioORM, user_id)
    if user and user.id_empresa:
        return [user.id_empresa]
    return []


def is_org_user(current_user: dict) -> bool:
    """Roles de nivel: usuario de empresa; el alcance se restringe por id_empresa."""
    return role_lower(current_user).startswith("user_nivel_")