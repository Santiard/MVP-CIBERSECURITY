from dataclasses import dataclass, field

from .control import Control


@dataclass(slots=True)
class Pregunta:
    id_pregunta: int
    texto: str
    peso: float
    id_control: int
    control: Control
    respuestas: list["Respuesta"] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.texto = self.texto.strip()
        if not self.texto:
            raise ValueError("texto es requerido")

        if self.peso < 0:
            raise ValueError("peso no puede ser negativo")

        if self.id_control != self.control.id_control:
            raise ValueError("id_control no coincide con el control asignado")

        self.control.agregar_pregunta(self)

    def agregar_respuesta(self, respuesta: "Respuesta") -> None:
        if respuesta not in self.respuestas:
            self.respuestas.append(respuesta)
