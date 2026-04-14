from fastapi import FastAPI
from fastapi import HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.auth import create_access_token
from app.auth_schemas import LoginRequest, LoginResponse, RecoverPasswordRequest
from app.db import engine, init_db
from app.seed import seed_data_if_enabled
from app.validation import PASSWORD_POLICY_MESSAGE, is_strong_password
from infraestructure.database import RolORM, UsuarioORM
from interfaces.routes.entity_crud_routes import router as entity_crud_router
from interfaces.routes.evaluation_routes import router as evaluation_router
from interfaces.routes.organization_routes import router as organization_router

app = FastAPI(title="MVP CIBERSECURITY - FastAPI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:5173",
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
                detail="Credenciales invalidas",
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


@app.post("/auth/recover-password")
def recover_password(payload: RecoverPasswordRequest) -> dict[str, str]:
    email = payload.email.strip().lower()
    new_password = payload.new_password

    if not is_strong_password(new_password):
        raise HTTPException(status_code=422, detail=PASSWORD_POLICY_MESSAGE)

    with Session(engine) as session:
        user = session.exec(select(UsuarioORM).where(UsuarioORM.correo == email)).first()
        if user is None:
            raise HTTPException(status_code=404, detail="No existe usuario con ese correo")

        user.password = new_password
        session.add(user)
        session.commit()

    return {"message": "Contraseña actualizada correctamente"}


app.include_router(evaluation_router)
app.include_router(organization_router)
app.include_router(entity_crud_router)
