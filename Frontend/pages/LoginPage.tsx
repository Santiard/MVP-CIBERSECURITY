import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { useNavigate } from 'react-router-dom';
import {
  getPasswordPolicyIssues,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../src/utils/passwordPolicy';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const passwordIssues = getPasswordPolicyIssues(password);
  const showPasswordIssues = submitted || password.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Correo o contraseña incorrectos');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authUser', JSON.stringify({
        id: data.user_id,
        name: data.name,
        role: data.role,
        email: email.trim().toLowerCase(),
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
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

        {showPasswordIssues && passwordIssues.length > 0 && (
          <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {passwordIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger-color)', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email.trim() || !password || passwordIssues.length > 0}
          style={{width: '200px', margin: '0 auto', display: 'block', opacity: loading ? 0.8 : 1}}
        >
          {loading ? 'Validando...' : 'Ingresar'}
        </button>

        <div style={{marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <a href="/RecoverPage" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>Recuperar contraseña</a>
          <a href="/dashboard" style={{color:'var(--muted)', textDecoration:'none', fontSize:13}}>Entrar como invitado</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
