from app.schemas import OrganizationCreate
from app.repositories.evaluation_repository import SQLOrganizationRepository


class CreateOrganizationUseCase:
    def __init__(self, repo: SQLOrganizationRepository):
        self.repo = repo

    def execute(self, payload: OrganizationCreate):
        return self.repo.save(payload.model_dump(mode="json"))
