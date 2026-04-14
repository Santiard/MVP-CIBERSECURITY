import type { AppRole } from './auth';

type NavItem = {
  to: string;
  label: string;
};

const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organizations', label: 'Organizaciones' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/reports', label: 'Reportes' },
  { to: '/vulnerabilities', label: 'Vulnerabilidades' },
  { to: '/users', label: 'Usuarios' },
];

const EVALUATOR_NAV: NavItem[] = [
  { to: '/HomePage', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/reports', label: 'Reportes' },
];

const USER_NAV: NavItem[] = [
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/reports', label: 'Reportes' },
];

export function getNavItemsByRole(role: AppRole | null): NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'evaluator') return EVALUATOR_NAV;
  if (role === 'user') return USER_NAV;
  return [];
}

export function canAccessPath(role: AppRole, path: string): boolean {
  if (role === 'admin') {
    return true;
  }

  if (role === 'evaluator') {
    if (path === '/HomePage') return true;
    if (path === '/RecoverPage') return true;
    if (path === '/dashboard') return true;
    if (path === '/questionnaires') return true;
    if (path === '/evaluations') return true;
    if (path === '/reports') return true;
    return false;
  }

  if (role === 'user') {
    if (path === '/questionnaires') return true;
    if (path === '/evaluations') return true;
    if (path === '/reports') return true;
    if (/^\/reports\/[^/]+$/.test(path)) return true;
    if (/^\/reports\/[^/]+\/report$/.test(path)) return true;
    return false;
  }

  return false;
}