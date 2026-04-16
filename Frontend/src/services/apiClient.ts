export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim()) ||
  "http://localhost:8000";

/** Rutas públicas (login, registro, recuperación): sin Bearer. */
export async function publicApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.body !== undefined && init?.body !== null) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
}

async function getToken(): Promise<string> {
  const existing = localStorage.getItem("authToken");
  if (!existing) {
    throw new Error("No autenticado");
  }
  return existing;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  return response;
}