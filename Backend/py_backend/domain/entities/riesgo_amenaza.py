from dataclasses import dataclass

from .amenaza import Amenaza
from .riesgo import Riesgo


@dataclass(slots=True)
class RiesgoAmenaza:
    id_riesgo: int
    id_amenaza: int
    riesgo: Riesgo
    amenaza: Amenaza

    def __post_init__(self) -> None:
        if self.id_riesgo != self.riesgo.id_riesgo:
            raise ValueError("id_riesgo no coincide con el riesgo asignado")

        if self.id_amenaza != self.amenaza.id_amenaza:
            raise ValueError("id_amenaza no coincide con la amenaza asignada")

        self.riesgo.agregar_amenaza(self.amenaza)
