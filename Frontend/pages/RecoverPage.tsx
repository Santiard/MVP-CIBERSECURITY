import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { getPasswordPolicyIssues, PASSWORD_POLICY_MESSAGE } from '../src/utils/passwordPolicy';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

const RecoverPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordIssues = getPasswordPolicyIssues(newPassword);
  const showPasswordIssues = submitted || newPassword.length > 0;

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const nextErrors: Record<string, string> = {};
    if (!validateEmail(email)) {
      nextErrors.email = 'Por favor ingresa un correo electrónico válido.';
    }
    if (!newPassword) {
      nextErrors.newPassword = 'La nueva contraseña es requerida.';
    } else if (passwordIssues.length > 0) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirma la contraseña.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/auth/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo recuperar la contraseña.');
      }

      setIsSuccess(true);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'No se pudo recuperar la contraseña.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-light)'
      }}>
        <div style={{position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:12}}>
          <img src={logo} alt="RAY logo" style={{width:42, height:42, borderRadius:8, objectFit:'cover'}} />
          <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
        </div>

        <div style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}>
          <h3 style={{marginTop:0, marginBottom:6}}>Contraseña actualizada</h3>
          <p style={{marginTop:0, marginBottom:18, color:'var(--gray-600)', fontSize:13}}>Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.</p>
          <button onClick={() => window.location.href = '/LoginPage'} className="btn btn-primary" style={{width: '200px', margin: '0 auto', display: 'block'}}>Volver al inicio de sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-light)'
    }}>
      <div style={{position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:12}}>
        <img src={logo} alt="RAY logo" style={{width:42, height:42, borderRadius:8, objectFit:'cover'}} />
        <div style={{fontWeight:800, color:'var(--gray-900)'}}>RAY: Cyber-Madurez Core</div>
      </div>

      <form onSubmit={submit} style={{width:420, maxWidth:'92%', background:'var(--surface-light)', padding:28, borderRadius:12, boxShadow:'var(--shadow-md)', textAlign:'center'}}>
        <h3 style={{marginTop:0, marginBottom:6}}>Recuperar Contraseña</h3>
        <p style={{marginTop:0, marginBottom:18, color:'var(--gray-600)', fontSize:13}}>Ingresa tu correo y define una nueva contraseña.</p>

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu correo electrónico"
          required
          style={{
            width:'100%',
            padding:'12px 14px',
            borderRadius:8,
            border: errors.email ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
            marginBottom:8,
            boxSizing:'border-box',
            textAlign:'center'
          }}
        />
        {errors.email && <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.email}</div>}

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Nueva Contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 8, con mayúscula, minúscula y especial"
          required
          style={{
            width:'100%',
            padding:'12px 14px',
            borderRadius:8,
            border: errors.newPassword ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
            marginBottom:8,
            boxSizing:'border-box',
            textAlign:'center'
          }}
        />
        {showPasswordIssues && passwordIssues.length > 0 && (
          <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>
            <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {passwordIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {errors.newPassword && <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.newPassword}</div>}

        <label style={{display:'block', textAlign:'left', fontSize:13, color:'var(--gray-600)', marginBottom:6}}>Confirmar Contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la nueva contraseña"
          required
          style={{
            width:'100%',
            padding:'12px 14px',
            borderRadius:8,
            border: errors.confirmPassword ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
            marginBottom:8,
            boxSizing:'border-box',
            textAlign:'center'
          }}
        />
        {errors.confirmPassword && <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.confirmPassword}</div>}

        {errors.general && <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.general}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email.trim() || !newPassword || !confirmPassword || passwordIssues.length > 0 || newPassword !== confirmPassword}
          style={{width: '200px', margin: '0 auto', display: 'block', opacity: loading ? 0.8 : 1}}
        >
          {loading ? 'Validando...' : 'Actualizar contraseña'}
        </button>

        <div style={{marginTop:14}}>
          <a href="/LoginPage" style={{color:'var(--link-color)', textDecoration:'none', fontSize:13}}>Volver al inicio de sesión</a>
        </div>
      </form>
    </div>
  );
};

export default RecoverPage;
