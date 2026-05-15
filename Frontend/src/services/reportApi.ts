import { apiFetch } from "./apiClient";
import { getEvaluationById, listEvaluations, listEvaluationControls } from "./evaluationApi";
import dataService from "./dataService";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserApi = { id_usuario: number; nombre: string };
type OrgApi  = { id_empresa?: number; id?: number; nombre?: string; name?: string };

export type ReportListItem = {
  id: string;
  title: string;
  date: string;
  estado: string;
  orgName: string;
  evaluatorId?: number;
  evaluatorName?: string;
};

export type ReportCategory = {
  id: string;
  /** Nombre real del control/formulario */
  name: string;
  /** Score 0–100 */
  value: number;
  /** Número de preguntas respondidas / total */
  answered: number;
  total: number;
  /** Dimensiones CIA afectadas */
  dimensions: { confidencialidad: boolean; integridad: boolean; disponibilidad: boolean };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreFromValor(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(valor);
  if (Number.isNaN(n)) return null;
  if (n <= 5) return Math.max(0, Math.min(100, Math.round(n * 20)));
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelFromScore(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Madurez Avanzada",    color: "#16a34a" };
  if (score >= 60) return { label: "Madurez Intermedia",  color: "#2563eb" };
  if (score >= 40) return { label: "Madurez Básica",      color: "#d97706" };
  return           { label: "Madurez Inicial",             color: "#dc2626" };
}

function recommendationText(control: string, score: number): string {
  const lc = control.toLowerCase();

  if (lc.includes("gobierno") || lc.includes("política") || lc.includes("politica")) {
    if (score < 40) return `Establecer políticas formales de seguridad de la información en ${control}. Sin un marco de gobierno definido, la organización opera sin lineamientos claros.`;
    if (score < 70) return `Revisar y actualizar las políticas existentes de ${control}. Asegurar que estén difundidas y sean comprendidas por todo el personal.`;
    return `Mantener revisiones periódicas y auditorías del programa de gobierno en ${control}.`;
  }
  if (lc.includes("endpoint") || lc.includes("equipo") || lc.includes("dispositivo")) {
    if (score < 40) return `Implementar soluciones de protección en los dispositivos de usuario final para ${control}. Los equipos sin protección son la principal puerta de entrada de amenazas.`;
    if (score < 70) return `Fortalecer la gestión de parches y la configuración segura de endpoints en ${control}.`;
    return `Considerar soluciones EDR avanzadas y revisión continua en ${control}.`;
  }
  if (lc.includes("red") || lc.includes("network") || lc.includes("perímetro") || lc.includes("perimetro")) {
    if (score < 40) return `Segmentar la red y establecer controles de acceso perimetral para ${control}. Una red plana facilita la propagación de ataques.`;
    if (score < 70) return `Revisar reglas de firewall y habilitar monitoreo de tráfico en ${control}.`;
    return `Implementar inspección profunda de paquetes y detección de anomalías en ${control}.`;
  }
  if (lc.includes("acceso") || lc.includes("identidad") || lc.includes("autenticac")) {
    if (score < 40) return `Implementar autenticación multifactor (MFA) y gestión de identidades en ${control}. El control de acceso débil es el vector de ataque más común.`;
    if (score < 70) return `Aplicar principio de mínimo privilegio y revisar cuentas inactivas en ${control}.`;
    return `Adoptar modelo Zero Trust y revisión periódica de privilegios en ${control}.`;
  }
  if (lc.includes("respuesta") || lc.includes("incidente")) {
    if (score < 40) return `Definir un plan de respuesta a incidentes documentado para ${control}. Sin un proceso claro, el tiempo de respuesta ante ataques aumenta considerablemente.`;
    if (score < 70) return `Realizar simulacros de respuesta a incidentes y actualizar los playbooks de ${control}.`;
    return `Integrar respuesta a incidentes con inteligencia de amenazas en ${control}.`;
  }
  if (lc.includes("backup") || lc.includes("recuper") || lc.includes("continuidad")) {
    if (score < 40) return `Establecer respaldos regulares y probados para ${control}. Sin backups verificados, un ransomware puede ser devastador.`;
    if (score < 70) return `Probar periódicamente la restauración de backups y documentar los RTO/RPO en ${control}.`;
    return `Implementar backups inmutables y automatizados con pruebas regulares en ${control}.`;
  }
  if (lc.includes("concientización") || lc.includes("capacitación") || lc.includes("capacitacion") || lc.includes("usuario")) {
    if (score < 40) return `Iniciar programa de concientización en ciberseguridad para ${control}. El factor humano es responsable del 85% de los incidentes.`;
    if (score < 70) return `Reforzar entrenamiento anti-phishing y simulaciones de ingeniería social en ${control}.`;
    return `Mantener programa continuo de cultura de seguridad en ${control}.`;
  }

  // Generic fallback
  if (score < 40) return `Priorizar la implementación de controles básicos en ${control}. El nivel actual representa un riesgo significativo para la organización.`;
  if (score < 70) return `Fortalecer los controles existentes en ${control} y establecer métricas de seguimiento.`;
  return `Mantener y optimizar los controles en ${control} con revisiones periódicas.`;
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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listReports(): Promise<ReportListItem[]> {
  const [evaluations, orgs, users] = await Promise.all([listEvaluations(), fetchOrgs(), fetchUsers()]);
  const orgById = new Map(orgs.map((o) => [o.id_empresa ?? o.id ?? 0, o.nombre ?? o.name ?? ""]));
  const userById = new Map(users.map((u) => [u.id_usuario, u.nombre]));

  return evaluations.map((e) => {
    const orgId = e.organization_id ?? e.id_empresa;
    const orgName = orgById.get(orgId) ?? `Organización #${orgId}`;
    const evalUserId = e.id_evaluador ?? e.evaluator_id;
    return {
      id: String(e.id_evaluacion),
      title: `Reporte de Evaluación — ${orgName}`,
      date: e.fecha ? String(e.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
      estado: e.estado ?? "pendiente",
      orgName,
      evaluatorId: evalUserId,
      evaluatorName: evalUserId ? userById.get(evalUserId) : undefined,
    };
  });
}

export async function getReportByEvaluationId(id: string): Promise<ReportDetail> {
  const evalId = Number(id);

  // 1. Load evaluation, linked controls, users, orgs in parallel
  const [evaluation, controls, users, orgs] = await Promise.all([
    getEvaluationById(evalId),
    listEvaluationControls(evalId),
    fetchUsers(),
    fetchOrgs(),
  ]);

  // 2. Maps for lookup
  const userById = new Map(users.map((u) => [u.id_usuario, u.nombre]));
  const orgById  = new Map(orgs.map((o) => [o.id_empresa ?? o.id ?? 0, o.nombre ?? o.name ?? ""]));

  const orgId   = evaluation.organization_id ?? evaluation.id_empresa;
  const orgName = orgById.get(orgId) ?? `Organización #${orgId}`;

  // Correct: use id_evaluador for the person who performed the evaluation
  const evalUserId     = evaluation.id_evaluador ?? evaluation.evaluator_id;
  const evaluatorName  = evalUserId ? (userById.get(evalUserId) ?? "No asignado") : "No asignado";

  // Correct: use fecha (date of evaluation), not created_at
  const evaluationDate = evaluation.fecha
    ? String(evaluation.fecha).slice(0, 10)
    : (evaluation.created_at ? String(evaluation.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10));

  const answers = evaluation.answers ?? {};

  // 3. For each linked control, load its questions and compute score
  const categories: ReportCategory[] = await Promise.all(
    controls.map(async (control) => {
      const questions = await dataService.getQuestionsByControl(String(control.id_control));
      let totalScore = 0;
      let answered = 0;
      for (const q of questions) {
        const answer = answers[q.id];
        const rawValor = answer?.valor;
        const score = scoreFromValor(rawValor);
        if (score !== null) {
          totalScore += score;
          answered++;
        }
      }
      const avgScore = questions.length > 0
        ? (answered > 0 ? Math.round(totalScore / questions.length) : 0)
        : 0;

      return {
        id: `ctrl-${control.id_control}`,
        name: control.nombre,
        value: avgScore,
        answered,
        total: questions.length,
        dimensions: {
          confidencialidad: control.confidencialidad ?? false,
          integridad: control.integridad ?? false,
          disponibilidad: control.disponibilidad ?? false,
        },
      };
    })
  );

  // 4. Global score = weighted average across all questions
  const totalQs     = categories.reduce((s, c) => s + c.total, 0);
  const answeredQs  = categories.reduce((s, c) => s + c.answered, 0);
  const globalScore = categories.length > 0
    ? Math.round(categories.reduce((s, c) => s + c.value * c.total, 0) / Math.max(1, totalQs))
    : 0;

  // 5. Recommendations: sorted by weakest score, only include controls with at least 1 question
  const recommendations: ReportRecommendation[] = categories
    .filter((c) => c.total > 0)
    .sort((a, b) => a.value - b.value)
    .map((c) => ({
      priority: priorityFromScore(c.value),
      control: c.name,
      text: recommendationText(c.name, c.value),
    }));

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