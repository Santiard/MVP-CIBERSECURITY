import React, { useState } from 'react';
import '../src/styles/theme.css';
import logo from '../src/images/logoRAY.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  getPasswordPolicyIssues,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../src/utils/passwordPolicy';
import dataService from '../src/services/dataService';

const PublicRegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();
    if (!nameTrim) {
      setError('Ingresa tu nombre.');
      return;
    }
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('Ingresa una contraseña.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const data = await dataService.registerAccount({
        name: nameTrim,
        email: emailTrim,
        password,
        phone: phone.trim() || undefined,
      });
      if (!data?.access_token) {
        setError('Respuesta inválida del servidor.');
        return;
      }
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: data.user_id,
          name: data.name,
          role: data.role,
          email: emailTrim,
        }),
      );
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo completar el registro.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      <form
        noValidate
        onSubmit={submit}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <img src={logo} alt="RAY logo" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }} />
          <div style={{ fontWeight: 800, color: 'var(--gray-900)' }}>RAY: Cyber-Madurez Core</div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>Crear cuenta</div>
        </div>

        <h3 style={{ marginTop: 8, marginBottom: 6 }}>Registro</h3>
        <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 0, marginBottom: 10 }}>* Campos obligatorios</p>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 0, marginBottom: 16, lineHeight: 1.45 }}>
          Se creará una cuenta con rol de usuario. Si eres administrador, usa la gestión de usuarios tras iniciar
          sesión.
        </p>

        {error ? (
          <div
            role="alert"
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

        <label style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
          Nombre completo *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Tu nombre"
          required
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            marginBottom: 12,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />

        <label style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
          Correo electrónico *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="correo@ejemplo.com"
          required
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            marginBottom: 12,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />

        <label style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
          Teléfono (opcional)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="+57 300 0000000"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            marginBottom: 12,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />

        <label style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
          Contraseña *
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Cumple la política de seguridad"
          required
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            marginBottom: 12,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />

        {showPasswordIssues && passwordIssues.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'inline-block' }}>
              {passwordIssues.map((issue) => (
                <li key={issue} style={{ textAlign: 'left' }}>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !name.trim() || !email.trim() || !password || passwordIssues.length > 0}
          style={{ width: '200px', margin: '0 auto 12px', display: 'block', opacity: loading ? 0.8 : 1 }}
        >
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <div style={{ marginTop: 8, fontSize: 13 }}>
          <Link to="/LoginPage" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
            ¿Ya tienes cuenta? Iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PublicRegisterPage;
