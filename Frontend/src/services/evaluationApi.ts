import { apiFetch } from "./apiClient";

export type EvaluationApiRow = {
  id_evaluacion: number;
  id_empresa: number;
  id_usuario: number;
  fecha: string;
  estado: string;
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
    throw new Error("No se pudo cargar la evaluación");
  }
  return (await response.json()) as EvaluationApiRow;
}

export async function createEvaluation(payload: {
  id_empresa: number;
  id_usuario?: number;
  fecha?: string;
  estado?: string;
}): Promise<EvaluationApiRow> {
  const response = await apiFetch("/evaluations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("No se pudo crear la evaluación");
  }
  return (await response.json()) as EvaluationApiRow;
}