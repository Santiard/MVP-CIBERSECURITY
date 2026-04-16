import { apiFetch } from "./apiClient";

export type AnswerValue = { valor?: number; comentario?: string };

export type EvaluationApiRow = {
  id_evaluacion: number;
  id_empresa: number;
  id_usuario: number;
  fecha: string;
  estado: string;
  /** Alias útil para vistas que lean la API en inglés */
  organization_id?: number;
  user_id?: number;
  id?: number;
  created_at?: string | null;
};

export type EvaluationDetail = EvaluationApiRow & {
  answers: Record<string, AnswerValue>;
};

export type ControlLinkedRow = {
  id_control: number;
  nombre: string;
  descripcion: string;
  dimensiones: number;
  activo: boolean;
  confidencialidad: boolean;
  integridad: boolean;
  disponibilidad: boolean;
};

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    const { detail } = body;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item ? String((item as { msg: string }).msg) : "",
        )
        .filter(Boolean);
      if (msgs.length) return msgs.join(" ");
    }
  } catch {
    // ignore
  }
  return text || res.statusText || `HTTP ${res.status}`;
}

function normalizeEvaluation(raw: Record<string, unknown>): EvaluationApiRow {
  const id_evaluacion = Number(raw.id_evaluacion ?? raw.id ?? 0);
  const id_empresa = Number(raw.id_empresa ?? raw.organization_id ?? 0);
  const id_usuario = Number(raw.id_usuario ?? raw.user_id ?? 0);
  let fecha = "";
  if (raw.fecha != null && raw.fecha !== "") {
    fecha = String(raw.fecha).slice(0, 10);
  }
  const estado = String(raw.estado ?? "");
  const created_at =
    raw.created_at != null
      ? String(raw.created_at)
      : raw.creado_en != null
        ? String(raw.creado_en)
        : null;
  return {
    id_evaluacion,
    id_empresa,
    id_usuario,
    fecha,
    estado,
    organization_id: id_empresa,
    user_id: id_usuario,
    id: id_evaluacion,
    created_at,
  };
}

function parseAnswers(raw: Record<string, unknown>): Record<string, AnswerValue> {
  const a = raw.answers;
  if (!a || typeof a !== "object" || Array.isArray(a)) return {};
  const out: Record<string, AnswerValue> = {};
  for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      const valorRaw = obj.valor;
      const valor =
        typeof valorRaw === "number"
          ? valorRaw
          : typeof valorRaw === "string" && valorRaw.trim() !== ""
            ? Number(valorRaw)
            : undefined;
      const comentario = obj.comentario != null ? String(obj.comentario) : undefined;
      out[k] = {
        valor: valor !== undefined && !Number.isNaN(valor) ? valor : undefined,
        comentario,
      };
    }
  }
  return out;
}

export function normalizeEvaluationDetail(raw: Record<string, unknown>): EvaluationDetail {
  return {
    ...normalizeEvaluation(raw),
    answers: parseAnswers(raw),
  };
}

export async function listEvaluations(params?: { id_empresa?: number }): Promise<EvaluationApiRow[]> {
  const q =
    params?.id_empresa != null ? `?id_empresa=${encodeURIComponent(String(params.id_empresa))}` : "";
  const response = await apiFetch(`/evaluations${q}`, { method: "GET" });
  if (!response.ok) {
    throw new Error("No se pudo cargar evaluaciones");
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeEvaluation(item as Record<string, unknown>));
}

export async function getEvaluationById(id: string | number): Promise<EvaluationDetail> {
  const response = await apiFetch(`/evaluations/${id}`, { method: "GET" });
  if (!response.ok) {
    throw new Error("No se pudo cargar la evaluación");
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return normalizeEvaluationDetail(raw);
}

export async function createEvaluation(payload: {
  id_empresa: number;
  id_usuario?: number;
  fecha?: string;
  estado?: string;
}): Promise<EvaluationDetail> {
  const response = await apiFetch("/evaluations", {
    method: "POST",
    body: JSON.stringify({
      id_empresa: payload.id_empresa,
      id_usuario: payload.id_usuario,
      fecha: payload.fecha,
      estado: payload.estado,
    }),
  });
  if (!response.ok) {
    throw new Error("No se pudo crear la evaluación");
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return normalizeEvaluationDetail(raw);
}

export async function patchEvaluation(
  id: string | number,
  patch: { id_empresa?: number; estado?: string; fecha?: string; answers?: Record<string, AnswerValue> },
): Promise<EvaluationDetail> {
  const body: Record<string, unknown> = {};
  if (patch.id_empresa != null) body.id_empresa = patch.id_empresa;
  if (patch.estado != null) body.estado = patch.estado;
  if (patch.fecha != null) body.fecha = patch.fecha;
  if (patch.answers != null) body.answers = patch.answers;
  const response = await apiFetch(`/evaluations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("No se pudo actualizar la evaluación");
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return normalizeEvaluationDetail(raw);
}

export async function deleteEvaluation(id: string | number): Promise<void> {
  const response = await apiFetch(`/evaluations/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("No se pudo eliminar la evaluación");
  }
}

export async function listEvaluationControls(evaluationId: number): Promise<ControlLinkedRow[]> {
  const response = await apiFetch(`/evaluations/${evaluationId}/controles`, { method: "GET" });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as ControlLinkedRow[];
}

export async function linkEvaluationControlsBulk(evaluationId: number, control_ids: number[]): Promise<void> {
  const response = await apiFetch(`/evaluations/${evaluationId}/controles`, {
    method: "POST",
    body: JSON.stringify({ control_ids }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function detachEvaluationControl(evaluationId: number, controlId: number): Promise<void> {
  const response = await apiFetch(`/evaluations/${evaluationId}/controles/${controlId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
