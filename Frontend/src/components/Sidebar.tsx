import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';
import logo from '../images/logoRAY.png';

const linkStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  marginBottom: 8,
  fontWeight: 600,
};

const Sidebar: React.FC = () => {
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
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

  return (
    <aside style={{
      width: 220,
      background: 'var(--blue-900)',
      color: 'var(--text-primary)',
      height: '100vh',
      padding: '24px 12px',
      boxSizing: 'border-box',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '4px solid var(--blue-500)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
        <img src={logo} alt="RAY logo" style={{
          width:44,
          height:44,
          borderRadius:8,
          objectFit: 'cover',
          boxShadow: 'var(--shadow-md)'
        }} />
        <div style={{color:'var(--text-primary)', display:'flex', flexDirection:'column'}}>
          <div style={{fontWeight:800, fontSize:14, display:'flex', alignItems:'center', gap:8}}>
            RAY: Cyber-Madurez Core
            <button
              aria-label="Alternar tema claro/oscuro"
              title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)' }}
              className="focus-ring"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
          <div style={{fontSize:12, color:'var(--muted)'}}>Plataforma de Evaluación</div>
               <li><Link to="/admin" style={linkStyle}>Dashboard</Link></li>
               <li><Link to="/questionnaires" style={linkStyle}>Cuestionarios</Link></li>
      <nav>
        <ul style={{listStyle:'none', padding:0, margin:0}}>
          <li><Link to="/admin" style={linkStyle}>Dashboard</Link></li>
          <li><Link to="/organizations" style={linkStyle}>Organizaciones</Link></li>
          <li><Link to="/evaluations" style={{...linkStyle, background:'var(--blue-500)', boxShadow:'var(--shadow-sm)'}}>Evaluaciones</Link></li>
          <li><Link to="/reports" style={linkStyle}>Reportes</Link></li>
          <li><Link to="/vulnerabilities" style={linkStyle}>Vulnerabilidades</Link></li>
          <li><Link to="/users" style={linkStyle}>Usuarios</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
