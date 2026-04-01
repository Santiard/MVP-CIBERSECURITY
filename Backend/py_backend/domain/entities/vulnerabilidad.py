from dataclasses import dataclass


@dataclass(slots=True)
class Vulnerabilidad:
    id_vulnerabilidad: int
    descripcion: str

    def __post_init__(self) -> None:
        self.descripcion = self.descripcion.strip()
        if not self.descripcion:
            raise ValueError("descripcion es requerida")
