from dataclasses import dataclass, field


@dataclass(slots=True)
class Control:
    id_control: int
    nombre: str
    descripcion: str
    confidencialidad: bool
    integridad: bool
    disponibilidad: bool
    preguntas: list["Pregunta"] = field(default_factory=list)
    indicadores: list["Indicador"] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.nombre = self.nombre.strip()
        self.descripcion = self.descripcion.strip()

        if not self.nombre:
            raise ValueError("nombre es requerido")
        if not self.descripcion:
            raise ValueError("descripcion es requerida")

    def agregar_pregunta(self, pregunta: "Pregunta") -> None:
        if pregunta not in self.preguntas:
            self.preguntas.append(pregunta)

    def agregar_indicador(self, indicador: "Indicador") -> None:
        if indicador not in self.indicadores:
            self.indicadores.append(indicador)
