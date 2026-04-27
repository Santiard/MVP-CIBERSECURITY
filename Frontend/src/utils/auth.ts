export type AppRole = 'admin' | 'evaluator' | 'user';

export type AuthUser = {
  id: number;
  name: string;
  role: string;
  email: string;
};

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const value = role.trim().toLowerCase();
  if (value === 'admin' || value === 'evaluator' || value === 'user') {
    return value;
  }
  return null;
}

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_err) {
    return null;
  }
}

export function getCurrentRole(): AppRole | null {
  const user = getStoredAuthUser();
  return normalizeRole(user?.role);
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('authToken');
  return !!token;
}

export function defaultPathByRole(role: AppRole): string {
  if (role === 'user') return '/evaluations';
  return '/dashboard';
}