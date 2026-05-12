import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.svg';
import { Link, useNavigate } from 'react-router-dom';
import {
  getPasswordPolicyIssues,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../src/utils/passwordPolicy';
import PhoneField from '../src/components/PhoneField';
import PasswordToggle from '../src/components/PasswordToggle';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim()) ||
  'http://localhost:8000';

// ── Password policy checklist ─────────────────────────────────────────────────
const POLICY_CHECKS: { label: string; test: (p: string) => boolean }[] = [
  { label: 'Al menos 8 caracteres',                test: (p) => p.length >= 8 },
  { label: 'Una letra mayúscula',                  test: (p) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula',                  test: (p) => /[a-z]/.test(p) },
  { label: 'Un número',                            test: (p) => /\d/.test(p) },
  { label: 'Un carácter especial (!@#$%…)',         test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PolicyChecklist: React.FC<{ password: string }> = ({ password }) => (
  <div style={{ marginBottom: 12, textAlign: 'left' }}>
    {POLICY_CHECKS.map(({ label, test }) => {
      const ok = password.length > 0 && test(password);
      return (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 3 }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
            background: ok ? '#16a34a' : (password.length > 0 ? '#dc2626' : 'var(--border)'),
            color: '#fff', flexShrink: 0,
          }}>
            {ok ? '✓' : '✗'}
          </span>
          <span style={{ color: ok ? '#16a34a' : (password.length > 0 ? '#dc2626' : 'var(--muted)') }}>
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const PublicRegisterPage: React.FC = () => {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const navigate = useNavigate();

  const passwordIssues = getPasswordPolicyIssues(password);
  const pwdMismatch    = submitted && confirmPwd.length > 0 && password !== confirmPwd;

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    marginBottom: 14,
    boxSizing: 'border-box',
    fontSize: 14,
    background: 'var(--background)',
    color: 'var(--gray-900)',
    outline: 'none',
  };

  const labelBase: React.CSSProperties = {
    display: 'block',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--gray-700)',
    marginBottom: 5,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    const nameTrim  = name.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!nameTrim) { setError('Ingresa tu nombre completo.'); return; }
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Ingresa un correo electrónico válido.'); return;
    }
    if (!password) { setError('Ingresa una contraseña.'); return; }
    if (!isStrongPassword(password)) { setError(PASSWORD_POLICY_MESSAGE); return; }
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          email: emailTrim,
          password,
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({})) as Record<string, unknown>;

      if (!response.ok) {
        const detail = data.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? (detail as { msg?: string }[]).map((d) => d.msg).filter(Boolean).join(' ')
            : `Error ${response.status}: no se pudo completar el registro.`;
        setError(msg);
        return;
      }

      const token = data.access_token;
      if (typeof token !== 'string' || !token) {
        setError('Respuesta inesperada del servidor. Intenta iniciar sesión directamente.');
        return;
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify({
        id:    data.user_id,
        name:  data.name,
        role:  data.role,
        email: emailTrim,
      }));
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión o contacta al administrador.');
      } else {
        setError(err instanceof Error ? err.message : 'Error inesperado. Intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>

      {/* Logo top-left */}
      <div style={{ position: 'absolute', top: 20, left: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={logo} alt="RAY logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
        <div style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>RAY: Cyber-Madurez Core</div>
      </div>

      <form
        noValidate
        onSubmit={(e) => void submit(e)}
        style={{
          width: 460,
          maxWidth: '94%',
          background: 'var(--surface-light)',
          padding: '32px 28px',
          borderRadius: 14,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <img src={logo} alt="RAY logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--gray-900)' }}>RAY: Cyber-Madurez Core</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Crear cuenta nueva</div>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" style={{
            marginBottom: 16, padding: '11px 14px', borderRadius: 8,
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#991B1B', fontSize: 13, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Name */}
        <label style={labelBase}>Nombre completo *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Tu nombre completo"
          required
          style={{ ...inputBase, borderColor: submitted && !name.trim() ? 'var(--danger)' : 'var(--border)' }}
        />

        {/* Email */}
        <label style={labelBase}>Correo electrónico *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="correo@ejemplo.com"
          required
          style={{ ...inputBase, borderColor: submitted && !email.trim() ? 'var(--danger)' : 'var(--border)' }}
        />

        {/* Phone — uses PhoneField component */}
        <label style={{ ...labelBase, marginBottom: 8 }}>Teléfono <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</span></label>
        <div style={{ marginBottom: 14 }}>
          <PhoneField value={phone} onChange={setPhone} />
        </div>

        {/* Password */}
        <label style={labelBase}>Contraseña *</label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Crea una contraseña segura"
            required
            style={{
              ...inputBase,
              marginBottom: 0,
              paddingRight: 42,
              borderColor: submitted && passwordIssues.length > 0 ? 'var(--danger)' : 'var(--border)',
            }}
          />
          <PasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />
        </div>

        {/* Policy checklist */}
        {password.length > 0 && <PolicyChecklist password={password} />}

        {/* Confirm password */}
        <label style={labelBase}>Confirmar contraseña *</label>
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            required
            style={{
              ...inputBase,
              marginBottom: 0,
              paddingRight: 42,
              borderColor: pwdMismatch ? 'var(--danger)' : 'var(--border)',
            }}
          />
          <PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
        </div>
        {pwdMismatch && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>Las contraseñas no coinciden.</div>
        )}
        {!pwdMismatch && <div style={{ marginBottom: 12 }} />}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !name.trim() || !email.trim() || !password || passwordIssues.length > 0 || password !== confirmPwd}
          style={{ width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 700, opacity: loading ? 0.8 : 1 }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13 }}>
          <Link to="/LoginPage" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
            ¿Ya tienes cuenta? Iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PublicRegisterPage;
