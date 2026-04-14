import re


PASSWORD_POLICY_MESSAGE = (
    "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y carácter especial."
)


def is_strong_password(value: str) -> bool:
    if len(value) < 8:
        return False
    if not re.search(r"[A-Z]", value):
        return False
    if not re.search(r"[a-z]", value):
        return False
    if not re.search(r"[^A-Za-z0-9]", value):
        return False
    return True


def normalize_optional_string(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def is_valid_email(value: str) -> bool:
    return re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value) is not None


def is_numeric_string(value: str) -> bool:
    return value.isdigit()