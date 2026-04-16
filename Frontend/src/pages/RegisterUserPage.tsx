import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UserForm from '../components/UserForm';

const RegisterUserPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 760 }}>
          <h2 style={{ marginTop: 0 }}>Registrar Nuevo Usuario</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: -8, lineHeight: 1.5 }}>
            Aquí solo puede crear usuarios un administrador ya autenticado. Si aún no tienes cuenta, usa{' '}
            <Link to="/register">Crear cuenta</Link> en la pantalla de inicio de sesión.
          </p>
          <UserForm inline onSaved={() => navigate('/users')} onClose={() => navigate('/users')} />
        </div>
      </div>
    </Layout>
  );
};

export default RegisterUserPage;
