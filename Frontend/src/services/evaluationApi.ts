import { apiFetch } from "./apiClient";

export type EvaluationApiRow = {
  id: number;
  organization_id: number;
  answers?: Record<string, unknown>;
};

export async function listEvaluations(): Promise<EvaluationApiRow[]> {
  const response = await apiFetch("/evaluations", { method: "GET" });
  if (!response.ok) {
    throw new Error("No se pudo cargar evaluaciones");
  }
  return (await response.json()) as EvaluationApiRow[];
}

export async function getEvaluationById(id: string | number): Promise<EvaluationApiRow> {
  const response = await apiFetch(`/evaluations/${id}`, { method: "GET" });
  if (!response.ok) {
    throw new Error("No se pudo cargar la evaluacion");
  }
  return (await response.json()) as EvaluationApiRow;
}

export async function createEvaluation(payload: {
  organization_id: number;
  answers?: Record<string, unknown>;
}): Promise<EvaluationApiRow> {
  const response = await apiFetch("/evaluations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("No se pudo crear la evaluacion");
  }
  return (await response.json()) as EvaluationApiRow;
}