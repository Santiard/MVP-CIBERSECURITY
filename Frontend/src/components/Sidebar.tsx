import React from 'react';
import '../styles/theme.css';
import logo from '../images/logoRAY.png';

const linkStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--white)',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  marginBottom: 8,
  fontWeight: 600,
};

const Sidebar: React.FC = () => {
  return (
    <aside style={{
      width: 220,
      background: 'var(--blue-900)',
      color: 'var(--white)',
      height: '100vh',
      padding: '24px 12px',
      boxSizing: 'border-box',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '4px solid var(--blue-500)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
        <img src={logo} alt="ROY logo" style={{
          width:44,
          height:44,
          borderRadius:8,
          objectFit: 'cover',
          boxShadow: 'var(--shadow-md)'
        }} />
        <div style={{color:'var(--white)'}}>
          <div style={{fontWeight:800, fontSize:14}}>ROY: Cyber-Madurez Core</div>
          <div style={{fontSize:12, color:'rgba(255,255,255,0.75)'}}>Plataforma de Evaluación</div>
        </div>
      </div>
      <nav>
        <ul style={{listStyle:'none', padding:0, margin:0}}>
          <li><a href="#" style={linkStyle}>Dashboard</a></li>
          <li><a href="#" style={linkStyle}>Organizaciones</a></li>
          <li><a href="#" style={{...linkStyle, background:'var(--blue-500)', boxShadow:'var(--shadow-sm)'}}>Evaluaciones</a></li>
          <li><a href="#" style={linkStyle}>Reportes</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
