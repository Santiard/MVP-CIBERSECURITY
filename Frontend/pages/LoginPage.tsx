import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement real auth; for now navigate to Dashboard
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-light)'
    }}>
      <form onSubmit={submit} style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:6}}>
          <img src={logo} alt="RAY logo" style={{width:64, height:64, borderRadius:10, objectFit:'cover'}} />
          <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
          <div style={{fontSize:13, color:'var(--gray-600)'}}>Plataforma de Evaluación</div>
        </div>

        <h3 style={{marginTop:8, marginBottom:6}}>Iniciar sesión</h3>

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu correo electrónico"
          required
          style={{width:'100%', padding:'12px 14px', borderRadius:8, border:'1px solid var(--gray-200)', marginBottom:12, boxSizing:'border-box', textAlign:'center'}}
        />

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
          required
          style={{width:'100%', padding:'12px 14px', borderRadius:8, border:'1px solid var(--gray-200)', marginBottom:18, boxSizing:'border-box', textAlign:'center'}}
        />

        <button type="submit" className="btn btn-primary" style={{width: '200px', margin: '0 auto', display: 'block'}}>Ingresar</button>

        <div style={{marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <a href="/RecoverPage" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>Recuperar contraseña</a>
          <a href="/dashboard" style={{color:'var(--muted)', textDecoration:'none', fontSize:13}}>Entrar como invitado</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
