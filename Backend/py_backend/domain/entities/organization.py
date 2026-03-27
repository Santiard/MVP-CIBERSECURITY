from dataclasses import dataclass


@dataclass(slots=True)
class Organization:
    id: str
    name: str
