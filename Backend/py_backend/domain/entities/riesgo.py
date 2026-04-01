from dataclasses import dataclass, field

from .activo import Activo


@dataclass(slots=True)
class Riesgo:
    id_riesgo: int
    descripcion: str
    impacto: int
    probabilidad: int
    id_activo: int
    activo: Activo
    amenazas: list["Amenaza"] = field(default_factory=list)
    vulnerabilidades: list["Vulnerabilidad"] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.descripcion = self.descripcion.strip()
        if not self.descripcion:
            raise ValueError("descripcion es requerida")

        if not 0 <= self.impacto <= 5:
            raise ValueError("impacto debe estar entre 0 y 5")

        if not 0 <= self.probabilidad <= 5:
            raise ValueError("probabilidad debe estar entre 0 y 5")

        if self.id_activo != self.activo.id_activo:
            raise ValueError("id_activo no coincide con el activo asignado")

        self.activo.agregar_riesgo(self)

    def calcular_nivel(self) -> int:
        return self.impacto * self.probabilidad

    def agregar_amenaza(self, amenaza: "Amenaza") -> None:
        if amenaza not in self.amenazas:
            self.amenazas.append(amenaza)

    def agregar_vulnerabilidad(self, vulnerabilidad: "Vulnerabilidad") -> None:
        if vulnerabilidad not in self.vulnerabilidades:
            self.vulnerabilidades.append(vulnerabilidad)
