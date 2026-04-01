from dataclasses import dataclass, field


@dataclass(slots=True)
class Empresa:
    id_empresa: int
    nombre: str
    sector: str
    tamano: str
    activos: list["Activo"] = field(default_factory=list)
    evaluaciones: list["Evaluacion"] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.nombre = self.nombre.strip()
        self.sector = self.sector.strip()
        self.tamano = self.tamano.strip()

        if not self.nombre:
            raise ValueError("nombre es requerido")
        if not self.sector:
            raise ValueError("sector es requerido")
        if not self.tamano:
            raise ValueError("tamano es requerido")

    def agregar_evaluacion(self, evaluacion: "Evaluacion") -> None:
        if evaluacion not in self.evaluaciones:
            self.evaluaciones.append(evaluacion)

    def agregar_activo(self, activo: "Activo") -> None:
        if activo not in self.activos:
            self.activos.append(activo)
