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


class RecoverPasswordRequest(BaseModel):
    email: str
    new_password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str | None = None
