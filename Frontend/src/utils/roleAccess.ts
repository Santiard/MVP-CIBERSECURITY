import type { AppRole } from './auth';

type NavItem = {
  to: string;
  label: string;
};

/**
 * Orden de navegación alineado al flujo operativo:
 * Dashboard → usuarios → organizaciones → cuestionarios → evaluaciones → asignaciones → informes → vulnerabilidades.
 */
const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Usuarios' },
  { to: '/organizations', label: 'Organizaciones' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/reports', label: 'Reportes' },
  { to: '/vulnerabilities', label: 'Vulnerabilidades' },
];

/**
 * Evaluador: entrada → panel → empresas → catálogo de formularios → evaluaciones → vínculos empresa–evaluación → informes.
 */
const EVALUATOR_NAV: NavItem[] = [
  { to: '/HomePage', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organizations', label: 'Organizaciones' },
  { to: '/questionnaires', label: 'Cuestionarios' },
  { to: '/evaluations', label: 'Evaluaciones' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/reports', label: 'Reportes' },
];

/** Usuario de empresa: trabajo primero (evaluaciones), luego informes. */
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
    if (path === '/HomePage' || path === '/RecoverPage' || path === '/recover-password') return true;
    if (path === '/dashboard') return true;
    if (path === '/questionnaires') return true;
    if (path === '/evaluations' || /^\/evaluations\/\d+\/workflow$/.test(path)) return true;
    if (path === '/reports' || /^\/reports\/[^/]+$/.test(path) || /^\/reports\/[^/]+\/report$/.test(path)) return true;
    if (path === '/asignaciones') return true;
    if (path === '/organizations' || path === '/organizations/new' || /^\/organizations\/\d+$/.test(path)) return true;
    return false;
  }

  if (role === 'user') {
    if (path === '/RecoverPage' || path === '/recover-password') return true;
    if (path === '/evaluations' || /^\/evaluations\/\d+\/workflow$/.test(path)) return true;
    if (path === '/reports' || /^\/reports\/[^/]+$/.test(path) || /^\/reports\/[^/]+\/report$/.test(path)) return true;
    return false;
  }

  return false;
}