import { apiFetch } from './apiClient';

export type BankQuestion = {
  id: string;           // id_pregunta como string
  text: string;         // texto
  dimension: string;    // dimensión temática
  peso: number;
  linkedControls: number[];  // IDs de formularios donde está vinculada
};

async function readJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function writeJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const raw = await res.text();
  if (!raw) return undefined as T;
  return JSON.parse(raw) as T;
}

type RawQuestion = {
  id_pregunta: number;
  texto: string;
  dimension: string | null;
  peso: number;
  controles: number[];
};

function normalize(raw: RawQuestion): BankQuestion {
  return {
    id: String(raw.id_pregunta),
    text: raw.texto,
    dimension: raw.dimension ?? '',
    peso: raw.peso,
    linkedControls: raw.controles ?? [],
  };
}

const questionBankApi = {
  /** Lista todas las preguntas del banco */
  list: async (): Promise<BankQuestion[]> => {
    const rows = await readJson<RawQuestion[]>('/question-bank');
    return rows.map(normalize);
  },

  /** Detalle de una pregunta */
  get: async (id: string): Promise<BankQuestion> => {
    const raw = await readJson<RawQuestion>(`/question-bank/${id}`);
    return normalize(raw);
  },

  /** Crea una nueva pregunta en el banco */
  create: async (payload: { text: string; dimension?: string; peso?: number }): Promise<BankQuestion> => {
    const raw = await writeJson<RawQuestion>('/question-bank', 'POST', {
      texto: payload.text,
      dimension: payload.dimension ?? null,
      peso: payload.peso ?? 1.0,
    });
    return normalize(raw);
  },

  /** Edita una pregunta del banco (el cambio se refleja en todos los formularios que la usan) */
  update: async (id: string, payload: { text?: string; dimension?: string; peso?: number }): Promise<BankQuestion> => {
    const raw = await writeJson<RawQuestion>(`/question-bank/${id}`, 'PATCH', {
      ...(payload.text !== undefined && { texto: payload.text }),
      ...(payload.dimension !== undefined && { dimension: payload.dimension }),
      ...(payload.peso !== undefined && { peso: payload.peso }),
    });
    return normalize(raw);
  },

  /** Elimina una pregunta del banco y la desvincula de todos los formularios */
  delete: async (id: string): Promise<void> => {
    await writeJson<unknown>(`/question-bank/${id}`, 'DELETE');
  },

  /** Vincula una pregunta a un formulario */
  linkToControl: async (id: string, controlId: number): Promise<BankQuestion> => {
    const raw = await writeJson<RawQuestion>(`/question-bank/${id}/link/${controlId}`, 'POST');
    return normalize(raw);
  },

  /** Desvincula una pregunta de un formulario (la pregunta permanece en el banco) */
  unlinkFromControl: async (id: string, controlId: number): Promise<BankQuestion> => {
    const raw = await writeJson<RawQuestion>(`/question-bank/${id}/link/${controlId}`, 'DELETE');
    return normalize(raw);
  },

  /** Lista preguntas vinculadas a un formulario específico */
  listByControl: async (controlId: number): Promise<BankQuestion[]> => {
    const rows = await readJson<RawQuestion[]>(`/question-bank/by-control/${controlId}`);
    return rows.map(normalize);
  },
};

export default questionBankApi;
