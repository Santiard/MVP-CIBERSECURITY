from fastapi import FastAPI
from fastapi import HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.auth import create_access_token
from app.auth_schemas import LoginRequest, LoginResponse, RegisterRequest
from app.db import engine, init_db
from app.seed import seed_data_if_enabled
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database import RolORM, UsuarioORM
from interfaces.routes.core_entities_routes import router as core_entities_router
from interfaces.routes.evaluation_routes import router as evaluation_router
from interfaces.routes.password_reset_routes import router as password_reset_router
from interfaces.routes.organization_routes import router as organization_router

app = FastAPI(title="MVP CIBERSECURITY - FastAPI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    seed_data_if_enabled()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/token")
def login(payload: LoginRequest) -> LoginResponse:
    email = payload.email.strip().lower()
    password = payload.password

    if not is_strong_password(password):
        raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)

    with Session(engine) as session:
        user = session.exec(select(UsuarioORM).where(UsuarioORM.correo == email)).first()
        if user is None or user.password != password or not user.activo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas. Revisa tu correo y contraseña.",
            )

        role_name = "user"
        role = session.get(RolORM, user.id_rol)
        if role is not None and role.nombre:
            role_name = role.nombre

        token = create_access_token(subject=str(user.id_usuario))
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id_usuario,
            name=user.nombre,
            role=role_name,
        )


@app.post("/auth/register")
def register(payload: RegisterRequest) -> LoginResponse:
    """Alta pública: crea usuario con rol `user` e inicia sesión (misma respuesta que login)."""
    email = payload.email.strip().lower()
    name = payload.name.strip()
    password = payload.password
    phone = (payload.phone or "").strip() or None

    if not name:
        raise HTTPException(status_code=422, detail="El nombre es obligatorio")
    if not is_strong_password(password):
        raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)

    with Session(engine) as session:
        existing = session.exec(select(UsuarioORM).where(UsuarioORM.correo == email)).first()
        if existing is not None:
            raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo")

        user_role = session.exec(select(RolORM).where(RolORM.nombre == "user")).first()
        if user_role is None or user_role.id_rol is None:
            raise HTTPException(status_code=500, detail="Rol de usuario no configurado en el sistema")

        user = UsuarioORM(
            nombre=name,
            correo=email,
            telefono=phone,
            activo=True,
            password=password,
            id_rol=user_role.id_rol,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(subject=str(user.id_usuario))
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id_usuario,
            name=user.nombre,
            role="user",
        )


app.include_router(password_reset_router)
app.include_router(evaluation_router)
app.include_router(organization_router)
app.include_router(core_entities_router)
