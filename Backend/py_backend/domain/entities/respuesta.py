from dataclasses import dataclass

from .evaluacion import Evaluacion
from .pregunta import Pregunta


@dataclass(slots=True)
class Respuesta:
    id_respuesta: int
    valor: int
    comentario: str
    id_pregunta: int
    id_evaluacion: int
    pregunta: Pregunta
    evaluacion: Evaluacion

    def __post_init__(self) -> None:
        if not 0 <= self.valor <= 5:
            raise ValueError("valor debe estar entre 0 y 5")

        self.comentario = self.comentario.strip()

        if self.id_pregunta != self.pregunta.id_pregunta:
            raise ValueError("id_pregunta no coincide con la pregunta asignada")

        if self.id_evaluacion != self.evaluacion.id_evaluacion:
            raise ValueError("id_evaluacion no coincide con la evaluacion asignada")

        self.pregunta.agregar_respuesta(self)
        self.evaluacion.agregar_respuesta(self)
