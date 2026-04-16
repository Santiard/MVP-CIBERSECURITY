from datetime import date
from typing import Any, Optional

from sqlmodel import Session, select

from infraestructure.database.models import EmpresaORM, EvaluacionControlORM, EvaluacionORM


def _get_engine():
    from app.db import engine

    return engine


class SQLEvaluationRepository:
    """Persistencia de evaluaciones sobre `evaluaciones` (EvaluacionORM)."""

    def save(self, payload: Any) -> EvaluacionORM:
        data = payload if isinstance(payload, dict) else payload.__dict__
        org_id = int(data.get("organization_id"))
        answers = data.get("answers") or {}
        user_id = data.get("user_id")
        if user_id is None:
            raise ValueError("user_id es requerido para crear una evaluación")
        user_id = int(user_id)

        engine = _get_engine()
        with Session(engine) as session:
            item = EvaluacionORM(
                id_empresa=org_id,
                id_usuario=user_id,
                fecha=data.get("fecha") or date.today(),
                estado=str(data.get("estado") or "pendiente"),
                datos_respuestas=answers if answers else None,
            )
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[EvaluacionORM]:
        with Session(_get_engine()) as session:
            return session.get(EvaluacionORM, id)

    def find_all(self) -> list[EvaluacionORM]:
        with Session(_get_engine()) as session:
            return list(session.exec(select(EvaluacionORM)).all())

    def update(self, id: int, payload: dict) -> Optional[EvaluacionORM]:
        with Session(_get_engine()) as session:
            item = session.get(EvaluacionORM, id)
            if item is None:
                return None
            if "organization_id" in payload and payload["organization_id"] is not None:
                item.id_empresa = int(payload["organization_id"])
            if "answers" in payload and payload["answers"] is not None:
                item.datos_respuestas = payload["answers"]
            if "user_id" in payload and payload["user_id"] is not None:
                item.id_usuario = int(payload["user_id"])
            if "estado" in payload and payload["estado"] is not None:
                item.estado = str(payload["estado"])
            if "fecha" in payload and payload["fecha"] is not None:
                item.fecha = payload["fecha"]
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def delete(self, id: int) -> bool:
        with Session(_get_engine()) as session:
            item = session.get(EvaluacionORM, id)
            if item is None:
                return False
            for row in session.exec(
                select(EvaluacionControlORM).where(EvaluacionControlORM.id_evaluacion == id)
            ).all():
                session.delete(row)
            session.delete(item)
            session.commit()
            return True


class SQLOrganizationRepository:
    """Persistencia de organizaciones sobre `empresas` (EmpresaORM)."""

    def save(self, payload: dict | str) -> EmpresaORM:
        if isinstance(payload, str):
            data = {"name": payload, "sector": "-", "size": "-"}
        else:
            data = dict(payload)

        nombre = str(data.get("name") or data.get("nombre") or "").strip()
        if not nombre:
            raise ValueError("El nombre de la organización es requerido")
        sector = str(data.get("sector") or "-").strip() or "-"
        tamano = str(data.get("size") or data.get("tamano") or "-").strip() or "-"

        engine = _get_engine()
        with Session(engine) as session:
            item = EmpresaORM(
                nombre=nombre,
                sector=sector,
                tamano=tamano,
                correo=data.get("email") or data.get("correo"),
                nit=data.get("nit"),
                direccion=data.get("address") or data.get("direccion"),
                telefono=data.get("phone") or data.get("telefono"),
            )
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def find_by_id(self, id: int) -> Optional[EmpresaORM]:
        with Session(_get_engine()) as session:
            return session.get(EmpresaORM, id)

    def find_all(self) -> list[EmpresaORM]:
        with Session(_get_engine()) as session:
            return list(session.exec(select(EmpresaORM)).all())

    def update(self, id: int, payload: dict) -> Optional[EmpresaORM]:
        with Session(_get_engine()) as session:
            item = session.get(EmpresaORM, id)
            if item is None:
                return None
            if "name" in payload and payload["name"] is not None:
                item.nombre = str(payload["name"])
            if "nombre" in payload and payload["nombre"] is not None:
                item.nombre = str(payload["nombre"])
            if "sector" in payload and payload["sector"] is not None:
                item.sector = str(payload["sector"])
            if "size" in payload and payload["size"] is not None:
                item.tamano = str(payload["size"])
            if "tamano" in payload and payload["tamano"] is not None:
                item.tamano = str(payload["tamano"])
            if "email" in payload:
                item.correo = payload.get("email")
            if "nit" in payload:
                item.nit = payload.get("nit")
            if "address" in payload:
                item.direccion = payload.get("address")
            if "phone" in payload:
                item.telefono = payload.get("phone")
            session.add(item)
            session.commit()
            session.refresh(item)
            return item

    def delete(self, id: int) -> bool:
        with Session(_get_engine()) as session:
            item = session.get(EmpresaORM, id)
            if item is None:
                return False
            session.delete(item)
            session.commit()
            return True
