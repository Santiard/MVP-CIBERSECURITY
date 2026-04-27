// --- Question (Pregunta) Types ---
export type Question = {
  id: string;
  controlId: string;
  text: string;
  dimension: string;
  order: number;
  peso?: number;
  active: boolean;
};

import { apiFetch, publicApiFetch } from './apiClient';

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
  id_empresa: number;
  nombre: string;
  sector: string;
  tamano: string;
  email?: string;
  nit?: string;
  phone?: string;
};

type Questionnaire = {
  id: string;
  name: string;
  description: string;
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

type QuestionApi = {
  id_pregunta: number;
  id_control: number;
  texto: string;
  dimension?: string;
  orden?: number;
  peso?: number;
  activo?: boolean;
};

function normalizeDigits(value?: string | null): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    const { detail } = body;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? String((item as { msg: string }).msg) : ''))
        .filter(Boolean);
      if (msgs.length) return msgs.join(' ');
    }
  } catch {
    // ignore
  }
  return text || res.statusText || `HTTP ${res.status}`;
}

async function readJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function writeJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function remove(path: string): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
}

const roleIdByName = new Map<string, number>();

async function ensureRole(roleName: User['role']): Promise<number> {
  const hit = roleIdByName.get(roleName);
  if (hit !== undefined) return hit;
  const roles = await readJson<RoleApi[]>('/roles');
  const found = roles.find((r) => r.nombre === roleName);
  if (!found?.id_rol) {
    throw new Error(`Rol no encontrado en el servidor: ${roleName}`);
  }
  roleIdByName.set(roleName, found.id_rol);
  return found.id_rol;
}

type RegisterAccountPayload = { name: string; email: string; password: string; phone?: string };

const dataService = {
  /** Registro público: `POST /auth/register` (sin token). Tras éxito puedes guardar `access_token` en localStorage. */
  registerAccount: async (payload: RegisterAccountPayload) => {
    const res = await publicApiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        phone: payload.phone?.trim() || null,
      }),
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (!res.ok) {
      const detail = data.detail;
      if (typeof detail === 'string') throw new Error(detail);
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    return data as {
      access_token: string;
      token_type?: string;
      user_id: number;
      name: string;
      role: string;
    };
  },

  // --- Questions (Preguntas) ---
  getQuestionsByControl: async (controlId: string): Promise<Question[]> => {
    const rows = await readJson<QuestionApi[]>(`/questions/by-control/${encodeURIComponent(controlId)}`);
    return rows.map((q) => ({
      id: String(q.id_pregunta),
      controlId: String(q.id_control),
      text: q.texto,
      dimension: q.dimension ?? '',
      order: q.orden ?? 0,
      peso: q.peso,
      active: q.activo ?? true,
    }));
  },

  createQuestion: async (q: Omit<Question, 'id'>): Promise<Question> => {
    const created = await writeJson<QuestionApi>('/questions', 'POST', {
      id_control: Number(q.controlId),
      texto: q.text,
      peso: q.peso ?? 1,
    });
    return {
      id: String(created.id_pregunta),
      controlId: String(created.id_control),
      text: created.texto,
      dimension: created.dimension ?? '',
      order: created.orden ?? 0,
      active: created.activo ?? true,
    };
  },

  updateQuestion: async (id: string, patch: Partial<Question>): Promise<Question | undefined> => {
    const payload: Record<string, unknown> = {};
    if (patch.text !== undefined) payload.texto = patch.text;
    if (patch.peso !== undefined) payload.peso = patch.peso;
    if (patch.dimension !== undefined) payload.dimension = patch.dimension;
    if (patch.order !== undefined) payload.orden = patch.order;
    if (patch.active !== undefined) payload.activo = patch.active;
    await writeJson(`/questions/${id}`, 'PATCH', payload);
    // Refetch the updated question
    const controlId = patch.controlId;
    if (controlId) {
      const questions = await dataService.getQuestionsByControl(controlId);
      return questions.find((q) => q.id === id);
    }
    return undefined;
  },

  deleteQuestion: async (id: string) => {
    return remove(`/questions/${id}`);
  },
  // Users
  getUsers: async (): Promise<User[]> => {
    const [users, roles] = await Promise.all([
      readJson<UserApi[]>('/users'),
      readJson<RoleApi[]>('/roles'),
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
    const created = await writeJson<UserApi>('/users', 'POST', {
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

    await writeJson(`/users/${id}`, 'PATCH', payload);
    const users = await dataService.getUsers();
    return users.find((u: User) => u.id === id);
  },
  toggleUserActive: async (id: string) => {
    const current = await readJson<UserApi>(`/users/${id}`);
    const next = !(current.activo ?? true);
    await writeJson(`/users/${id}`, 'PATCH', { activo: next });
    const users = await dataService.getUsers();
    return users.find((u: User) => u.id === id);
  },
  deleteUser: async (id: string) => {
    return remove(`/users/${id}`);
  },
  resetPassword: async (id: string, newPassword: string) => {
    await writeJson(`/users/${id}`, 'PATCH', { password: newPassword });
    return true;
  },

  // Orgs
  getOrgs: async (): Promise<Org[]> => {
    const rows = await readJson<Org[]>('/organizations');
    return rows;
  },
  createOrg: async (o: Omit<Org, 'id_empresa'> & { user_ids?: number[] }) => {
    const body: Record<string, unknown> = {
      name: o.nombre,
      sector: o.sector,
      size: o.tamano,
    };
    if (o.user_ids !== undefined && o.user_ids.length > 0) {
      body.user_ids = o.user_ids;
    }
    const created = await writeJson<Org>('/organizations', 'POST', body);
    return created;
  },
  listOrganizationUsers: async (id_empresa: number) => {
    return readJson<Array<{ id_usuario: number; nombre: string; correo: string; activo?: boolean }>>(
      `/organizations/${id_empresa}/users`,
    );
  },
  /** Usuarios rol «user» elegibles para membresía: sin otra empresa (crear) o sin conflicto con esta empresa (editar). */
  getEligibleOrganizationMembers: async (forEmpresaId?: number): Promise<User[]> => {
    const q =
      forEmpresaId != null
        ? `?for_empresa=${encodeURIComponent(String(forEmpresaId))}`
        : '';
    const rows = await readJson<Array<{ id_usuario: number; nombre: string; correo: string; activo?: boolean }>>(
      `/organizations/eligible-members${q}`,
    );
    return rows.map((u) => ({
      id: String(u.id_usuario),
      name: u.nombre,
      email: u.correo,
      role: 'user',
      active: u.activo ?? true,
    }));
  },
  updateOrg: async (id_empresa: number, patch: Partial<Org> & { user_ids?: number[] }) => {
    const body: Record<string, unknown> = {};
    if (patch.nombre !== undefined) body.name = patch.nombre;
    if (patch.sector !== undefined) body.sector = patch.sector;
    if (patch.tamano !== undefined) body.size = patch.tamano;
    if (patch.user_ids !== undefined) body.user_ids = patch.user_ids;
    await writeJson(`/organizations/${id_empresa}`, 'PATCH', body);
    const orgs = await dataService.getOrgs();
    return orgs.find((o: Org) => o.id_empresa === id_empresa);
  },
  deleteOrg: async (id_empresa: number) => {
    return remove(`/organizations/${id_empresa}`);
  },

  // Questionnaires
  getQuestionnaires: async (): Promise<Questionnaire[]> => {
    const rows = await readJson<QuestionnaireApi[]>('/questionnaires');
    return rows.map((q) => ({
      id: String(q.id_control),
      name: q.nombre,
      description: q.descripcion,
      dimensions: q.dimensiones ?? 0,
      active: q.activo ?? true,
    }));
  },
  createQuestionnaire: async (q: Omit<Questionnaire, 'id'>) => {
    const created = await writeJson<QuestionnaireApi>('/questionnaires', 'POST', {
      nombre: q.name,
      descripcion: q.description,
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
    if (patch.name !== undefined) payload.nombre = patch.name;
    if (patch.description !== undefined) payload.descripcion = patch.description;
    if (patch.dimensions !== undefined) payload.dimensiones = patch.dimensions;
    if (patch.active !== undefined) payload.activo = patch.active;

    await writeJson(`/questionnaires/${id}`, 'PATCH', payload);
    const rows = await dataService.getQuestionnaires();
    return rows.find((q: Questionnaire) => q.id === id);
  },
  toggleQuestionnaireActive: async (id: string) => {
    const current = await readJson<QuestionnaireApi>(`/questionnaires/${id}`);
    const next = !(current.activo ?? true);
    await writeJson(`/questionnaires/${id}`, 'PATCH', { activo: next });
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
