import { apiFetch } from "./apiClient";
import { getEvaluationById, listEvaluations } from "./evaluationApi";

type Org = {
  id: number;
  name: string;
};

type User = {
  id_usuario: number;
  nombre: string;
};

export type ReportListItem = {
  id: string;
  title: string;
  date: string;
};

export type ReportCategory = {
  id: string;
  name: string;
  value: number;
};

export type ReportDetail = {
  id: string;
  score: number;
  level: string;
  date: string;
  evaluator: string;
  categories: ReportCategory[];
  recommendations: string[];
};

function scoreFromAnswer(value: unknown): number {
  if (typeof value === "number") {
    if (value <= 5) return Math.max(0, Math.min(100, value * 20));
    return Math.max(0, Math.min(100, value));
  }
  if (typeof value === "boolean") return value ? 100 : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return scoreFromAnswer(parsed);
  }
  return 0;
}

function normalizeCategory(rawKey: string): string {
  const token = rawKey.split(/[:._-]/)[0] || "general";
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function levelFromScore(score: number): string {
  if (score >= 85) return "Nivel Avanzado";
  if (score >= 70) return "Nivel Intermedio";
  if (score >= 50) return "Nivel Básico";
  return "Nivel Inicial";
}

async function fetchOrganizations(): Promise<Org[]> {
  const response = await apiFetch("/organizations", { method: "GET" });
  if (!response.ok) return [];
  return (await response.json()) as Org[];
}

async function fetchUsers(): Promise<User[]> {
  const response = await apiFetch("/users", { method: "GET" });
  if (!response.ok) return [];
  return (await response.json()) as User[];
}

export async function listReports(): Promise<ReportListItem[]> {
  const [evaluations, organizations] = await Promise.all([
    listEvaluations(),
    fetchOrganizations(),
  ]);
  const orgById = new Map(organizations.map((o) => [o.id, o.name]));

  return evaluations.map((e) => ({
    id: String(e.id),
    title: `Reporte ${orgById.get(e.organization_id) || `Organizacion #${e.organization_id}`}`,
    date: e.created_at ? new Date(e.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
  }));
}

export async function getReportByEvaluationId(id: string): Promise<ReportDetail> {
  const [evaluation, users] = await Promise.all([
    getEvaluationById(id),
    fetchUsers(),
  ]);
  
  const userById = new Map(users.map((u) => [u.id_usuario, u.nombre]));
  const evaluatorName = evaluation.user_id ? userById.get(evaluation.user_id) || "Sistema" : "Sistema";
  const evaluationDate = evaluation.created_at 
    ? new Date(evaluation.created_at).toLocaleDateString() 
    : new Date().toLocaleDateString();
  
  const answers = evaluation.answers || {};
  const entries = Object.entries(answers);

  const byCategory = new Map<string, number[]>();
  for (const [key, value] of entries) {
    const category = normalizeCategory(key);
    const score = scoreFromAnswer(value);
    const current = byCategory.get(category) || [];
    current.push(score);
    byCategory.set(category, current);
  }

  const categories: ReportCategory[] = Array.from(byCategory.entries()).map(([name, scores], idx) => {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      id: `cat-${idx + 1}`,
      name,
      value: Math.round(avg),
    };
  });

  const score = categories.length
    ? Math.round(categories.reduce((a, b) => a + b.value, 0) / categories.length)
    : 0;

  const weakest = [...categories].sort((a, b) => a.value - b.value).slice(0, 3);
  const recommendations = weakest.map(
    (c) => `Priorizar mejoras en ${c.name}: controles, seguimiento y capacitación.`
  );

  return {
    id,
    score,
    level: levelFromScore(score),
    date: evaluationDate,
    evaluator: evaluatorName,
    categories,
    recommendations,
  };
}