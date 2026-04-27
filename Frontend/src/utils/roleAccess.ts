import type { AppRole } from './auth';

type NavItem = {
  to: string;
  label: string;
};

/** Administrador: catálogo, usuarios, empresas, asignaciones, evaluaciones, riesgos catalogados, informes. */
const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organizations', label: 'Organizaciones' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/reports', label: 'Reportes' },
  { to: '/vulnerabilities', label: 'Vulnerabilidades' },
  { to: '/users', label: 'Usuarios' },
];

/** Evaluador: operar evaluaciones y empresas; ver cuestionarios; sin gestión de usuarios ni catálogo crítico. */
const EVALUATOR_NAV: NavItem[] = [
  { to: '/HomePage', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organizations', label: 'Organizaciones' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/reports', label: 'Reportes' },
];

/** Usuario de empresa: solo evaluaciones donde participa e informes asociados. */
const USER_NAV: NavItem[] = [
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/reports', label: 'Reportes' },
];

export function isStaffRole(role: AppRole | null): boolean {
  return role === 'admin' || role === 'evaluator';
}

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
    if (path === '/HomePage' || path === '/RecoverPage') return true;
    if (path === '/dashboard') return true;
    if (path === '/questionnaires') return true;
    if (path === '/evaluations' || /^\/evaluations\/\d+\/workflow$/.test(path)) return true;
    if (path === '/reports' || /^\/reports\/[^/]+$/.test(path) || /^\/reports\/[^/]+\/report$/.test(path)) return true;
    if (path === '/asignaciones') return true;
    if (path === '/organizations' || path === '/organizations/new' || /^\/organizations\/\d+$/.test(path)) return true;
    return false;
  }

  if (role === 'user') {
    if (path === '/RecoverPage') return true;
    if (path === '/evaluations' || /^\/evaluations\/\d+\/workflow$/.test(path)) return true;
    if (path === '/reports' || /^\/reports\/[^/]+$/.test(path) || /^\/reports\/[^/]+\/report$/.test(path)) return true;
    return false;
  }

  return false;
}