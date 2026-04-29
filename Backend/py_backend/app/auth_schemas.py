from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


class RequestPasswordResetBody(BaseModel):
    email: str


class ConfirmPasswordResetBody(BaseModel):
    token: str
    new_password: str


class PasswordResetNeutralResponse(BaseModel):
    """Siempre igual para no revelar si el correo está registrado."""

    message: str = "Si existe una cuenta con ese correo, recibirás instrucciones en breve."


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str | None = None
