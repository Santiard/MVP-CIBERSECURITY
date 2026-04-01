from dataclasses import dataclass

from .evaluacion import Evaluacion


@dataclass(slots=True)
class Score:
    id_score: int
    valor_total: float
    id_evaluacion: int
    evaluacion: Evaluacion

    def __post_init__(self) -> None:
        if self.id_evaluacion != self.evaluacion.id_evaluacion:
            raise ValueError("id_evaluacion no coincide con la evaluacion asignada")
