from fastapi import Depends

from app.auth import get_current_user


def auth_middleware(user: dict = Depends(get_current_user)) -> dict:
    return user
