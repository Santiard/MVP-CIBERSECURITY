"""Python counterpart to the legacy Prisma schema.

This file documents the target persistence model used by SQLModel.
"""

from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class OrganizationModel(SQLModel, table=True):
    __tablename__ = "organization"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str


class EvaluationModel(SQLModel, table=True):
    __tablename__ = "evaluation"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int
    answers: Optional[dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSON))
