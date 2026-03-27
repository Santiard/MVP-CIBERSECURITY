from typing import Optional, List
from sqlmodel import SQLModel, Field, Session
from app.db import engine


class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str


class Evaluation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int
    answers: Optional[dict] = Field(default={})


class SQLEvaluationRepository:
    def save(self, payload) -> Evaluation:
        with Session(engine) as session:
            item = Evaluation(organization_id=payload.organization_id, answers=payload.answers)
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[Evaluation]:
        with Session(engine) as session:
            return session.get(Evaluation, id)

    def find_all(self) -> List[Evaluation]:
        with Session(engine) as session:
            return session.query(Evaluation).all()


class SQLOrganizationRepository:
    def save(self, name: str) -> Organization:
        with Session(engine) as session:
            item = Organization(name=name)
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[Organization]:
        with Session(engine) as session:
            return session.get(Organization, id)

    def find_all(self) -> List[Organization]:
        with Session(engine) as session:
            return session.query(Organization).all()
