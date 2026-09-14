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
    """Inserta y actualiza el banco masivo ISO 27001:2022 vinculándolo a los 3 niveles de formularios."""
    try:
        from app.questions_bank_seed import preguntas_banco
    except ImportError:
        preguntas_banco = []

    formulario_general = (
        session.exec(select(FormularioORM).where(FormularioORM.nombre.like("%General%"))).first()
        or session.exec(select(FormularioORM).where(FormularioORM.nombre.like("%Completo%"))).first()
    )
    formulario_tecnico = session.exec(
        select(FormularioORM).where(FormularioORM.nombre.like("%Técnico%") | FormularioORM.nombre.like("%Tecnico%"))
    ).first()
    formulario_estrategico = session.exec(
        select(FormularioORM).where(FormularioORM.nombre.like("%Estratégico%") | FormularioORM.nombre.like("%Estrategico%"))
    ).first()

    existing_questions = {p.texto: p for p in session.exec(select(PreguntaORM)).all()}
    existing_links = {(lp.id_formulario, lp.id_pregunta) for lp in session.exec(select(FormularioPreguntaORM)).all()}

    for item in preguntas_banco:
        texto = item["texto"]
        if texto in existing_questions:
            p = existing_questions[texto]
            p.peso = item["peso"]
            p.dimension = item["dimension"]
            session.add(p)
            session.flush()
        else:
            p = PreguntaORM(
                texto=texto,
                peso=item["peso"],
                dimension=item["dimension"],
            )
            session.add(p)
            session.flush()
            existing_questions[texto] = p

        tipo = item.get("formulario_tipo", "general")
        target_forms = []
        if tipo in ("general", "completo"):
            if formulario_general:
                target_forms.append(formulario_general)
        elif tipo == "tecnico":
            if formulario_tecnico:
                target_forms.append(formulario_tecnico)
        elif tipo == "estrategico":
            if formulario_estrategico:
                target_forms.append(formulario_estrategico)
        elif tipo == "tec_est":
            if formulario_tecnico:
                target_forms.append(formulario_tecnico)
            if formulario_estrategico:
                target_forms.append(formulario_estrategico)
        elif tipo == "todos":
            for f in (formulario_general, formulario_tecnico, formulario_estrategico):
                if f:
                    target_forms.append(f)

        for form in target_forms:
            link_key = (form.id_formulario, p.id_pregunta)
            if link_key not in existing_links:
                session.add(
                    FormularioPreguntaORM(
                        id_formulario=form.id_formulario,
                        id_pregunta=p.id_pregunta,
                    )
                )
                existing_links.add(link_key)

    session.flush()


def _seed_formularios(session: Session) -> None:
    forms_seed = [
        {
            "nombre": "Formulario General de Seguridad (Todos los Colaboradores)",
            "descripcion": "Cuestionario base en lenguaje neutro y accesible sobre hábitos de seguridad en el puesto de trabajo, descansos, contraseñas y prevención de riesgos para todo el personal.",
            "activo": True,
            "aplica_nivel_bajo": True,
            "aplica_nivel_medio": True,
            "aplica_nivel_alto": True,
        },
        {
            "nombre": "Formulario Técnico de Ciberseguridad (Sistemas y TI)",
            "descripcion": "Cuestionario técnico y operativo orientado al equipo de TI y soporte de sistemas: gestión de accesos, parches, redes, respaldos, hardening y monitoreo.",
            "activo": True,
            "aplica_nivel_bajo": False,
            "aplica_nivel_medio": True,
            "aplica_nivel_alto": True,
        },
        {
            "nombre": "Formulario Estratégico (Directivos y Gerencia)",
            "descripcion": "Cuestionario de nivel directivo y gerencial enfocado en gobierno de la seguridad, gestión de riesgos, presupuesto, continuidad del negocio y cumplimiento normativo.",
            "activo": True,
            "aplica_nivel_bajo": False,
            "aplica_nivel_medio": False,
            "aplica_nivel_alto": True,
        }
    ]

    existing_forms = {f.nombre: f for f in session.exec(select(FormularioORM)).all()}
    
    # Si existía el nombre antiguo "Formulario Completo de Seguridad (Todos los Niveles)", renombrarlo
    old_completo = existing_forms.get("Formulario Completo de Seguridad (Todos los Niveles)")
    if old_completo and "Formulario General de Seguridad (Todos los Colaboradores)" not in existing_forms:
        old_completo.nombre = "Formulario General de Seguridad (Todos los Colaboradores)"
        old_completo.descripcion = forms_seed[0]["descripcion"]
        old_completo.aplica_nivel_bajo = True
        old_completo.aplica_nivel_medio = True
        old_completo.aplica_nivel_alto = True
        session.add(old_completo)
        existing_forms[old_completo.nombre] = old_completo

    # Si existía "Formulario Estratégico (Sólo Directivos)", actualizar nombre
    old_estrategico = existing_forms.get("Formulario Estratégico (Sólo Directivos)")
    if old_estrategico and "Formulario Estratégico (Directivos y Gerencia)" not in existing_forms:
        old_estrategico.nombre = "Formulario Estratégico (Directivos y Gerencia)"
        old_estrategico.descripcion = forms_seed[2]["descripcion"]
        old_estrategico.aplica_nivel_bajo = False
        old_estrategico.aplica_nivel_medio = False
        old_estrategico.aplica_nivel_alto = True
        session.add(old_estrategico)
        existing_forms[old_estrategico.nombre] = old_estrategico

    for item in forms_seed:
        if item["nombre"] in existing_forms:
            continue
        form = FormularioORM(**item)
        session.add(form)
        session.flush()
        existing_forms[item["nombre"]] = form

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
        # Los formularios deben existir ANTES que las preguntas para poder vincularlas
        _seed_formularios(session)
        _seed_preguntas(session)
        _seed_vulnerabilities(session)
        _seed_evaluaciones(session)
        session.commit()