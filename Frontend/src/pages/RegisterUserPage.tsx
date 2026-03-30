import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UserForm from '../components/UserForm';

const RegisterUserPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 760 }}>
          <h2 style={{ marginTop: 0 }}>Registrar Nuevo Usuario</h2>
          <UserForm inline onSaved={() => navigate('/users')} onClose={() => navigate('/users')} />
        </div>
      </div>
    </Layout>
  );
};

export default RegisterUserPage;
