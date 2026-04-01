from dataclasses import dataclass

from .control import Control
from .evaluacion import Evaluacion
from .nivel_madurez import NivelMadurez


@dataclass(slots=True)
class Resultado:
    id_resultado: int
    puntaje: float
    id_evaluacion: int
    id_control: int
    id_nivel: int
    evaluacion: Evaluacion
    control: Control
    nivel: NivelMadurez

    def __post_init__(self) -> None:
        if self.id_evaluacion != self.evaluacion.id_evaluacion:
            raise ValueError("id_evaluacion no coincide con la evaluacion asignada")

        if self.id_control != self.control.id_control:
            raise ValueError("id_control no coincide con el control asignado")

        if self.id_nivel != self.nivel.id_nivel:
            raise ValueError("id_nivel no coincide con el nivel asignado")

        self.evaluacion.agregar_resultado(self)
