import { apiFetch } from "./apiClient";
import { getEvaluationById, listEvaluations, type EvaluationDetail } from "./evaluationApi";
import dataService, { type Question } from "./dataService";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserApi = { id_usuario: number; nombre: string; correo?: string; id_rol?: number; id_empresa?: number };
type OrgApi  = { id_empresa?: number; id?: number; nombre?: string; name?: string; sector?: string; tamano?: string };
type RoleApi = { id_rol: number; nombre: string };
type FormApi = { id: string; name: string; description: string; active: boolean; roles_ids?: number[] };

export type ReportListItem = {
  id: string;
  title: string;
  date: string;
  estado: string;
  orgId: number;
  orgName: string;
  formularioId: number;
  formularioName: string;
  userId?: number;
  userName?: string;
  userRole?: string;
  evaluatorId?: number;
  evaluatorName?: string;
};

export type ReportCategory = {
  id: string;
  /** Nombre real del control/dominio */
  name: string;
  /** Score 0–100 */
  value: number;
  /** Número de preguntas respondidas / total */
  answered: number;
  total: number;
  dimensions: { confidencialidad: boolean; integridad: boolean; disponibilidad: boolean };
  rec_alta: string;
  rec_media: string;
  rec_baja: string;
};

export type ReportDetail = {
  id: string;
  orgName: string;
  score: number;
  level: string;
  levelColor: string;
  date: string;
  evaluator: string;
  estado: string;
  categories: ReportCategory[];
  recommendations: ReportRecommendation[];
  totalQuestions: number;
  answeredQuestions: number;
};

export type ReportRecommendation = {
  priority: "alta" | "media" | "baja";
  control: string;
  text: string;
};

// ─── Power BI / ISO 27001:2022 & 27002:2022 Taxonomy Types ───────────────────

export type NistFunction = "Identificar" | "Proteger" | "Detectar" | "Responder" | "Recuperar";
export type IsoAnnexCategory = "A.5 Organizacionales" | "A.6 Personas" | "A.7 Físicos" | "A.8 Tecnológicos";
export type ControlType = "Preventivo" | "Detectivo" | "Correctivo";
export type SecurityDomain = "Gobernanza y ecosistema" | "Protección" | "Defensa" | "Resiliencia";
export type OrgLevelTier = "Nivel Bajo (Operativo / Colaboradores)" | "Nivel Medio (Técnico / TI)" | "Nivel Alto (Estratégico / Dirección)";

export type EnrichedQuestionAnswer = {
  evaluationId: number;
  evaluationDate: string;
  evaluationEstado: string;
  orgId: number;
  orgName: string;
  orgSector: string;
  orgSize: string;
  formularioId: number;
  formularioName: string;
  levelTier: OrgLevelTier;
  userId: number;
  userName: string;
  userRole: string;
  evaluatorId?: number;
  evaluatorName: string;
  questionId: string;
  questionText: string;
  peso: number; // 1.0 | 0.7 | 0.4
  nature: "General" | "Documentación"; // Cláusula 7.5 (Documentación) vs Operación práctica
  rawValor?: number; // 1..5
  normalizedValor?: number; // 1..5 (invertido si es pregunta negativa)
  isReverseCoded: boolean;
  score: number | null; // 0..100
  comentario?: string;
  // Taxonomía ISO 27001 / 27002 / NIST / OSINT
  thematicDomain: string;
  isoControlRef: string;
  annexCategory: IsoAnnexCategory;
  nistFunction: NistFunction;
  controlType: ControlType;
  securityDomain: SecurityDomain;
  operationalCapability: string;
  cia: { c: boolean; i: boolean; a: boolean };
  isOsintVector: boolean;
  osintCategory?: string;
  isSharedTecEst: boolean;
  recommendation: string;
};

export type PowerBiDataset = {
  organizations: { id: number; name: string; sector: string; size: string }[];
  questionnaires: { id: number; name: string; description: string; levelTier: OrgLevelTier }[];
  evaluations: {
    id: number;
    orgId: number;
    orgName: string;
    formularioId: number;
    formularioName: string;
    levelTier: OrgLevelTier;
    userId: number;
    userName: string;
    userRole: string;
    evaluatorId?: number;
    evaluatorName: string;
    date: string;
    estado: string;
    totalQuestions: number;
    answeredQuestions: number;
    weightedScore: number;
  }[];
  records: EnrichedQuestionAnswer[];
};

// ─── Helpers & Psychometric Normalization (ISO/IEC 27004:2016) ───────────────

const REVERSE_CODED_PATTERNS = [
  "deja papeles, carpetas o notas con información delicada",
  "comparte su contraseña o usuario con compañeros",
  "anota sus contraseñas en notas adhesivas",
  "conecta memorias usb personales",
];

export function isReverseQuestion(text: string): boolean {
  const lc = text.toLowerCase();
  return REVERSE_CODED_PATTERNS.some((p) => lc.includes(p));
}

export function scoreFromValor(valor: unknown, reverse = false): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(valor);
  if (Number.isNaN(n) || n < 1) return null;
  if (n <= 5) {
    const adjusted = reverse ? 6 - n : n;
    return Math.max(0, Math.min(100, Math.round(adjusted * 20)));
  }
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function levelFromScore(score: number): { label: string; color: string; cmmi: number } {
  if (score >= 85) return { label: "Nivel 5 · Optimizado", color: "#15803d", cmmi: 5 };
  if (score >= 70) return { label: "Nivel 4 · Gestionado y Medido", color: "#16a34a", cmmi: 4 };
  if (score >= 55) return { label: "Nivel 3 · Definido", color: "#2563eb", cmmi: 3 };
  if (score >= 35) return { label: "Nivel 2 · Repetible / Básico", color: "#d97706", cmmi: 2 };
  return { label: "Nivel 1 · Inicial / Ad-hoc", color: "#dc2626", cmmi: 1 };
}

export function inferLevelTier(formName: string, userRole?: string): OrgLevelTier {
  const fn = formName.toLowerCase();
  const rl = (userRole || "").toLowerCase();
  if (fn.includes("estratégico") || fn.includes("estrategico") || rl === "user_nivel_alto") {
    return "Nivel Alto (Estratégico / Dirección)";
  }
  if (fn.includes("técnico") || fn.includes("tecnico") || rl === "user_nivel_medio") {
    return "Nivel Medio (Técnico / TI)";
  }
  return "Nivel Bajo (Operativo / Colaboradores)";
}

const SHARED_TEC_EST_PATTERNS = [
  "inventario formal de activos de información críticos",
  "inventario de flujos de datos personales y bases de datos",
  "atender las solicitudes de derechos de los titulares de datos",
  "reportar incidentes de seguridad y brechas de datos ante los entes reguladores",
  "planes de acción correctiva derivados de hallazgos en auditorías",
  "esquema de clasificación de información (pública, interna, confidencial, restringida)",
  "vigencia y efectividad de los acuerdos de confidencialidad (nda)",
  "nivel de madurez en ciberseguridad de la empresa utilizando marcos de referencia",
];

/**
 * Clasificador experto alineado a ISO/IEC 27001:2022 Anexo A, ISO/IEC 27002:2022 Atributos (30 dimensiones),
 * NIST CSF 2.0 y OSINT Framework / Bazzell (2019).
 */
export function classifyQuestionIso(text: string, dimensionField?: string | null): {
  thematicDomain: string;
  isoControlRef: string;
  annexCategory: IsoAnnexCategory;
  nistFunction: NistFunction;
  controlType: ControlType;
  securityDomain: SecurityDomain;
  operationalCapability: string;
  cia: { c: boolean; i: boolean; a: boolean };
  isOsintVector: boolean;
  osintCategory?: string;
  isSharedTecEst: boolean;
  recommendation: string;
} {
  const lc = text.toLowerCase();
  const isSharedTecEst = SHARED_TEC_EST_PATTERNS.some((p) => lc.includes(p));

  // 1. Puesto de trabajo, escritorio y pantalla limpia (ISO 27001 A.7.7 / A.7.8)
  if (
    lc.includes("bloquea o apaga su computador") ||
    lc.includes("pantalla de su computador bloqueada") ||
    lc.includes("papeles, carpetas o notas") ||
    lc.includes("observen su pantalla") ||
    lc.includes("cierra la sesión") ||
    lc.includes("bandeja de la impresora")
  ) {
    return {
      thematicDomain: "Escritorio y Pantalla Limpia",
      isoControlRef: "ISO 27001 A.7.7 / A.7.3",
      annexCategory: "A.7 Físicos",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad física",
      cia: { c: true, i: false, a: false },
      isOsintVector: lc.includes("papeles") || lc.includes("impresora") || lc.includes("observen"),
      osintCategory: lc.includes("papeles") || lc.includes("impresora") || lc.includes("observen")
        ? "Visual Hacking / Trashing Físico (OSINT Presencial)"
        : undefined,
      isSharedTecEst,
      recommendation: "Aplicar políticas obligatorias de bloqueo automático por GPO (<5 min) y escritorio limpio (Control A.7.7).",
    };
  }

  // 2. Contraseñas e higiene de credenciales de usuario (ISO 27001 A.5.17)
  if (
    lc.includes("contraseña") ||
    lc.includes("post-it")
  ) {
    return {
      thematicDomain: "Gestión de Contraseñas y Credenciales",
      isoControlRef: "ISO 27001 A.5.17 / A.8.5",
      annexCategory: "A.5 Organizacionales",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Gestión de identidades y accesos",
      cia: { c: true, i: true, a: false },
      isOsintVector: true,
      osintCategory: "Reutilización de Credenciales / Credential Stuffing (OSINT Breaches)",
      isSharedTecEst,
      recommendation: "Desplegar gestor de contraseñas corporativo, prohibir reutilización de claves y auditar frente a filtraciones OSINT (Control A.5.17).",
    };
  }

  // 3. Phishing, Vishing e Ingeniería Social (ISO 27001 A.6.3 / A.5.7 / OSINT Social Engineering)
  if (
    lc.includes("remitente real") ||
    lc.includes("correo sospechoso") ||
    lc.includes("enlaces de remitentes") ||
    lc.includes("llamada o mensaje por chat")
  ) {
    return {
      thematicDomain: "Defensa Anti-Phishing e Ingeniería Social",
      isoControlRef: "ISO 27001 A.6.3 / A.6.8",
      annexCategory: "A.6 Personas",
      nistFunction: "Detectar",
      controlType: "Detectivo",
      securityDomain: "Defensa",
      operationalCapability: "Seguridad de los RRHH",
      cia: { c: true, i: true, a: false },
      isOsintVector: true,
      osintCategory: "Spear-Phishing & Vishing basado en Reconocimiento OSINT",
      isSharedTecEst,
      recommendation: "Ejecutar campañas periódicas de simulación de phishing/vishing y habilitar botón de reporte temprano al SOC/TI (Controles A.6.3 y A.6.8).",
    };
  }

  // 4. Dispositivos, USB, Wi-Fi públicas y Shadow IT (ISO 27001 A.8.1 / A.7.10)
  if (
    lc.includes("memorias usb") ||
    lc.includes("instalar programas") ||
    lc.includes("descargar películas") ||
    lc.includes("wi-fi públicas") ||
    lc.includes("prestar su computador")
  ) {
    return {
      thematicDomain: "Seguridad de Dispositivos y Medios Extraíbles",
      isoControlRef: "ISO 27001 A.8.1 / A.7.10",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad de sistemas y redes",
      cia: { c: true, i: true, a: true },
      isOsintVector: lc.includes("wi-fi"),
      osintCategory: lc.includes("wi-fi") ? "Intercepción en Redes Abiertas / Rogue AP" : undefined,
      isSharedTecEst,
      recommendation: "Restringir privilegios de administrador local y puertos USB masivos por política técnica, exigiendo VPN en redes externas (Control A.8.1).",
    };
  }

  // 5. Privacidad, Fuga de Datos (DLP) y OPSEC en Redes Sociales (ISO 27001 A.5.12 / A.5.14 / A.8.12 / OSINT)
  if (
    lc.includes("correo electrónico personal") ||
    lc.includes("carpetas y servidores seguros") ||
    lc.includes("destruye físicamente o tritura") ||
    lc.includes("lugares públicos donde otros puedan escuchar") ||
    lc.includes("redes sociales fotografías") ||
    lc.includes("herramientas gratuitas de internet")
  ) {
    return {
      thematicDomain: "Prevención de Fuga de Datos (DLP) y OPSEC",
      isoControlRef: "ISO 27001 A.8.12 / A.5.14",
      annexCategory: "A.5 Organizacionales",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad de la información",
      cia: { c: true, i: false, a: false },
      isOsintVector: true,
      osintCategory: "Huella Digital, Metadatos y Fuga en Redes Sociales / Cloud (OSINT 2019)",
      isSharedTecEst,
      recommendation: "Establecer controles DLP contra envío a correos personales/herramientas web gratuitas y directrices OPSEC para redes sociales (Controles A.5.14 y A.8.12).",
    };
  }

  // 6. Teletrabajo y Movilidad (ISO 27001 A.6.7 / A.7.9)
  if (
    lc.includes("teletrabajo") ||
    lc.includes("conexión segura (vpn)") ||
    lc.includes("jornada de trabajo remoto") ||
    lc.includes("hurtan su celular corporativo")
  ) {
    return {
      thematicDomain: "Trabajo Remoto y Activos Móviles",
      isoControlRef: "ISO 27001 A.6.7 / A.7.9",
      annexCategory: "A.6 Personas",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad de los RRHH",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Reforzar política de teletrabajo con VPN siempre activa, cifrado BitLocker/FileVault y borrado remoto MDM (Controles A.6.7 y A.7.9).",
    };
  }

  // 7. Concienciación y reporte operativo (ISO 27001 A.6.3 / A.6.8)
  if (
    lc.includes("recomendaciones y normas de seguridad") ||
    lc.includes("capacitaciones o charlas") ||
    lc.includes("canal interno de la empresa debe acudir") ||
    lc.includes("comportamientos anormales") ||
    lc.includes("actualizaciones que el sistema le solicita")
  ) {
    return {
      thematicDomain: "Cultura, Concienciación y Reporte Temprano",
      isoControlRef: "ISO 27001 A.6.3 / A.6.8",
      annexCategory: "A.6 Personas",
      nistFunction: lc.includes("canal") || lc.includes("informa") ? "Responder" : "Proteger",
      controlType: lc.includes("canal") || lc.includes("informa") ? "Correctivo" : "Preventivo",
      securityDomain: "Defensa",
      operationalCapability: "Gestión de eventos de seguridad",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Mantener un programa anual medible de concientización y canales claros de reporte de incidentes (Controles A.6.3 y A.6.8).",
    };
  }

  // 8. IAM, Accesos Privilegiados y MFA Técnico (ISO 27001 A.5.15 / A.5.18 / A.8.2 / A.8.5)
  if (
    lc.includes("active directory / iam") ||
    lc.includes("cuentas administrativas separadas") ||
    lc.includes("cuentas huérfanas") ||
    lc.includes("autenticación multifactor (mfa)") ||
    lc.includes("privilegios elevados (root") ||
    lc.includes("gestor seguro de secretos (vault)")
  ) {
    return {
      thematicDomain: "IAM, Accesos Privilegiados (PAM) y MFA",
      isoControlRef: "ISO 27001 A.8.2 / A.8.5 / A.5.18",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Gestión de identidades y accesos",
      cia: { c: true, i: true, a: true },
      isOsintVector: lc.includes("vault") || lc.includes("mfa") || lc.includes("huérfanas"),
      osintCategory: lc.includes("vault") || lc.includes("mfa") || lc.includes("huérfanas")
        ? "Exposición de Llaves API / Cuentas Huérfanas en Repositorios y Accesos Remotos"
        : undefined,
      isSharedTecEst,
      recommendation: "Implantar MFA obligatorio en VPN/Cloud/RDP, segregación de cuentas privilegiadas (PAM) y bóveda de secretos (Controles A.8.2 y A.8.5).",
    };
  }

  // 9. Gestión de Parches, Vulnerabilidades y Hardening (ISO 27001 A.8.8 / A.8.9)
  if (
    lc.includes("parches de seguridad") ||
    lc.includes("escaneos automáticos de vulnerabilidades") ||
    lc.includes("endurecimiento (hardening") ||
    lc.includes("inventario automatizado de software") ||
    lc.includes("protocolos heredados o inseguros")
  ) {
    return {
      thematicDomain: "Gestión de Vulnerabilidades y Hardening",
      isoControlRef: "ISO 27001 A.8.8 / A.8.9",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: lc.includes("escaneos") || lc.includes("inventario") ? "Identificar" : "Proteger",
      controlType: lc.includes("escaneos") ? "Detectivo" : "Preventivo",
      securityDomain: "Defensa",
      operationalCapability: "Gestión de amenazas y vulnerabilidades",
      cia: { c: true, i: true, a: true },
      isOsintVector: lc.includes("protocolos heredados") || lc.includes("escaneos"),
      osintCategory: lc.includes("protocolos heredados") || lc.includes("escaneos")
        ? "Huella de Servicios y Banners Expuestos (Shodan / Censys OSINT Técnico)"
        : undefined,
      isSharedTecEst,
      recommendation: "Automatizar escaneos de vulnerabilidades (Nessus/OpenVAS), aplicar líneas base CIS Benchmarks y deshabilitar protocolos legados (Controles A.8.8 y A.8.9).",
    };
  }

  // 10. Redes, Segmentación y Seguridad Perimetral (ISO 27001 A.8.20 / A.8.21 / A.8.22)
  if (
    lc.includes("segmentada en vlans") ||
    lc.includes("firewalls / utms") ||
    lc.includes("ids/ips") ||
    lc.includes("dispositivos de red") ||
    lc.includes("acceso administrativo a equipos de red") ||
    lc.includes("red inalámbrica corporativa")
  ) {
    return {
      thematicDomain: "Arquitectura de Red, Segmentación y Perímetro",
      isoControlRef: "ISO 27001 A.8.20 / A.8.22",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: lc.includes("ids/ips") ? "Detectar" : "Proteger",
      controlType: lc.includes("ids/ips") ? "Detectivo" : "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad de sistemas y redes",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Segmentar redes en VLANs aisladas, depurar reglas de firewall semestralmente y mantener IPS activo en perímetro (Controles A.8.20 y A.8.22).",
    };
  }

  // 11. Respaldos 3-2-1 y Recuperación Técnica (ISO 27001 A.8.13 / A.8.14 / A.5.30)
  if (
    lc.includes("respaldos") ||
    lc.includes("regla 3-2-1") ||
    lc.includes("restauración de datos") ||
    lc.includes("disaster recovery técnico")
  ) {
    return {
      thematicDomain: "Respaldos (3-2-1) y Recuperación ante Desastres",
      isoControlRef: "ISO 27001 A.8.13 / A.5.30",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: "Recuperar",
      controlType: "Correctivo",
      securityDomain: "Resiliencia",
      operationalCapability: "Continuidad",
      cia: { c: false, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Garantizar backups bajo regla 3-2-1 con copia inmutable cifrada y pruebas trimestrales de restauración documentadas (Control A.8.13).",
    };
  }

  // 12. Protección en Endpoints, EDR y Antimalware (ISO 27001 A.8.7 / A.8.1)
  if (
    lc.includes("edr o antimalware") ||
    lc.includes("consola de antivirus/edr") ||
    lc.includes("macros no firmadas") ||
    lc.includes("puertos usb para almacenamiento masivo")
  ) {
    return {
      thematicDomain: "Protección de Endpoints (EDR) y Control de Ejecución",
      isoControlRef: "ISO 27001 A.8.7 / A.8.19",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: lc.includes("monitorean las alertas") ? "Detectar" : "Proteger",
      controlType: lc.includes("monitorean las alertas") ? "Detectivo" : "Preventivo",
      securityDomain: "Defensa",
      operationalCapability: "Configuración segura",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Mantener agentes EDR centralizados al 100%, bloquear ejecución de macros/scripts no firmados y aislar hosts ante alertas (Control A.8.7).",
    };
  }

  // 13. Monitoreo SIEM, Logs y Respuesta a Incidentes Técnicos (ISO 27001 A.8.15 / A.8.16 / A.8.17 / A.5.26)
  if (
    lc.includes("siem o servidor syslog") ||
    lc.includes("registros de eventos") ||
    lc.includes("sincronización horaria") ||
    lc.includes("logs almacenados") ||
    lc.includes("playbook técnico")
  ) {
    return {
      thematicDomain: "Monitoreo SIEM, Auditoría de Logs y CSIRT",
      isoControlRef: "ISO 27001 A.8.15 / A.8.16 / A.5.26",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: lc.includes("playbook") ? "Responder" : "Detectar",
      controlType: lc.includes("playbook") ? "Correctivo" : "Detectivo",
      securityDomain: "Defensa",
      operationalCapability: "Gestión de eventos de seguridad",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Centralizar logs críticos en SIEM con NTP sincronizado, almacenamiento inmutable y playbooks de contención probados (Controles A.8.15 y A.8.16).",
    };
  }

  // 14. Gestión de Cambios, Cifrado y Seguridad Cloud (ISO 27001 A.8.24 / A.8.32 / A.5.23)
  if (
    lc.includes("ambiente staging y plan de rollback") ||
    lc.includes("entornos de desarrollo, pruebas y producción") ||
    lc.includes("protocolos cifrados modernos (tls") ||
    lc.includes("cifrado en reposo (aes-256") ||
    lc.includes("recursos en la nube (aws, azure, gcp)") ||
    lc.includes("certificados tls")
  ) {
    return {
      thematicDomain: "Seguridad Cloud, Criptografía y DevSecOps",
      isoControlRef: "ISO 27001 A.5.23 / A.8.24 / A.8.32",
      annexCategory: "A.8 Tecnológicos",
      nistFunction: "Proteger",
      controlType: "Preventivo",
      securityDomain: "Protección",
      operationalCapability: "Seguridad de aplicaciones",
      cia: { c: true, i: true, a: true },
      isOsintVector: lc.includes("buckets públicos") || lc.includes("tls"),
      osintCategory: lc.includes("buckets públicos") || lc.includes("tls")
        ? "Exposición de Buckets S3/Cloud, Certificados CT Logs y Puertos Abiertos (Cloud OSINT)"
        : undefined,
      isSharedTecEst,
      recommendation: "Cerrar buckets públicos y puertos RDP/SSH expuestos a internet, forzar TLS 1.2/1.3 + AES-256 y segregar ambientes Dev/Prod (Controles A.5.23 y A.8.24).",
    };
  }

  // 15. Liderazgo, Gobierno y Cultura Directiva (ISO 27001 Cláusula 5 / A.5.1 / A.5.2 / A.5.4)
  if (
    lc.includes("alta dirección demuestra un compromiso") ||
    lc.includes("políticas de seguridad de la información están formalmente aprobadas") ||
    lc.includes("oficial o comité de seguridad") ||
    lc.includes("plan estratégico general del negocio") ||
    lc.includes("indicadores clave de riesgo (kri)") ||
    lc.includes("cultura corporativa de ciberseguridad") ||
    lc.includes("revisión anual del sgsi")
  ) {
    return {
      thematicDomain: "Gobierno del SGSI y Liderazgo Directivo",
      isoControlRef: "ISO 27001 Cláusula 5 / A.5.1 / A.5.4",
      annexCategory: "A.5 Organizacionales",
      nistFunction: "Identificar",
      controlType: "Preventivo",
      securityDomain: "Gobernanza y ecosistema",
      operationalCapability: "Gobierno",
      cia: { c: true, i: true, a: true },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Consolidar el Comité de Seguridad con reporte de KRIs a la Junta y revisión formal anual del SGSI (Cláusulas 5.1, 9.3 y Control A.5.1).",
    };
  }

  // 16. Gestión Estratégica de Riesgos e Inteligencia de Amenazas (ISO 27001 Cláusula 6.1 / A.5.7 / A.5.9)
  if (
    lc.includes("evaluación integral de riesgos") ||
    lc.includes("apetito y tolerancia al riesgo") ||
    lc.includes("matriz de riesgos corporativos") ||
    lc.includes("planes de tratamiento de riesgos") ||
    lc.includes("activos de información críticos") ||
    lc.includes("clasificación de información") ||
    lc.includes("incidentes del sector y nuevas amenazas") ||
    lc.includes("nivel de madurez en ciberseguridad")
  ) {
    return {
      thematicDomain: "Gestión de Riesgos, Activos e Inteligencia CTI",
      isoControlRef: "ISO 27001 Cláusula 6.1 / A.5.7 / A.5.9 / A.5.12",
      annexCategory: "A.5 Organizacionales",
      nistFunction: lc.includes("incidentes del sector") ? "Detectar" : "Identificar",
      controlType: lc.includes("incidentes del sector") ? "Detectivo" : "Preventivo",
      securityDomain: "Gobernanza y ecosistema",
      operationalCapability: lc.includes("activos") || lc.includes("clasificación") ? "Gestión de activos" : "Aseguramiento de la información",
      cia: { c: true, i: true, a: true },
      isOsintVector: lc.includes("incidentes del sector") || lc.includes("clasificación"),
      osintCategory: lc.includes("incidentes del sector") || lc.includes("clasificación")
        ? "Ciberinteligencia de Amenazas (CTI / OSINT A.5.7) y Clasificación Documental"
        : undefined,
      isSharedTecEst,
      recommendation: "Mantener el inventario de activos clasificado, formalizar el apetito de riesgo e integrar inteligencia de amenazas del sector (Control A.5.7 e ISO 27005).",
    };
  }

  // 17. Cumplimiento Legal, Privacidad (Habeas Data / GDPR) y Auditoría (ISO 27001 A.5.31..A.5.36 / Cláusula 9.2)
  if (
    lc.includes("requisitos legales, regulatorios") ||
    lc.includes("auditorías internas de seguridad") ||
    lc.includes("declaración de aplicabilidad (soa)") ||
    lc.includes("protección de datos personales") ||
    lc.includes("flujos de datos personales") ||
    lc.includes("derechos de los titulares") ||
    lc.includes("entes reguladores") ||
    lc.includes("planes de acción correctiva") ||
    lc.includes("acuerdos de confidencialidad (nda)")
  ) {
    return {
      thematicDomain: "Cumplimiento Legal, Privacidad y Auditoría SGSI",
      isoControlRef: "ISO 27001 A.5.31 / A.5.34 / Cláusula 9.2",
      annexCategory: "A.5 Organizacionales",
      nistFunction: lc.includes("entes reguladores") ? "Responder" : "Identificar",
      controlType: lc.includes("auditorías") ? "Detectivo" : lc.includes("correctiva") ? "Correctivo" : "Preventivo",
      securityDomain: "Gobernanza y ecosistema",
      operationalCapability: "Cumplimiento legal y normativo",
      cia: { c: true, i: true, a: false },
      isOsintVector: false,
      isSharedTecEst,
      recommendation: "Documentar el SoA, inventario de tratamiento de datos personales (Habeas Data/GDPR) y protocolo de notificación a reguladores (Controles A.5.24 y A.5.34).",
    };
  }

  // 18. Continuidad de Negocio (BCP), Gestión de Crisis y Proveedores (ISO 27001 A.5.19 / A.5.29 / A.5.30)
  return {
    thematicDomain: "Continuidad de Negocio (BCP), Crisis y Proveedores",
    isoControlRef: "ISO 27001 A.5.19 / A.5.29 / A.5.30",
    annexCategory: "A.5 Organizacionales",
    nistFunction: lc.includes("proveedores") || lc.includes("presupuesto") ? "Identificar" : lc.includes("comunicación de crisis") || lc.includes("simulación") ? "Responder" : "Recuperar",
    controlType: lc.includes("bcp") || lc.includes("rto") ? "Correctivo" : "Preventivo",
    securityDomain: "Resiliencia",
    operationalCapability: lc.includes("proveedores") ? "Seguridad de las relaciones con proveedores" : "Continuidad",
    cia: { c: true, i: true, a: true },
    isOsintVector: lc.includes("proveedores"),
    osintCategory: lc.includes("proveedores") ? "Riesgo de Terceros y Cadena de Suministro (Vendor OSINT)" : undefined,
    isSharedTecEst,
    recommendation: "Aprobar y probar anualmente el BCP con RTO/RPO definidos, protocolo de comunicación de crisis y auditoría de proveedores críticos (Controles A.5.19 y A.5.30).",
  };
}

function priorityFromScore(score: number): "alta" | "media" | "baja" {
  if (score < 40) return "alta";
  if (score < 70) return "media";
  return "baja";
}

async function fetchUsers(): Promise<UserApi[]> {
  const res = await apiFetch("/users", { method: "GET" });
  if (!res.ok) return [];
  return (await res.json()) as UserApi[];
}

async function fetchOrgs(): Promise<OrgApi[]> {
  const res = await apiFetch("/organizations", { method: "GET" });
  if (!res.ok) return [];
  return (await res.json()) as OrgApi[];
}

async function fetchRoles(): Promise<RoleApi[]> {
  const res = await apiFetch("/roles", { method: "GET" });
  if (!res.ok) return [];
  return (await res.json()) as RoleApi[];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listReports(): Promise<ReportListItem[]> {
  const [evaluations, orgs, users, forms, roles] = await Promise.all([
    listEvaluations(),
    fetchOrgs().catch(() => [] as OrgApi[]),
    fetchUsers().catch(() => [] as UserApi[]),
    dataService.getQuestionnaires().catch(() => [] as FormApi[]),
    fetchRoles().catch(() => [] as RoleApi[]),
  ]);

  const orgById = new Map(orgs.map((o) => [o.id_empresa ?? o.id ?? 0, o.nombre ?? o.name ?? ""]));
  const userById = new Map(users.map((u) => [u.id_usuario, u]));
  const roleById = new Map(roles.map((r) => [r.id_rol, r.nombre]));
  const formById = new Map((forms as FormApi[]).map((f) => [Number(f.id), f.name]));

  return evaluations.map((e) => {
    const orgId = e.organization_id ?? e.id_empresa;
    const orgName = orgById.get(orgId) ?? `Organización #${orgId}`;
    const evalUserId = e.id_evaluador ?? e.evaluator_id;
    const titularUser = e.id_usuario ? userById.get(e.id_usuario) : undefined;
    const formId = e.id_formulario ?? 1;
    const formName = formById.get(formId) ?? `Formulario #${formId}`;

    return {
      id: String(e.id_evaluacion),
      title: `${orgName} — ${formName}`,
      date: e.fecha ? String(e.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
      estado: e.estado ?? "pendiente",
      orgId,
      orgName,
      formularioId: formId,
      formularioName: formName,
      userId: e.id_usuario,
      userName: titularUser?.nombre ?? (e.id_usuario ? `Usuario #${e.id_usuario}` : undefined),
      userRole: titularUser?.id_rol ? roleById.get(titularUser.id_rol) : undefined,
      evaluatorId: evalUserId,
      evaluatorName: evalUserId ? userById.get(evalUserId)?.nombre : undefined,
    };
  });
}

export async function getReportByEvaluationId(id: string): Promise<ReportDetail> {
  const evalId = Number(id);

  const [evaluation, users, orgs] = await Promise.all([
    getEvaluationById(evalId),
    fetchUsers().catch(() => [] as UserApi[]),
    fetchOrgs().catch(() => [] as OrgApi[]),
  ]);

  const userById = new Map(users.map((u) => [u.id_usuario, u.nombre]));
  const orgById  = new Map(orgs.map((o) => [o.id_empresa ?? o.id ?? 0, o.nombre ?? o.name ?? ""]));

  const orgId   = evaluation.organization_id ?? evaluation.id_empresa;
  const orgName = orgById.get(orgId) ?? `Organización #${orgId}`;

  const evalUserId    = evaluation.id_evaluador ?? evaluation.evaluator_id;
  const evaluatorName = evalUserId ? (userById.get(evalUserId) ?? "No asignado") : "No asignado";

  const evaluationDate = evaluation.fecha
    ? String(evaluation.fecha).slice(0, 10)
    : (evaluation.created_at ? String(evaluation.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10));

  const answers = evaluation.answers ?? {};
  const questions = await dataService.getQuestionsByControl(String(evaluation.id_formulario));

  // Agrupamos por Dominio Temático ISO 27001 para dar un diagnóstico real y accionable
  const byDomain: Record<string, { questions: Question[]; meta: ReturnType<typeof classifyQuestionIso> }> = {};
  for (const q of questions) {
    const meta = classifyQuestionIso(q.text, q.dimension);
    if (!byDomain[meta.thematicDomain]) {
      byDomain[meta.thematicDomain] = { questions: [], meta };
    }
    byDomain[meta.thematicDomain].questions.push(q);
  }

  let globalWeightedSum = 0;
  let globalWeightTotal = 0;

  const categories: ReportCategory[] = Object.entries(byDomain).map(([domName, group], idx) => {
    let weightedSum = 0;
    let weightTotal = 0;
    let answered = 0;

    for (const q of group.questions) {
      const answer = answers[q.id];
      const reverse = isReverseQuestion(q.text);
      const score = scoreFromValor(answer?.valor, reverse);
      const peso = q.peso || 1.0;
      if (score !== null) {
        weightedSum += score * peso;
        weightTotal += peso;
        globalWeightedSum += score * peso;
        globalWeightTotal += peso;
        answered++;
      }
    }

    const avgScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

    return {
      id: `dom-${idx}`,
      name: `${domName} (${group.meta.isoControlRef})`,
      value: avgScore,
      answered,
      total: group.questions.length,
      dimensions: {
        confidencialidad: group.meta.cia.c,
        integridad: group.meta.cia.i,
        disponibilidad: group.meta.cia.a,
      },
      rec_alta: `[URGENTE · ${group.meta.isoControlRef}] ${group.meta.recommendation}`,
      rec_media: `[MEJORA · ${group.meta.isoControlRef}] ${group.meta.recommendation}`,
      rec_baja: `[MANTENIMIENTO · ${group.meta.isoControlRef}] Mantener monitoreo continuo y evidencia para auditoría.`,
    };
  });

  const totalQs    = categories.reduce((s, c) => s + c.total, 0);
  const answeredQs = categories.reduce((s, c) => s + c.answered, 0);
  const globalScore = globalWeightTotal > 0 ? Math.round(globalWeightedSum / globalWeightTotal) : 0;

  const recommendations: ReportRecommendation[] = categories
    .filter((c) => c.total > 0)
    .sort((a, b) => a.value - b.value)
    .map((c) => {
      let text = c.rec_baja;
      if (c.value < 40) text = c.rec_alta;
      else if (c.value < 70) text = c.rec_media;

      return {
        priority: priorityFromScore(c.value),
        control: c.name,
        text,
      };
    });

  const { label: level, color: levelColor } = levelFromScore(globalScore);

  return {
    id,
    orgName,
    score: globalScore,
    level,
    levelColor,
    date: evaluationDate,
    evaluator: evaluatorName,
    estado: evaluation.estado ?? "pendiente",
    categories,
    recommendations,
    totalQuestions: totalQs,
    answeredQuestions: answeredQs,
  };
}

/**
 * Construye el Dataset Completo para el Dashboard Interactivo estilo Power BI:
 * Carga todas las evaluaciones autorizadas, organizaciones, formularios, usuarios y preguntas,
 * enriqueciendo cada respuesta con su taxonomía ISO 27001:2022, ISO 27002:2022 (30 dimensiones),
 * NIST CSF 2.0 y vectores OSINT 2019.
 */
export async function loadPowerBiDataset(): Promise<PowerBiDataset> {
  const [evalRows, orgs, users, forms, roles] = await Promise.all([
    listEvaluations(),
    fetchOrgs().catch(() => [] as OrgApi[]),
    fetchUsers().catch(() => [] as UserApi[]),
    dataService.getQuestionnaires().catch(() => [] as FormApi[]),
    fetchRoles().catch(() => [] as RoleApi[]),
  ]);

  const orgById = new Map(
    orgs.map((o) => [
      o.id_empresa ?? o.id ?? 0,
      {
        id: o.id_empresa ?? o.id ?? 0,
        name: o.nombre ?? o.name ?? `Organización #${o.id_empresa ?? o.id}`,
        sector: o.sector ?? "General",
        size: o.tamano ?? "Mediana",
      },
    ])
  );
  const userById = new Map(users.map((u) => [u.id_usuario, u]));
  const roleById = new Map(roles.map((r) => [r.id_rol, r.nombre]));
  const formById = new Map((forms as FormApi[]).map((f) => [Number(f.id), f]));

  // Cargar detalles de cada evaluación y las preguntas de cada formulario único
  const uniqueFormIds = Array.from(
    new Set([
      ...evalRows.map((e) => e.id_formulario ?? 1),
      ...(forms as FormApi[]).map((f) => Number(f.id)),
    ])
  ).filter((id) => Number.isFinite(id) && id > 0);

  const [evalDetails, questionsPerForm] = await Promise.all([
    Promise.all(evalRows.map((r) => getEvaluationById(r.id_evaluacion).catch(() => null))),
    Promise.all(
      uniqueFormIds.map(async (fid) => {
        const qs = await dataService.getQuestionsByControl(String(fid)).catch(() => [] as Question[]);
        return [fid, qs] as const;
      })
    ),
  ]);

  const formQuestionsMap = new Map<number, Question[]>(questionsPerForm);
  const records: EnrichedQuestionAnswer[] = [];
  const evaluationsSummary: PowerBiDataset["evaluations"] = [];

  for (const ev of evalDetails) {
    if (!ev) continue;
    const orgId = ev.organization_id ?? ev.id_empresa;
    const orgInfo = orgById.get(orgId) ?? {
      id: orgId,
      name: `Organización #${orgId}`,
      sector: "General",
      size: "Mediana",
    };
    if (!orgById.has(orgId)) {
      orgById.set(orgId, orgInfo);
    }

    const formId = ev.id_formulario || 1;
    const formObj = formById.get(formId);
    const formName = formObj?.name ?? `Formulario #${formId}`;
    const titular = userById.get(ev.id_usuario);
    const userRole = titular?.id_rol ? (roleById.get(titular.id_rol) ?? "user_nivel_bajo") : "user_nivel_bajo";
    const userName = titular?.nombre ?? `Colaborador #${ev.id_usuario}`;
    const evalUserId = ev.id_evaluador ?? ev.evaluator_id;
    const evaluatorName = evalUserId ? (userById.get(evalUserId)?.nombre ?? `Evaluador #${evalUserId}`) : "Autoevaluación";
    const levelTier = inferLevelTier(formName, userRole);
    const evDate = ev.fecha
      ? String(ev.fecha).slice(0, 10)
      : ev.created_at
        ? String(ev.created_at).slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    const qs = formQuestionsMap.get(formId) ?? [];
    const answers = ev.answers ?? {};

    let weightedSum = 0;
    let weightTotal = 0;
    let answeredCount = 0;

    for (const q of qs) {
      const ans = answers[q.id];
      const rawVal = ans?.valor !== undefined && ans?.valor !== null && String(ans.valor).trim() !== ""
        ? Number(ans.valor)
        : undefined;
      const validRaw = rawVal !== undefined && !Number.isNaN(rawVal) && rawVal >= 1 && rawVal <= 5 ? rawVal : undefined;
      const reverse = isReverseQuestion(q.text);
      const normVal = validRaw !== undefined ? (reverse ? 6 - validRaw : validRaw) : undefined;
      const score = scoreFromValor(validRaw, reverse);
      const peso = q.peso || 1.0;

      if (score !== null) {
        weightedSum += score * peso;
        weightTotal += peso;
        answeredCount++;
      }

      const isoMeta = classifyQuestionIso(q.text, q.dimension);
      const nature: "General" | "Documentación" =
        (q.dimension || "").toLowerCase().includes("doc") ? "Documentación" : "General";

      records.push({
        evaluationId: ev.id_evaluacion,
        evaluationDate: evDate,
        evaluationEstado: ev.estado || "pendiente",
        orgId,
        orgName: orgInfo.name,
        orgSector: orgInfo.sector,
        orgSize: orgInfo.size,
        formularioId: formId,
        formularioName: formName,
        levelTier,
        userId: ev.id_usuario,
        userName,
        userRole,
        evaluatorId: evalUserId,
        evaluatorName,
        questionId: q.id,
        questionText: q.text,
        peso,
        nature,
        rawValor: validRaw,
        normalizedValor: normVal,
        isReverseCoded: reverse,
        score,
        comentario: ans?.comentario,
        ...isoMeta,
      });
    }

    evaluationsSummary.push({
      id: ev.id_evaluacion,
      orgId,
      orgName: orgInfo.name,
      formularioId: formId,
      formularioName: formName,
      levelTier,
      userId: ev.id_usuario,
      userName,
      userRole,
      evaluatorId: evalUserId,
      evaluatorName,
      date: evDate,
      estado: ev.estado || "pendiente",
      totalQuestions: qs.length,
      answeredQuestions: answeredCount,
      weightedScore: weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0,
    });
  }

  const questionnairesList = uniqueFormIds.map((fid) => {
    const f = formById.get(fid);
    const name = f?.name ?? `Formulario #${fid}`;
    return {
      id: fid,
      name,
      description: f?.description ?? "",
      levelTier: inferLevelTier(name),
    };
  });

  return {
    organizations: Array.from(orgById.values()).sort((a, b) => a.name.localeCompare(b.name)),
    questionnaires: questionnairesList,
    evaluations: evaluationsSummary,
    records,
  };
}
