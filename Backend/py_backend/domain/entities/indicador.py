from dataclasses import dataclass

from .control import Control


@dataclass(slots=True)
class Indicador:
    id_indicador: int
    nombre: str
    formula: str
    frecuencia: str
    id_control: int
    control: Control

    def __post_init__(self) -> None:
        self.nombre = self.nombre.strip()
        self.formula = self.formula.strip()
        self.frecuencia = self.frecuencia.strip()

        if not self.nombre:
            raise ValueError("nombre es requerido")
        if not self.formula:
            raise ValueError("formula es requerida")
        if not self.frecuencia:
            raise ValueError("frecuencia es requerida")

        if self.id_control != self.control.id_control:
            raise ValueError("id_control no coincide con el control asignado")

        self.control.agregar_indicador(self)

    def calcular(self, valor_base: float, factor: float = 1.0) -> float:
        return valor_base * factor
