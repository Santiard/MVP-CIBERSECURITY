from dataclasses import dataclass


@dataclass(slots=True)
class Evaluation:
    id: str
    organization_id: str
    completed: bool = False
