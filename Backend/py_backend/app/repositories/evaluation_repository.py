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

    def update(self, id: int, payload: dict) -> Optional[EvaluationModel]:
        with Session(_get_engine()) as session:
            item = session.get(EvaluationModel, id)
            if item is None:
                return None

            if "organization_id" in payload and payload["organization_id"] is not None:
                item.organization_id = payload["organization_id"]
            if "answers" in payload and payload["answers"] is not None:
                item.answers = payload["answers"]

            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def delete(self, id: int) -> bool:
        with Session(_get_engine()) as session:
            item = session.get(EvaluationModel, id)
            if item is None:
                return False
            session.delete(item)
            session.commit()
            return True


class SQLOrganizationRepository:
    def save(self, payload: dict) -> OrganizationModel:
        with Session(_get_engine()) as session:
            item = OrganizationModel(
                name=payload["name"],
                email=payload.get("email"),
                nit=payload.get("nit"),
                address=payload.get("address"),
                phone=payload.get("phone"),
            )
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

    def update(self, id: int, payload: dict) -> Optional[OrganizationModel]:
        with Session(_get_engine()) as session:
            item = session.get(OrganizationModel, id)
            if item is None:
                return None

            if "name" in payload and payload["name"] is not None:
                item.name = payload["name"]
            if "email" in payload:
                item.email = payload.get("email")
            if "nit" in payload:
                item.nit = payload.get("nit")
            if "address" in payload:
                item.address = payload.get("address")
            if "phone" in payload:
                item.phone = payload.get("phone")

            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def delete(self, id: int) -> bool:
        with Session(_get_engine()) as session:
            item = session.get(OrganizationModel, id)
            if item is None:
                return False
            session.delete(item)
            session.commit()
            return True
