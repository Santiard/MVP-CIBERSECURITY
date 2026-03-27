"""Python counterpart to the legacy Prisma schema.

This file documents the target persistence model used by SQLModel.
"""

from typing import Optional

from sqlmodel import Field, SQLModel


class OrganizationModel(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
