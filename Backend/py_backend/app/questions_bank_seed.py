# ============================================================
# BANCO MASIVO DE PREGUNTAS – ISO 27001:2022
#
# ESCALA DE RESPUESTA (1 a 5):
#   1 = Nunca / No implementado
#   2 = Rara vez / Inicial o esporádico
#   3 = A veces / En proceso o parcial
#   4 = Casi siempre / Implementado formalmente
#   5 = Siempre / Continuamente optimizado y verificado
#
# dimension: "General" o "Documentación"
# peso:      1.0 = Alto | 0.7 = Medio | 0.4 = Bajo
#
# formulario_tipo:
#   "general"     → Formulario General (todos los colaboradores, lenguaje neutro y cotidiano)
#   "tecnico"     → Formulario Técnico de Ciberseguridad (personal de Sistemas y TI)
#   "estrategico" → Formulario Estratégico (directivos y alta gerencia)
#   "tec_est"     → Vinculado a Técnico y Estratégico
# ============================================================

preguntas_banco = [

    # ══════════════════════════════════════════════════════════════
    # 🟢 FORMULARIO GENERAL — Para todos los miembros de la empresa
    # Lenguaje neutro, accesible, sin tecnicismos complejos
    # ══════════════════════════════════════════════════════════════

    # — Puesto de trabajo, descansos y final de jornada —
    {
        "texto": "Al terminar su jornada laboral o al tomar un descanso (break), ¿con qué frecuencia bloquea o apaga su computador para evitar que otros lo utilicen?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "Cuando se ausenta de su puesto de trabajo por reuniones, almuerzo o llamadas, ¿qué tan seguido se asegura de dejar la pantalla de su computador bloqueada?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia deja papeles, carpetas o notas con información delicada de la empresa o de clientes a la vista sobre su escritorio cuando se retira de su puesto?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "Al escribir su contraseña o consultar información privada de clientes, ¿qué tan atento(a) está de que personas a su alrededor no observen su pantalla?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "Al finalizar el día, ¿con qué frecuencia guarda sus archivos de trabajo abiertos y cierra la sesión de su computador?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "Cuando envía a imprimir documentos con datos de la empresa o clientes, ¿con qué frecuencia los retira inmediatamente de la bandeja de la impresora?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },

    # — Contraseñas y claves de acceso —
    {
        "texto": "¿Con qué frecuencia utiliza una contraseña distinta para cada aplicación o sistema del trabajo en lugar de repetir la misma siempre?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia comparte su contraseña o usuario con compañeros de trabajo, aunque sea por una urgencia o para agilizar una labor?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Qué tan elaboradas son las contraseñas que utiliza en su trabajo (mezcla mayúsculas, minúsculas, números y símbolos sin usar nombres de familiares o fechas conocidas)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia anota sus contraseñas en notas adhesivas (post-it) pegadas al monitor, cuadernos a la vista o archivos de texto sin clave?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia cambia sus contraseñas de acceso cuando el sistema se lo solicita o cuando sospecha que alguien más pudo haberla visto?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },

    # — Correo electrónico y mensajes sospechosos (Phishing) —
    {
        "texto": "Antes de hacer clic en enlaces o abrir archivos adjuntos en un correo electrónico, ¿con qué frecuencia verifica minuciosamente quién es el remitente real?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "Si recibe un correo sospechoso que solicita urgentemente contraseñas, pagos o datos personales, ¿qué tan seguido lo reporta al área encargada antes de responderlo?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita descargar archivos o abrir enlaces de remitentes que no conoce o que no estaba esperando recibir?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "Si recibe una llamada o mensaje por chat de alguien que afirma ser del banco o de un proveedor pidiendo claves o datos de la empresa, ¿con qué frecuencia verifica su autenticidad?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },

    # — Dispositivos, memorias USB e instalación de programas —
    {
        "texto": "¿Con qué frecuencia conecta memorias USB personales, discos externos o celulares propios en los computadores de la empresa sin autorización previa?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita instalar programas, juegos, extensiones de navegador o software no autorizado en su computador de trabajo?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita utilizar los equipos y el internet de la empresa para descargar películas, música o archivos no relacionados con su trabajo?",
        "dimension": "General",
        "peso": 0.4,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita conectarse a redes Wi-Fi públicas o abiertas (en cafeterías, aeropuertos o plazas) para realizar labores de la empresa?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita prestar su computador de trabajo o celular corporativo a personas ajenas a la empresa, como familiares o amistades?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },

    # — Cuidado de la información y privacidad —
    {
        "texto": "¿Con qué frecuencia evita reenviar bases de datos, contratos o información confidencial de la empresa a su correo electrónico personal?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia guarda sus archivos y documentos de trabajo en las carpetas y servidores seguros de la empresa en lugar de dejarlos únicamente en su computador?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia destruye físicamente o tritura documentos impresos con datos sensibles de clientes o de la compañía antes de tirarlos a la basura?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia tiene la precaución de no comentar información confidencial de proyectos o clientes en lugares públicos donde otros puedan escuchar?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia evita publicar en redes sociales fotografías o videos de su puesto de trabajo donde se aprecien pantallas, documentos o credenciales?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "Antes de utilizar herramientas gratuitas de internet (como traductores en línea o convertidores de PDF) con documentos de la empresa, ¿consulta si está permitido?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },

    # — Normas, capacitaciones y reporte de incidentes —
    {
        "texto": "¿Qué tan claras y comprensibles le parecen las recomendaciones y normas de seguridad de la información que le han explicado en la empresa?",
        "dimension": "Documentación",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia asiste y presta atención a las capacitaciones o charlas sobre seguridad de la información que organiza la compañía?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Sabe con claridad a qué persona o canal interno de la empresa debe acudir si nota algo extraño en su equipo, virus o sospecha de un fraude?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia informa oportunamente al área de soporte cuando su computador presenta comportamientos anormales, ventanas sospechosas o lentitud repentina?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia permite que su computador se reinicie o aplique las actualizaciones que el sistema le solicita para mantener el equipo al día?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },

    # — Trabajo remoto y movilidad —
    {
        "texto": "Cuando realiza teletrabajo o trabaja desde casa, ¿con qué frecuencia se asegura de que nadie más en su hogar tenga acceso a su equipo de trabajo?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "¿Con qué frecuencia utiliza la conexión segura (VPN) de la empresa cuando necesita acceder a los sistemas internos desde fuera de la oficina?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },
    {
        "texto": "Al terminar su jornada de trabajo remoto, ¿con qué frecuencia cierra todas las aplicaciones laborales y apaga correctamente el computador?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "general",
    },
    {
        "texto": "Si llega a perder o le hurtan su celular corporativo o computador de trabajo, ¿conoce a quién avisar inmediatamente para que bloqueen sus accesos?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "general",
    },

    # ══════════════════════════════════════════════════════════════
    # 🔵 FORMULARIO TÉCNICO — Para personal de Sistemas, Soporte y TI
    # Lenguaje técnico, operacional y de ingeniería
    # ══════════════════════════════════════════════════════════════

    # — Gestión de accesos, privilegios y autenticación —
    {
        "texto": "¿Con qué frecuencia se ejecutan auditorías periódicas de privilegios de acceso en Active Directory / IAM y se revocan permisos innecesarios?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida el personal técnico utiliza cuentas administrativas separadas de sus cuentas de usuario estándar, aplicando el principio de mínimo privilegio?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se identifican y dan de baja cuentas huérfanas, de ex-empleados o inactivas por más de 30 días en todos los sistemas y servidores?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida está implementada la autenticación multifactor (MFA) obligatoria para accesos a consolas cloud, VPN corporativa, SSH y escritorios remotos (RDP)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se auditan los accesos y comandos ejecutados por usuarios con privilegios elevados (root / Domain Admin) mediante herramientas de logging?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida las cuentas de servicio, llaves API y credenciales de aplicaciones están documentadas y almacenadas en un gestor seguro de secretos (Vault)?",
        "dimension": "Documentación",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },

    # — Gestión de parches, vulnerabilidades y hardening —
    {
        "texto": "¿Con qué frecuencia se aplican parches de seguridad críticos en sistemas operativos, servidores y dispositivos de red dentro del tiempo establecido por SLA?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida existe un procedimiento formal documentado para la evaluación, prueba y despliegue de parches de seguridad antes de su paso a producción?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se ejecutan escaneos automáticos de vulnerabilidades (con herramientas como Nessus, OpenVAS u homólogos) sobre redes y servidores?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida se aplican guías de endurecimiento (hardening tipo CIS Benchmarks) en la configuración base de servidores, bases de datos y estaciones?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se realiza el inventario automatizado de software instalado en endpoints para detectar aplicaciones no autorizadas o vulnerables?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida están deshabilitados los servicios, puertos y protocolos heredados o inseguros (como Telnet, SMBv1, HTTP sin cifrar, SNMPv1/v2) en la infraestructura?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },

    # — Redes, segmentación y seguridad perimetral —
    {
        "texto": "¿En qué medida la red corporativa se encuentra segmentada en VLANs separadas (producción, servidores, usuarios, Wi-Fi de invitados y administración de red)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se revisan y depuran las reglas de filtrado en Firewalls / UTMs para eliminar reglas redundantes, excesivamente permisivas o inactivas?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida está implementado un sistema de detección/prevención de intrusiones (IDS/IPS) activo en los puntos de entrada y salida de la red?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se verifica que los dispositivos de red (switches, routers, firewalls) tengan su firmware actualizado y contraseñas por defecto cambiadas?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida el acceso administrativo a equipos de red está restringido a direcciones IP de gestión autorizadas mediante protocolos cifrados (SSHv2)?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida la red inalámbrica corporativa cuenta con autenticación robusta (WPA2/WPA3 Enterprise con 802.1X) y separación total de la red de invitados?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },

    # — Respaldo de información, recuperación y continuidad técnica —
    {
        "texto": "¿Con qué frecuencia se ejecutan respaldos automatizados de bases de datos y servidores según la periodicidad establecida (diario, semanal, mensual)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los respaldos cumplen con la regla 3-2-1 (3 copias, 2 medios diferentes, 1 copia fuera de sitio o en almacenamiento inmutable en la nube)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se realizan pruebas periódicas de restauración de datos a partir de los respaldos para validar la integridad de la información recuperada?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los respaldos se encuentran protegidos con cifrado tanto en tránsito como en reposo y con acceso restringido a operadores autorizados?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Existe un procedimiento documentado de Disaster Recovery técnico con pasos secuenciales para el levantamiento de servidores críticos?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },

    # — Protección en endpoints, EDR y antimalware —
    {
        "texto": "¿En qué medida todos los endpoints y servidores cuentan con un agente de protección EDR o antimalware centralizado y con firmas actualizadas al día?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se monitorean las alertas generadas por la consola de antivirus/EDR y se aplican acciones de aislamiento ante detecciones sospechosas?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida se encuentra bloqueada por política técnica la ejecución de macros no firmadas y scripts no autorizados (PowerShell sin firmar, VBScript) en endpoints?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida está restringido técnicamente el uso de puertos USB para almacenamiento masivo en estaciones de trabajo mediante políticas de grupo (GPO)?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },

    # — Monitoreo, logs y respuesta técnica a incidentes —
    {
        "texto": "¿En qué medida los eventos de seguridad y registros de auditoría (logs) de servidores, firewalls y controladores de dominio están centralizados en un SIEM o servidor Syslog?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se revisan los registros de eventos del sistema en busca de anomalías, intentos fallidos de autenticación o actividad no autorizada?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los registros de eventos cuentan con sincronización horaria precisa mediante servidores NTP configurados en toda la infraestructura?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los logs almacenados están protegidos contra modificación o borrado accidental y se conservan por el tiempo requerido por la política?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Existe un playbook técnico documentado para la contención, recolección de evidencia y aislamiento de hosts comprometidos por malware o intrusión?",
        "dimension": "Documentación",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },

    # — Gestión de cambios, desarrollo y seguridad en la nube —
    {
        "texto": "¿Con qué frecuencia los cambios en sistemas de producción pasan por un proceso formal de revisión, pruebas en ambiente staging y plan de rollback?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los entornos de desarrollo, pruebas y producción están estrictamente aislados sin compartir credenciales ni datos productivos no enmascarados?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida las comunicaciones sensibles utilizan protocolos cifrados modernos (TLS 1.2 o 1.3) y certificados digitales válidos sin excepciones?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se verifica el cifrado en reposo (AES-256 o equivalente) en discos de servidores, bases de datos y buckets de almacenamiento cloud?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿En qué medida los recursos en la nube (AWS, Azure, GCP) están configurados con reglas estrictas de acceso, evitando buckets públicos y puertos SSH/RDP abiertos a internet?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tecnico",
    },
    {
        "texto": "¿Con qué frecuencia se rota el inventario de certificados TLS, llaves criptográficas y tokens de servicio antes de su fecha de vencimiento?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tecnico",
    },

    # ══════════════════════════════════════════════════════════════
    # 🔴 FORMULARIO ESTRATÉGICO — Para directivos y alta gerencia
    # Lenguaje directivo: gobierno, gestión de riesgos, presupuesto y cumplimiento
    # ══════════════════════════════════════════════════════════════

    # — Liderazgo, gobierno y cultura corporativa —
    {
        "texto": "¿En qué medida la alta dirección demuestra un compromiso visible con la ciberseguridad, asignando presupuesto anual y participando en decisiones clave?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿En qué nivel las políticas de seguridad de la información están formalmente aprobadas por la gerencia, actualizadas y comunicadas a toda la organización?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Cuenta la organización con un oficial o comité de seguridad de la información con funciones definidas y canal de reporte directo a la dirección general?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿En qué nivel los objetivos de ciberseguridad están alineados e integrados dentro del plan estratégico general del negocio de la organización?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Con qué frecuencia la alta dirección recibe y analiza reportes periódicos con indicadores clave de riesgo (KRI) e incidentes de seguridad?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Promueve activamente la alta gerencia una cultura corporativa de ciberseguridad donde los colaboradores informen incidentes de forma transparente y constructiva?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "estrategico",
    },

    # — Gestión estratégica de riesgos de negocio —
    {
        "texto": "¿En qué medida la organización ejecuta al menos una vez al año una evaluación integral de riesgos de seguridad de la información aprobada por la dirección?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Ha definido formalmente la alta dirección los niveles de apetito y tolerancia al riesgo aceptables para las operaciones y activos de la empresa?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Están los riesgos cibernéticos articulados e integrados dentro de la matriz de riesgos corporativos y estratégicos de la empresa?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Con qué periodicidad revisa el comité directivo los planes de tratamiento de riesgos y hace seguimiento a los riesgos clasificados como altos o críticos?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿En qué medida la organización evalúa formalmente los riesgos de ciberseguridad asociados a proveedores estratégicos y aliados comerciales?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },

    # — Cumplimiento legal, regulatorio y contractual —
    {
        "texto": "¿En qué medida la organización mantiene identificados y gestionados todos los requisitos legales, regulatorios y contractuales en materia de seguridad y datos?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Con qué frecuencia se llevan a cabo auditorías internas de seguridad con emisión de informes formales y seguimiento a las no conformidades?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Tiene formalmente documentado la organización el alcance de su Sistema de Gestión de Seguridad de la Información (SGSI) y su Declaración de Aplicabilidad (SoA)?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿En qué nivel se supervisa el cumplimiento de la ley de protección de datos personales (Habeas Data, GDPR u homólogos) respecto a la información de clientes y colaboradores?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },

    # — Continuidad de negocio, resiliencia y gestión de crisis —
    {
        "texto": "¿Cuenta la organización con un Plan de Continuidad de Negocio (BCP) aprobado por la dirección que contemple escenarios de ciberataques y caídas prolongadas?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Con qué frecuencia se realizan ejercicios de simulación o pruebas de crisis ante escenarios de ciberataques mayores (como ransomware o fuga masiva de datos)?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Ha establecido la dirección los Tiempos Máximos de Recuperación (RTO) y Puntos de Recuperación (RPO) tolerables para los procesos y servicios críticos?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Existe un comité y protocolo de comunicación de crisis que defina los voceros y lineamientos ante clientes, medios y autoridades ante brechas graves?",
        "dimension": "Documentación",
        "peso": 0.7,
        "formulario_tipo": "estrategico",
    },

    # — Presupuesto, proveedores y mejora continua —
    {
        "texto": "¿El presupuesto anual asignado a tecnologías de seguridad, herramientas y capacitación es suficiente y coherente con el nivel de riesgo de la empresa?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Se incluyen cláusulas contractuales vinculantes de confidencialidad, seguridad y derecho a auditoría en todos los contratos con proveedores críticos?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿Con qué frecuencia se realiza la revisión anual del SGSI por parte de la alta dirección para asegurar su conveniencia, adecuación y eficacia continua?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "estrategico",
    },
    {
        "texto": "¿En qué medida la organización analiza los incidentes del sector y nuevas amenazas para actualizar y robustecer proactivamente su postura de defensa?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "estrategico",
    },

    # ══════════════════════════════════════════════════════════════
    # 🟡 TÉCNICO + ESTRATÉGICO — Temas compartidos
    # Evaluados tanto en el formulario técnico como en el estratégico
    # ══════════════════════════════════════════════════════════════

    {
        "texto": "¿En qué medida se mantiene actualizado un inventario formal de activos de información críticos con sus respectivos responsables asignados?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿Cuenta la organización con un inventario de flujos de datos personales y bases de datos que especifique finalidades, custodios y tiempos de retención?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿En qué medida existen mecanismos formalmente establecidos para atender las solicitudes de derechos de los titulares de datos personales en los plazos de ley?",
        "dimension": "General",
        "peso": 1.0,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿Existe un procedimiento formal para reportar incidentes de seguridad y brechas de datos ante los entes reguladores dentro de los tiempos exigidos?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿En qué medida se documenta y da seguimiento formal a los planes de acción correctiva derivados de hallazgos en auditorías y evaluaciones de seguridad?",
        "dimension": "Documentación",
        "peso": 1.0,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿Con qué frecuencia se aplica un esquema de clasificación de información (Pública, Interna, Confidencial, Restringida) en documentos y sistemas?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿Con qué periodicidad se revisa la vigencia y efectividad de los acuerdos de confidencialidad (NDA) suscritos con empleados y terceros colaboradores?",
        "dimension": "Documentación",
        "peso": 0.7,
        "formulario_tipo": "tec_est",
    },
    {
        "texto": "¿En qué nivel se evalúa el nivel de madurez en ciberseguridad de la empresa utilizando marcos de referencia reconocidos (ISO 27001, NIST CSF)?",
        "dimension": "General",
        "peso": 0.7,
        "formulario_tipo": "tec_est",
    },
]
