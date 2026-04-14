const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

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