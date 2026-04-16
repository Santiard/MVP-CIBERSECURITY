import os
from datetime import date

from sqlmodel import Session, select

from app.db import engine
from infraestructure.database import (
    ActivoORM,
    ControlORM,
    EmpresaORM,
    EvaluacionControlORM,
    EvaluacionORM,
    PreguntaORM,
    RiesgoORM,
    RiesgoVulnerabilidadORM,
    RolORM,
    UsuarioORM,
    UsuarioOrganizacionORM,
    VulnerabilidadORM,
)


def _is_enabled(name: str, default: str = "true") -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {"1", "true", "yes", "on"}


def _seed_roles_and_users(session: Session) -> None:
    expected_roles = ["admin", "evaluator", "user"]
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

    users_seed = [
        {
            "nombre": "Admin Principal",
            "correo": "admin@gmail.com",
            "telefono": "+57 3000000001",
            "password": "Admin2026!Secure*",
            "rol": "admin",
        },
        {
            "nombre": "Evaluador Demo",
            "correo": "evaluador@mvp.local",
            "telefono": "+57 3000000002",
            "password": "ChangeMe123!",
            "rol": "evaluator",
        },
        {
            "nombre": "Usuario Organizacion",
            "correo": "usuario.org@mvp.local",
            "telefono": "+57 3000000003",
            "password": "OrgUser123!",
            "rol": "user",
        },
    ]

    existing_users = session.exec(select(UsuarioORM)).all()
    existing_emails = {user.correo for user in existing_users}

    # Keep a single canonical admin account with the expected default credentials.
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
            )
        )

    session.flush()


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


def _seed_questionnaires(session: Session) -> None:
    controls_seed = [
        {
            "nombre": "Gobierno y Politicas",
            "descripcion": "Control base de gobierno y politicas de seguridad",
            "dimensiones": 3,
            "activo": True,
            "confidencialidad": True,
            "integridad": True,
            "disponibilidad": True,
        },
        {
            "nombre": "Proteccion de Endpoint",
            "descripcion": "Control de proteccion para equipos de usuario",
            "dimensiones": 2,
            "activo": True,
            "confidencialidad": True,
            "integridad": True,
            "disponibilidad": False,
        },
    ]

    existing_names = {
        item.nombre for item in session.exec(select(ControlORM)).all()
    }
    for item in controls_seed:
        if item["nombre"] in existing_names:
            continue
        session.add(ControlORM(**item))


def _seed_preguntas(session: Session) -> None:
    """Al menos una pregunta por control para poder probar el flujo de cuestionario en el front."""
    for control in session.exec(select(ControlORM)).all():
        if control.id_control is None:
            continue
        exists = session.exec(
            select(PreguntaORM).where(PreguntaORM.id_control == control.id_control).limit(1)
        ).first()
        if exists is not None:
            continue
        for texto, peso in (
            (f"Indique el nivel de madurez observado en: {control.nombre[:40]} (1-5)", 1.0),
            ("Comentarios o evidencias relevantes (opcional en respuesta)", 0.5),
        ):
            session.add(PreguntaORM(texto=texto, peso=peso, id_control=control.id_control))


def _seed_vulnerabilities(session: Session) -> None:
    empresa = session.exec(select(EmpresaORM).where(EmpresaORM.nombre == "ACME Ciberseguridad")).first()
    if empresa is None:
        empresa = EmpresaORM(nombre="ACME Ciberseguridad", sector="Servicios", tamano="Mediana")
        session.add(empresa)
        session.flush()

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
    usuario = session.exec(select(UsuarioORM)).first()
    if empresa is None or usuario is None:
        return

    ev = EvaluacionORM(
        fecha=date.today(),
        estado="pendiente",
        id_usuario=usuario.id_usuario,
        id_empresa=empresa.id_empresa,
    )
    session.add(ev)
    session.flush()
    if ev.id_evaluacion is not None:
        for control in session.exec(select(ControlORM)).all():
            if control.id_control is None:
                continue
            session.add(
                EvaluacionControlORM(id_evaluacion=ev.id_evaluacion, id_control=control.id_control)
            )


def _seed_user_organization_assignments(session: Session) -> None:
    org = session.exec(select(EmpresaORM).where(EmpresaORM.nombre == "ACME Ciberseguridad")).first()
    user = session.exec(select(UsuarioORM).where(UsuarioORM.correo == "usuario.org@mvp.local")).first()
    if org is None or user is None or org.id_empresa is None or user.id_usuario is None:
        return

    existing = session.exec(
        select(UsuarioOrganizacionORM).where(
            UsuarioOrganizacionORM.id_usuario == user.id_usuario,
            UsuarioOrganizacionORM.id_empresa == org.id_empresa,
        )
    ).first()
    if existing is None:
        session.add(
            UsuarioOrganizacionORM(
                id_usuario=user.id_usuario,
                id_empresa=org.id_empresa,
            )
        )


def seed_data_if_enabled() -> None:
    if not _is_enabled("SEED_ON_STARTUP", default="true"):
        return

    with Session(engine) as session:
        _seed_roles_and_users(session)
        _seed_empresas(session)
        _seed_questionnaires(session)
        _seed_preguntas(session)
        _seed_vulnerabilities(session)
        _seed_evaluaciones(session)
        _seed_user_organization_assignments(session)
        session.commit()