from dataclasses import dataclass


@dataclass(slots=True)
class Amenaza:
    id_amenaza: int
    nombre: str

    def __post_init__(self) -> None:
        self.nombre = self.nombre.strip()
        if not self.nombre:
            raise ValueError("nombre es requerido")
