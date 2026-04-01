from dataclasses import dataclass


@dataclass(slots=True)
class NivelMadurez:
    id_nivel: int
    nivel: int
    descripcion: str

    def __post_init__(self) -> None:
        if not 0 <= self.nivel <= 5:
            raise ValueError("nivel debe estar entre 0 y 5")

        self.descripcion = self.descripcion.strip()
        if not self.descripcion:
            raise ValueError("descripcion es requerida")
