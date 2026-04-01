from dataclasses import dataclass

from .rol import Rol


@dataclass(slots=True)
class Usuario:
    id_usuario: int
    nombre: str
    correo: str
    password: str
    id_rol: int
    rol: Rol

    def __post_init__(self) -> None:
        self.correo = self.correo.strip().lower()
        if "@" not in self.correo:
            raise ValueError("correo invalido")

        if self.id_rol != self.rol.id_rol:
            raise ValueError("id_rol no coincide con el rol asignado")

        self.rol.agregar_usuario(self)

    @classmethod
    def registrar(
        cls,
        id_usuario: int,
        nombre: str,
        correo: str,
        password: str,
        rol: Rol,
    ) -> "Usuario":
        if not nombre.strip():
            raise ValueError("nombre es requerido")
        if len(password) < 8:
            raise ValueError("password debe tener al menos 8 caracteres")

        return cls(
            id_usuario=id_usuario,
            nombre=nombre.strip(),
            correo=correo,
            password=password,
            id_rol=rol.id_rol,
            rol=rol,
        )

    def login(self, correo: str, password: str) -> bool:
        return self.correo == correo.strip().lower() and self.password == password
