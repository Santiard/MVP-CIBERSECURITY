import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';

const linkStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--sidebar-text)',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  marginBottom: 8,
  fontWeight: 600,
};

const Sidebar: React.FC = () => {
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

  return (
    <aside className="app-sidebar" style={{
      width: 220,
      background: 'var(--blue-900)',
      color: 'var(--sidebar-text)',
      height: '100vh',
      padding: '24px 12px',
      boxSizing: 'border-box',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '4px solid var(--blue-500)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
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

      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li><Link to="/admin" style={linkStyle}>Dashboard</Link></li>
          <li><Link to="/organizations" style={linkStyle}>Organizaciones</Link></li>
          <li><Link to="/questionnaires" style={linkStyle}>Cuestionarios</Link></li>
          <li><Link to="/evaluations" style={{ ...linkStyle, background: 'var(--blue-500)' }}>Evaluaciones</Link></li>
          <li><Link to="/reports" style={linkStyle}>Reportes</Link></li>
          <li><Link to="/vulnerabilities" style={linkStyle}>Vulnerabilidades</Link></li>
          <li><Link to="/users" style={linkStyle}>Usuarios</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;