from dataclasses import dataclass

from .riesgo import Riesgo
from .vulnerabilidad import Vulnerabilidad


@dataclass(slots=True)
class RiesgoVulnerabilidad:
    id_riesgo: int
    id_vulnerabilidad: int
    riesgo: Riesgo
    vulnerabilidad: Vulnerabilidad

    def __post_init__(self) -> None:
        if self.id_riesgo != self.riesgo.id_riesgo:
            raise ValueError("id_riesgo no coincide con el riesgo asignado")

        if self.id_vulnerabilidad != self.vulnerabilidad.id_vulnerabilidad:
            raise ValueError("id_vulnerabilidad no coincide con la vulnerabilidad asignada")

        self.riesgo.agregar_vulnerabilidad(self.vulnerabilidad)
