import os
from datetime import date

from sqlmodel import Session, select

from app.db import engine
from infraestructure.database import (
    ActivoORM,
    ControlORM,
    EmpresaORM,
    FormularioORM,
    FormularioPreguntaORM,
    EvaluacionORM,
    PreguntaORM,
    RiesgoORM,
    RiesgoVulnerabilidadORM,
    RolORM,
    UsuarioORM,
    VulnerabilidadORM,
)


def _is_enabled(name: str, default: str = "true") -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {"1", "true", "yes", "on"}


def _seed_empresas(session: Session) -> None:
    empresas_seed = [
        {"nombre": "ACME Ciberseguridad", "sector": "Servicios", "tamano": "Mediana"},
        {"nombre": "Finanzas Orion", "sector": "Financiero", "tamano": "Grande"},
    ]
    existing_names = {item.nombre for item in session.exec(select(EmpresaORM)).all()}
    for item in empresas_seed:
        if item["nombre"] in existing_names:
            continue
        session.add(EmpresaORM(**item))
    
    session.flush()


def _seed_roles_and_users(session: Session) -> None:
    expected_roles = ["admin", "evaluator", "user_nivel_bajo", "user_nivel_medio", "user_nivel_alto"]
    existing_roles = {
        role.nombre: role
        for role in session.exec(select(RolORM)).all()
    }

    for role_name in expected_roles:
        if role_name not in existing_roles:
            role = RolORM(nombre=role_name)
            session.add(role)
            existing_roles[role_name] = role

    session.flush()
    
    empresa_acme = session.exec(select(EmpresaORM).where(EmpresaORM.nombre == "ACME Ciberseguridad")).first()
    empresa_id = empresa_acme.id_empresa if empresa_acme else None

    users_seed = [
        {
            "nombre": "Admin Principal",
            "correo": "admin@gmail.com",
            "telefono": "+57 3000000001",
            "password": "Admin2026!Secure*",
            "rol": "admin",
            "id_empresa": None,
        },
        {
            "nombre": "Evaluador Demo",
            "correo": "evaluador@mvp.local",
            "telefono": "+57 3000000002",
            "password": "ChangeMe123!",
            "rol": "evaluator",
            "id_empresa": None,
        },
        {
            "nombre": "Usuario Nivel Bajo",
            "correo": "usuario1@mvp.local",
            "telefono": "+57 3000000003",
            "password": "OrgUser123!",
            "rol": "user_nivel_bajo",
            "id_empresa": empresa_id,
        },
        {
            "nombre": "Usuario Nivel Medio",
            "correo": "usuario2@mvp.local",
            "telefono": "+57 3000000004",
            "password": "OrgUser123!",
            "rol": "user_nivel_medio",
            "id_empresa": empresa_id,
        },
        {
            "nombre": "Usuario Nivel Alto",
            "correo": "usuario3@mvp.local",
            "telefono": "+57 3000000005",
            "password": "OrgUser123!",
            "rol": "user_nivel_alto",
            "id_empresa": empresa_id,
        },
    ]

    existing_users = session.exec(select(UsuarioORM)).all()
    existing_emails = {user.correo for user in existing_users}

    admin_role_id = existing_roles["admin"].id_rol
    admin_user = next((u for u in existing_users if u.id_rol == admin_role_id), None)
    if admin_user is not None:
        admin_user.nombre = "Admin Principal"
        admin_user.correo = "admin@gmail.com"
        admin_user.telefono = "+57 3000000001"
        admin_user.password = "Admin2026!Secure*"
        admin_user.activo = True
        session.add(admin_user)
        existing_emails.add("admin@gmail.com")

    for user in users_seed:
        if user["rol"] == "admin" and admin_user is not None:
            continue
        if user["correo"] in existing_emails:
            continue
        session.add(
            UsuarioORM(
                nombre=user["nombre"],
                correo=user["correo"],
                telefono=user["telefono"],
                activo=True,
                password=user["password"],
                id_rol=existing_roles[user["rol"]].id_rol,
                id_empresa=user["id_empresa"],
            )
        )

    session.flush()


def _seed_controls(session: Session) -> None:
    try:
        from app.iso_seed import controls_seed
    except ImportError:
        controls_seed = []

    existing_names = {
        item.nombre for item in session.exec(select(ControlORM)).all()
    }
    for item in controls_seed:
        if item["nombre"] in existing_names:
            continue
        session.add(ControlORM(**item))
    session.flush()


def _seed_preguntas(session: Session) -> None:
    from infraestructure.database.models import PreguntaControlORM
    for control in session.exec(select(ControlORM)).all():
        if control.id_control is None:
            continue
        exists = session.exec(
            select(PreguntaControlORM).where(PreguntaControlORM.id_control == control.id_control).limit(1)
        ).first()
        if exists is not None:
            continue
        for texto, peso, dim in (
            (f"Nivel de madurez de {control.nombre[:40]} (1-5)", 1.0, "General"),
            (f"¿Existe documentación para {control.nombre[:30]}?", 0.5, "Documentación"),
        ):
            p = PreguntaORM(texto=texto, peso=peso, dimension=dim)
            session.add(p)
            session.flush()
            session.add(PreguntaControlORM(id_pregunta=p.id_pregunta, id_control=control.id_control))
    session.flush()


def _seed_formularios(session: Session) -> None:
    forms_seed = [
        {
            "nombre": "Formulario Completo de Seguridad (Todos los Niveles)",
            "descripcion": "Cuestionario base que evalúa los controles principales.",
            "activo": True,
            "aplica_nivel_bajo": True,
            "aplica_nivel_medio": True,
            "aplica_nivel_alto": True,
        },
        {
            "nombre": "Formulario Estratégico (Sólo Directivos)",
            "descripcion": "Cuestionario para alta gerencia.",
            "activo": True,
            "aplica_nivel_bajo": False,
            "aplica_nivel_medio": False,
            "aplica_nivel_alto": True,
        }
    ]

    existing_names = {
        item.nombre for item in session.exec(select(FormularioORM)).all()
    }
    
    for item in forms_seed:
        if item["nombre"] in existing_names:
            continue
        form = FormularioORM(**item)
        session.add(form)
        session.flush()
        
        # Link all questions to this form for demo purposes
        preguntas = session.exec(select(PreguntaORM)).all()
        for p in preguntas:
            session.add(FormularioPreguntaORM(id_formulario=form.id_formulario, id_pregunta=p.id_pregunta))
    
    session.flush()


def _seed_vulnerabilities(session: Session) -> None:
    empresa = session.exec(select(EmpresaORM).where(EmpresaORM.nombre == "ACME Ciberseguridad")).first()
    if empresa is None:
        return

    activo = session.exec(select(ActivoORM).where(ActivoORM.nombre == "Servidor Principal")).first()
    if activo is None:
        activo = ActivoORM(nombre="Servidor Principal", valor=9, id_empresa=empresa.id_empresa)
        session.add(activo)
        session.flush()

    riesgo = session.exec(select(RiesgoORM).where(RiesgoORM.descripcion == "Exfiltracion de datos")).first()
    if riesgo is None:
        riesgo = RiesgoORM(descripcion="Exfiltracion de datos", impacto=9, probabilidad=8, id_activo=activo.id_activo)
        session.add(riesgo)
        session.flush()

    vulnerability_descriptions = [
        "Credenciales debiles",
        "Software desactualizado",
        "Falta de MFA",
    ]
    for description in vulnerability_descriptions:
        vulnerability = session.exec(
            select(VulnerabilidadORM).where(VulnerabilidadORM.descripcion == description)
        ).first()
        if vulnerability is None:
            vulnerability = VulnerabilidadORM(descripcion=description)
            session.add(vulnerability)
            session.flush()

        link = session.exec(
            select(RiesgoVulnerabilidadORM).where(
                RiesgoVulnerabilidadORM.id_riesgo == riesgo.id_riesgo,
                RiesgoVulnerabilidadORM.id_vulnerabilidad == vulnerability.id_vulnerabilidad,
            )
        ).first()
        if link is None:
            session.add(
                RiesgoVulnerabilidadORM(
                    id_riesgo=riesgo.id_riesgo,
                    id_vulnerabilidad=vulnerability.id_vulnerabilidad,
                )
            )


def _seed_evaluaciones(session: Session) -> None:
    existing_evaluation = session.exec(select(EvaluacionORM).limit(1)).first()
    if existing_evaluation is not None:
        return

    empresa = session.exec(select(EmpresaORM)).first()
    usuario = session.exec(select(UsuarioORM).where(UsuarioORM.correo == "usuario3@mvp.local")).first()
    formulario = session.exec(select(FormularioORM)).first()
    if empresa is None or usuario is None or formulario is None:
        return

    ev = EvaluacionORM(
        fecha=date.today(),
        estado="pendiente",
        id_usuario=usuario.id_usuario,
        id_empresa=empresa.id_empresa,
        id_formulario=formulario.id_formulario,
    )
    session.add(ev)
    session.flush()


def seed_data_if_enabled() -> None:
    if not _is_enabled("SEED_ON_STARTUP", default="true"):
        return

    with Session(engine) as session:
        _seed_empresas(session)
        _seed_roles_and_users(session)
        _seed_controls(session)
        _seed_preguntas(session)
        _seed_formularios(session)
        _seed_vulnerabilities(session)
        _seed_evaluaciones(session)
        session.commit()