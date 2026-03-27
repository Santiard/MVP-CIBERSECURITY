from fastapi import FastAPI

from app.auth import create_access_token
from app.auth_schemas import LoginRequest
from app.db import init_db
from interfaces.routes.evaluation_routes import router as evaluation_router
from interfaces.routes.organization_routes import router as organization_router

app = FastAPI(title="MVP CIBERSECURITY - FastAPI Backend")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/token")
def login(payload: LoginRequest) -> dict[str, str]:
    token = create_access_token(subject=payload.user_id)
    return {"access_token": token, "token_type": "bearer"}


app.include_router(evaluation_router)
app.include_router(organization_router)
