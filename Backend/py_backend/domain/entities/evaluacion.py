from dataclasses import dataclass, field
from datetime import date

from .empresa import Empresa
from .usuario import Usuario


VALID_STATES = {"BORRADOR", "EN_PROCESO", "FINALIZADA"}


@dataclass(slots=True)
class Evaluacion:
    id_evaluacion: int
    fecha: date
    estado: str
    id_usuario: int
    id_empresa: int
    usuario: Usuario
    empresa: Empresa
    respuestas: list[object] = field(default_factory=list)
    resultados: list[object] = field(default_factory=list)
    score: object | None = None

    def __post_init__(self) -> None:
        self.estado = self.estado.strip().upper()

        if self.estado not in VALID_STATES:
            raise ValueError("estado invalido")

        if self.id_usuario != self.usuario.id_usuario:
            raise ValueError("id_usuario no coincide con el usuario asignado")

        if self.id_empresa != self.empresa.id_empresa:
            raise ValueError("id_empresa no coincide con la empresa asignada")

        self.empresa.agregar_evaluacion(self)

    def iniciar(self) -> None:
        if self.estado == "FINALIZADA":
            raise ValueError("no se puede iniciar una evaluacion finalizada")
        self.estado = "EN_PROCESO"

    def finalizar(self) -> None:
        if self.estado == "BORRADOR":
            raise ValueError("la evaluacion debe estar en proceso antes de finalizar")
        self.estado = "FINALIZADA"

    def calcular_resultado(self) -> float:
        if not self.resultados:
            return 0.0

        puntajes: list[float] = []
        for resultado in self.resultados:
            if hasattr(resultado, "puntaje"):
                puntajes.append(float(getattr(resultado, "puntaje")))
            else:
                puntajes.append(float(resultado))

        return sum(puntajes) / len(puntajes)

    def agregar_respuesta(self, respuesta: object) -> None:
        if respuesta not in self.respuestas:
            self.respuestas.append(respuesta)

    def agregar_resultado(self, resultado: object) -> None:
        if resultado not in self.resultados:
            self.resultados.append(resultado)

    def asignar_score(self, score: object) -> None:
        self.score = score
