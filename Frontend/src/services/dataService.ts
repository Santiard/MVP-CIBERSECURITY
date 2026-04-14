import { apiFetch } from './apiClient';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'evaluator' | 'user';
  active?: boolean;
  password?: string;
};

type Org = {
  id: string;
  name: string;
  email?: string;
  nit?: string;
  address?: string;
  phone?: string;
};

type Questionnaire = {
  id: string;
  name: string;
  dimensions: number;
  active: boolean;
};

type RoleApi = { id_rol: number; nombre: string };
type UserApi = {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string;
  activo?: boolean;
  id_rol: number;
  password?: string;
};
type QuestionnaireApi = {
  id_control: number;
  nombre: string;
  descripcion: string;
  dimensiones?: number;
  activo?: boolean;
};

async function readJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`GET ${path} failed`);
  }
  return (await response.json()) as T;
}

async function writeJson<T>(path: string, method: 'POST' | 'PATCH', payload: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} failed`);
  }
  return (await response.json()) as T;
}

async function remove(path: string): Promise<boolean> {
  const response = await apiFetch(path, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`DELETE ${path} failed`);
  }
  return true;
}

async function ensureRole(roleName: User['role']): Promise<number> {
  const roles = await readJson<RoleApi[]>('/entities/roles');
  const existing = roles.find((r) => r.nombre === roleName);
  if (existing) return existing.id_rol;

  const created = await writeJson<RoleApi>('/entities/roles', 'POST', { nombre: roleName });
  return created.id_rol;
}

const normalizeDigits = (value?: string) => value ? value.replace(/\D/g, '') : '';

const dataService = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const [users, roles] = await Promise.all([
      readJson<UserApi[]>('/entities/usuarios'),
      readJson<RoleApi[]>('/entities/roles'),
    ]);
    const roleById = new Map(roles.map((r) => [r.id_rol, r.nombre as User['role']]));

    return users.map((u) => ({
      id: String(u.id_usuario),
      name: u.nombre,
      email: u.correo,
      phone: u.telefono,
      role: roleById.get(u.id_rol) || 'user',
      active: u.activo ?? true,
    }));
  },
  createUser: async (u: Omit<User, 'id'>) => {
    const roleId = await ensureRole(u.role);
    const created = await writeJson<UserApi>('/entities/usuarios', 'POST', {
      nombre: u.name,
      correo: u.email,
      telefono: u.phone || null,
      activo: u.active ?? true,
      password: u.password,
      id_rol: roleId,
    });
    return {
      id: String(created.id_usuario),
      ...u,
    };
  },
  updateUser: async (id: string, patch: Partial<User>) => {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.nombre = patch.name;
    if (patch.email !== undefined) payload.correo = patch.email;
    if (patch.phone !== undefined) payload.telefono = patch.phone;
    if (patch.active !== undefined) payload.activo = patch.active;
    if (patch.role !== undefined) payload.id_rol = await ensureRole(patch.role);
    if (patch.password !== undefined) payload.password = patch.password;

    await writeJson(`/entities/usuarios/${id}`, 'PATCH', payload);
    const users = await dataService.getUsers();
    return users.find((u: User) => u.id === id);
  },
  toggleUserActive: async (id: string) => {
    const current = await readJson<UserApi>(`/entities/usuarios/${id}`);
    const next = !(current.activo ?? true);
    await writeJson(`/entities/usuarios/${id}`, 'PATCH', { activo: next });
    const users = await dataService.getUsers();
    return users.find((u: User) => u.id === id);
  },
  deleteUser: async (id: string) => {
    return remove(`/entities/usuarios/${id}`);
  },
  resetPassword: async (id: string, newPassword: string) => {
    await writeJson(`/entities/usuarios/${id}`, 'PATCH', { password: newPassword });
    return true;
  },

  // Orgs
  getOrgs: async (): Promise<Org[]> => {
    const rows = await readJson<any[]>('/organizations');
    return rows.map((o) => ({
      id: String(o.id),
      name: o.name,
      email: o.email,
      nit: o.nit,
      address: o.address,
      phone: o.phone,
    }));
  },
  createOrg: async (o: Omit<Org, 'id'>) => {
    const created = await writeJson<any>('/organizations', 'POST', {
      name: o.name,
      email: o.email || null,
      nit: o.nit || null,
      address: o.address || null,
      phone: o.phone || null,
    });
    return {
      id: String(created.id),
      ...o,
    };
  },
  updateOrg: async (id: string, patch: Partial<Org>) => {
    await writeJson(`/organizations/${id}`, 'PATCH', patch);
    const orgs = await dataService.getOrgs();
    return orgs.find((o: Org) => o.id === id);
  },
  deleteOrg: async (id: string) => {
    return remove(`/organizations/${id}`);
  },

  // Questionnaires
  getQuestionnaires: async (): Promise<Questionnaire[]> => {
    const rows = await readJson<QuestionnaireApi[]>('/entities/controles');
    return rows.map((q) => ({
      id: String(q.id_control),
      name: q.nombre,
      dimensions: q.dimensiones ?? 0,
      active: q.activo ?? true,
    }));
  },
  createQuestionnaire: async (q: Omit<Questionnaire, 'id'>) => {
    const created = await writeJson<QuestionnaireApi>('/entities/controles', 'POST', {
      nombre: q.name,
      descripcion: q.name,
      dimensiones: q.dimensions,
      activo: q.active,
      confidencialidad: false,
      integridad: false,
      disponibilidad: false,
    });
    return {
      id: String(created.id_control),
      ...q,
    };
  },
  updateQuestionnaire: async (id: string, patch: Partial<Questionnaire>) => {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      payload.nombre = patch.name;
      payload.descripcion = patch.name;
    }
    if (patch.dimensions !== undefined) payload.dimensiones = patch.dimensions;
    if (patch.active !== undefined) payload.activo = patch.active;

    await writeJson(`/entities/controles/${id}`, 'PATCH', payload);
    const rows = await dataService.getQuestionnaires();
    return rows.find((q: Questionnaire) => q.id === id);
  },
  toggleQuestionnaireActive: async (id: string) => {
    const current = await readJson<QuestionnaireApi>(`/entities/controles/${id}`);
    const next = !(current.activo ?? true);
    await writeJson(`/entities/controles/${id}`, 'PATCH', { activo: next });
    const rows = await dataService.getQuestionnaires();
    return rows.find((q: Questionnaire) => q.id === id);
  },

  // Validation methods
  checkUserEmailExists: async (email: string, excludeId?: string) => {
    const users = await dataService.getUsers();
    return users.some((u: User) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId);
  },
  checkUserPhoneExists: async (phone: string, excludeId?: string) => {
    const normalized = normalizeDigits(phone);
    if (!normalized) return false;
    const users = await dataService.getUsers();
    return users.some((u: User) => normalizeDigits(u.phone) === normalized && u.id !== excludeId);
  },
  checkOrgEmailExists: async (email: string, excludeId?: string) => {
    if (!email) return false;
    const orgs = await dataService.getOrgs();
    return orgs.some((o: Org) => o.email?.toLowerCase() === email.toLowerCase() && o.id !== excludeId);
  },
  checkOrgNitExists: async (nit: string, excludeId?: string) => {
    const normalized = normalizeDigits(nit);
    if (!normalized) return false;
    const orgs = await dataService.getOrgs();
    return orgs.some((o: Org) => normalizeDigits(o.nit) === normalized && o.id !== excludeId);
  },
  checkOrgPhoneExists: async (phone: string, excludeId?: string) => {
    const normalized = normalizeDigits(phone);
    if (!normalized) return false;
    const orgs = await dataService.getOrgs();
    return orgs.some((o: Org) => normalizeDigits(o.phone) === normalized && o.id !== excludeId);
  }
};

export default dataService;
