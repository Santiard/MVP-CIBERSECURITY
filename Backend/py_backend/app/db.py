import os

from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine

# Import models so SQLModel metadata includes all tables before create_all.
from infraestructure.database import models as _models  # noqa: F401

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://mvp_user:mvp_pass@localhost:5432/mvp_db",
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def init_db() -> None:
    SQLModel.metadata.create_all(engine)
