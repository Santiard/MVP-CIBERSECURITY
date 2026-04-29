import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { getPasswordPolicyIssues, PASSWORD_POLICY_MESSAGE } from '../src/utils/passwordPolicy';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim()) ||
  'http://localhost:8000';

/** Paso 1: solicitar correo → el API envía enlace (o lo registra en log si no hay SMTP). */
function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trim = email.trim().toLowerCase();
    if (!validateEmail(trim)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trim }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const detail = (data as { detail?: unknown }).detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : 'No se pudo procesar la solicitud. Intenta más tarde.';
        throw new Error(msg);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div
        style={{
          width: 420,
          maxWidth: '92%',
          background: 'var(--surface-light)',
          padding: 28,
          borderRadius: 12,
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Revisa tu correo</h3>
        <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.5 }}>
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña. El enlace caduca en
          poco tiempo y solo sirve una vez.
        </p>
        <p style={{ color: 'var(--gray-600)', fontSize: 13 }}>
          <strong>Entorno de desarrollo sin SMTP:</strong> el enlace también se escribe en la consola del servidor
          (backend).
        </p>
        <Link to="/LoginPage" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => void submit(e)}
      style={{
        width: 420,
        maxWidth: '92%',
        background: 'var(--surface-light)',
        padding: 28,
        borderRadius: 12,
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Recuperar contraseña</h3>
      <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 0, marginBottom: 10 }}>* Campos obligatorios</p>
      <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--gray-600)', fontSize: 13 }}>
        Indica el correo de tu cuenta. Te enviaremos un enlace para definir una nueva contraseña.
      </p>

      <label style={{ display: 'block', textAlign: 'left', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
        Correo electrónico *
      </label>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        required
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: error ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
          marginBottom: 8,
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      />

      {error && (
        <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 12 }}>{error}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !email.trim()}
        style={{ width: 220, margin: '8px auto 0', display: 'block', opacity: loading ? 0.85 : 1 }}
      >
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </button>

      <div style={{ marginTop: 14 }}>
        <Link to="/LoginPage" style={{ color: 'var(--link-color)', textDecoration: 'none', fontSize: 13 }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}

type PropsToken = { token: string };

/** Paso 2: token en URL → nueva contraseña (confirmación en frío). */
function ConfirmResetForm({ token }: PropsToken) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const passwordIssues = getPasswordPolicyIssues(newPassword);
  const showPasswordIssues = submitted || newPassword.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const nextErrors: Record<string, string> = {};

    if (!newPassword) {
      nextErrors.newPassword = 'La nueva contraseña es obligatoria.';
    } else if (passwordIssues.length > 0) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirma la contraseña.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/confirm-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = (data as { detail?: unknown }).detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : 'No se pudo actualizar la contraseña. Solicita un nuevo enlace.';
        throw new Error(msg);
      }
      setSuccess(true);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Error al actualizar la contraseña.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          width: 420,
          maxWidth: '92%',
          background: 'var(--surface-light)',
          padding: 28,
          borderRadius: 12,
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Contraseña actualizada</h3>
        <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--gray-600)', fontSize: 13 }}>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Link to="/LoginPage" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => void submit(e)}
      style={{
        width: 420,
        maxWidth: '92%',
        background: 'var(--surface-light)',
        padding: 28,
        borderRadius: 12,
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Nueva contraseña</h3>
      <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 0, marginBottom: 10 }}>* Campos obligatorios</p>
      <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--gray-600)', fontSize: 13 }}>
        Has abierto un enlace válido. Define tu nueva contraseña.
      </p>

      <label style={{ display: 'block', textAlign: 'left', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
        Nueva contraseña *
      </label>
      <input
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Mínimo 8 caracteres según política"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: errors.newPassword ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
          marginBottom: 8,
          boxSizing: 'border-box',
          textAlign: 'center',
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
      {errors.newPassword && (
        <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.newPassword}</div>
      )}

      <label style={{ display: 'block', textAlign: 'left', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
        Confirmar contraseña *
      </label>
      <input
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: errors.confirmPassword ? '1px solid var(--danger)' : '1px solid var(--gray-200)',
          marginBottom: 8,
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      />
      {errors.confirmPassword && (
        <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.confirmPassword}</div>
      )}

      {errors.general && (
        <div style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'left', marginBottom: 8 }}>{errors.general}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={
          loading ||
          !newPassword ||
          !confirmPassword ||
          passwordIssues.length > 0 ||
          newPassword !== confirmPassword
        }
        style={{ width: 220, margin: '12px auto 0', display: 'block', opacity: loading ? 0.85 : 1 }}
      >
        {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
      </button>

      <div style={{ marginTop: 14 }}>
        <Link to="/LoginPage" style={{ color: 'var(--link-color)', textDecoration: 'none', fontSize: 13 }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}

const RecoverPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenRaw = searchParams.get('token') ?? '';
  const token = tokenRaw.trim();
  const invalidTokenHint = tokenRaw !== '' && token.length < 20;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-light)',
      }}
    >
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logo} alt="RAY logo" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
        <div style={{ fontWeight: 800, color: 'var(--gray-900)' }}>RAY: Cyber-Madurez Core</div>
      </div>

      {invalidTokenHint ? (
        <div style={{ width: 420, maxWidth: '92%', textAlign: 'center', padding: 28 }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Este enlace no es válido o está incompleto.</p>
          <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>
            Solicita un nuevo correo desde la pantalla de recuperación de contraseña.
          </p>
          <Link to="/recover-password" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
            Solicitar de nuevo
          </Link>
        </div>
      ) : token.length >= 20 ? (
        <ConfirmResetForm token={token} />
      ) : (
        <RequestResetForm />
      )}
    </div>
  );
};

export default RecoverPage;
