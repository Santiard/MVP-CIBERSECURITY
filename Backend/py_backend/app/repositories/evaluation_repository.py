from typing import Optional, List
from sqlmodel import Session

from infraestructure.database import EvaluationModel, OrganizationModel


def _get_engine():
    from app.db import engine
    return engine


class SQLEvaluationRepository:
    def save(self, payload) -> EvaluationModel:
        with Session(_get_engine()) as session:
            item = EvaluationModel(organization_id=payload.organization_id, answers=payload.answers)
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[EvaluationModel]:
        with Session(_get_engine()) as session:
            return session.get(EvaluationModel, id)

    def find_all(self) -> List[EvaluationModel]:
        with Session(_get_engine()) as session:
            return session.query(EvaluationModel).all()


class SQLOrganizationRepository:
    def save(self, name: str) -> OrganizationModel:
        with Session(_get_engine()) as session:
            item = OrganizationModel(name=name)
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[OrganizationModel]:
        with Session(_get_engine()) as session:
            return session.get(OrganizationModel, id)

    def find_all(self) -> List[OrganizationModel]:
        with Session(_get_engine()) as session:
            return session.query(OrganizationModel).all()
