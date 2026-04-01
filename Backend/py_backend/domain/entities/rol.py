from dataclasses import dataclass, field
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from .usuario import Usuario


VALID_ROLE_NAMES = {"ADMIN", "EVALUADOR"}


@dataclass(slots=True)
class Rol:
    id_rol: int
    nombre: str
    usuarios: list["Usuario"] = field(default_factory=list)

    def __post_init__(self) -> None:
        normalized_name = self.nombre.strip().upper()
        if normalized_name not in VALID_ROLE_NAMES:
            raise ValueError("nombre debe ser ADMIN o EVALUADOR")
        self.nombre = normalized_name

    def agregar_usuario(self, usuario: "Usuario") -> None:
        if usuario not in self.usuarios:
            self.usuarios.append(usuario)
