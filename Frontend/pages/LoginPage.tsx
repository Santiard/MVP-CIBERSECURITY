import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  getPasswordPolicyIssues,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../src/utils/passwordPolicy';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim()) ||
  'http://localhost:8000';

/** FastAPI suele devolver `{ detail: string }` o `{ detail: [{ msg: string, ... }] }`. */
function messageFromFastApiBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          const m = (item as { msg?: unknown }).msg;
          return typeof m === 'string' ? m : null;
        }
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(' ');
  }
  return null;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }
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
          email: emailTrim,
          password,
        }),
      });

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const serverMsg = messageFromFastApiBody(data);
        if (response.status === 401) {
          throw new Error(serverMsg || 'Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        if (response.status === 422) {
          throw new Error(serverMsg || PASSWORD_POLICY_MESSAGE);
        }
        throw new Error(serverMsg || 'No se pudo iniciar sesión. Intenta de nuevo.');
      }

      const dataOk = data as {
        access_token?: string;
        user_id?: number;
        name?: string;
        role?: string;
      };
      if (!dataOk?.access_token) {
        throw new Error('Respuesta inválida del servidor. Intenta de nuevo.');
      }
      localStorage.setItem('authToken', dataOk.access_token);
      localStorage.setItem('authUser', JSON.stringify({
        id: dataOk.user_id,
        name: dataOk.name,
        role: dataOk.role,
        email: emailTrim,
      }));
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          setError(
            `No se pudo contactar al API (${API_BASE}). Revisa que el backend esté arriba y CORS/origen del navegador.`,
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Error al iniciar sesión.');
      }
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
      <form
        noValidate
        onSubmit={submit}
        style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}
      >
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:6}}>
          <img src={logo} alt="RAY logo" style={{width:64, height:64, borderRadius:10, objectFit:'cover'}} />
          <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
          <div style={{fontSize:13, color:'var(--gray-600)'}}>Plataforma de Evaluación</div>
        </div>

        <h3 style={{marginTop:8, marginBottom:6}}>Iniciar sesión</h3>
        <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 0, marginBottom: 14 }}>* Campos obligatorios</p>

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: 14,
              lineHeight: 1.45,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        ) : null}

        <label style={{display:'block', textAlign:'center', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Correo Electrónico *</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu correo electrónico"
          required
          style={{width:'100%', padding:'12px 14px', borderRadius:8, border:'1px solid var(--gray-200)', marginBottom:12, boxSizing:'border-box', textAlign:'center'}}
        />

        <label style={{display:'block', textAlign:'center', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Contraseña *</label>
        <div style={{position: 'relative', marginBottom: 18}}>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
            style={{width:'100%', padding:'12px 52px 12px 14px', borderRadius:8, border:'1px solid var(--gray-200)', boxSizing:'border-box', textAlign:'center'}}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              top: '50%',
              right: 10,
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              color: 'var(--link-color)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '4px 6px',
            }}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        {showPasswordIssues && passwordIssues.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'inline-block' }}>
              {passwordIssues.map((issue) => (
                <li key={issue} style={{ textAlign: 'left' }}>{issue}</li>
              ))}
            </ul>
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

        <div style={{marginTop:14, display:'flex', flexDirection:'column', alignItems:'center', gap:8}}>
          <Link to="/register" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>
            Crear cuenta
          </Link>
          <a href="/RecoverPage" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>Recuperar contraseña</a>
          <a href="/dashboard" style={{color:'var(--muted)', textDecoration:'none', fontSize:13}}>Entrar como invitado</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
