import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from '../components/UserForm';

const RegisterUserPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0 }}>Registrar Nuevo Usuario</h2>
        <UserForm inline onSaved={() => navigate('/users')} onClose={() => navigate('/users')} />
      </div>
    </div>
  );
};

export default RegisterUserPage;
