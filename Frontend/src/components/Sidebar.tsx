import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import exitIcon from '../images/exit.png';
import '../styles/theme.css';
import { getCurrentRole } from '../utils/auth';
import { getNavItemsByRole } from '../utils/roleAccess';

const linkStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--sidebar-text)',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  marginBottom: 8,
  fontWeight: 600,
};

const exitIconStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  flexShrink: 0,
  objectFit: 'contain',
  filter: 'invert(1)',
  opacity: 0.95,
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const navItems = getNavItemsByRole(getCurrentRole());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.classList.remove('theme-light', 'theme-dark');
      document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const themeIcon = theme === 'dark' ? '🌙' : '🌞';
  const themeToggleLabel = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } catch {
      // ignore
    }
    navigate('/LoginPage', { replace: true });
  };

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 220,
        background: 'var(--blue-900)',
        color: 'var(--sidebar-text)',
        height: '100vh',
        padding: '24px 12px',
        boxSizing: 'border-box',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '4px solid var(--blue-500)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            RAY: Cyber-Madurez
          </div>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
            title={themeToggleLabel}
            aria-label={themeToggleLabel}
          >
            {themeIcon}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Plataforma de Evaluación</div>
      </div>

      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.length === 0 ? (
            <li style={{ ...linkStyle, color: 'var(--muted)', cursor: 'default' }}>Sin menú para este rol</li>
          ) : (
            navItems.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  style={({ isActive }) =>
                    isActive ? { ...linkStyle, background: 'var(--blue-500)', color: 'var(--white)' } : linkStyle
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))
          )}
        </ul>
      </nav>

      <div style={{ flexShrink: 0, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--sidebar-text)',
            background: 'transparent',
            textAlign: 'left',
          }}
          aria-label="Cerrar sesión"
        >
          <img src={exitIcon} alt="" aria-hidden style={exitIconStyle} />
          Salir
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;