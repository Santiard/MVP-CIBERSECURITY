from dataclasses import dataclass, field

from .empresa import Empresa


@dataclass(slots=True)
class Activo:
    id_activo: int
    nombre: str
    valor: int
    id_empresa: int
    empresa: Empresa
    riesgos: list["Riesgo"] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.nombre = self.nombre.strip()

        if not self.nombre:
            raise ValueError("nombre es requerido")

        if self.valor < 0:
            raise ValueError("valor no puede ser negativo")

        if self.id_empresa != self.empresa.id_empresa:
            raise ValueError("id_empresa no coincide con la empresa asignada")

        self.empresa.agregar_activo(self)

    def agregar_riesgo(self, riesgo: "Riesgo") -> None:
        if riesgo not in self.riesgos:
            self.riesgos.append(riesgo)
