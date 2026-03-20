// Simple in-memory mock data service for users and organizations
type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'evaluator' | 'user';
};

type Org = {
  id: string;
  name: string;
  email?: string;
  nit?: string;
  address?: string;
  phone?: string;
};

let users: User[] = [
  { id: 'u1', name: 'Admin Principal', email: 'admin@ray.test', phone: '+57 300000000', role: 'admin' },
  { id: 'u2', name: 'Evaluador 1', email: 'eval1@ray.test', phone: '+57 300000001', role: 'evaluator' },
  { id: 'u3', name: 'Usuario Normal', email: 'user1@ray.test', phone: '+57 300000002', role: 'user' }
];

let orgs: Org[] = [
  { id: 'o1', name: 'Empresa ABC', email: 'contact@empresaabc.test', nit: '900123456-1', address: 'Calle Falsa 123', phone: '+57 310000000' },
  { id: 'o2', name: 'Empresa XYZ', email: 'hola@xyz.test', nit: '900654321-2', address: 'Avenida Siempre Viva 742', phone: '+57 310000001' }
];

const delay = (v: any, ms = 150) => new Promise(resolve => setTimeout(() => resolve(v), ms));

export default {
  // Users
  getUsers: async () => delay([...users]),
  createUser: async (u: Omit<User, 'id'>) => {
    const id = 'u' + (Math.random() * 100000 | 0);
    const nu = { id, ...u } as User;
    users = [nu, ...users];
    return delay(nu);
  },
  updateUser: async (id: string, patch: Partial<User>) => {
    users = users.map(u => u.id === id ? { ...u, ...patch } : u);
    return delay(users.find(u => u.id === id));
  },
  deleteUser: async (id: string) => {
    users = users.filter(u => u.id !== id);
    return delay(true);
  },
  resetPassword: async (id: string, newPassword: string) => {
    // mock: do nothing but resolve
    console.log('resetPassword', id, newPassword);
    return delay(true);
  },

  // Orgs
  getOrgs: async () => delay([...orgs]),
  createOrg: async (o: Omit<Org, 'id'>) => {
    const id = 'o' + (Math.random() * 100000 | 0);
    const no = { id, ...o } as Org;
    orgs = [no, ...orgs];
    return delay(no);
  },
  updateOrg: async (id: string, patch: Partial<Org>) => {
    orgs = orgs.map(o => o.id === id ? { ...o, ...patch } : o);
    return delay(orgs.find(o => o.id === id));
  },
  deleteOrg: async (id: string) => {
    orgs = orgs.filter(o => o.id !== id);
    return delay(true);
  }
};
