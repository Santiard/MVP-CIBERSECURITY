from sqlmodel import Session, select

from infraestructure.database import UsuarioOrganizacionORM


def get_assigned_organization_ids(session: Session, user_id: int) -> list[int]:
    rows = session.exec(
        select(UsuarioOrganizacionORM).where(UsuarioOrganizacionORM.id_usuario == user_id)
    ).all()
    return [row.id_empresa for row in rows]


def is_org_user(current_user: dict) -> bool:
    return str(current_user.get("role", "")).lower() == "user"