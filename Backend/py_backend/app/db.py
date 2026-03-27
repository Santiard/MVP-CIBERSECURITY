import os
from pathlib import Path

from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine

load_dotenv()

DB_FILE = Path(__file__).resolve().parents[1] / "dev.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def init_db() -> None:
    SQLModel.metadata.create_all(engine)
