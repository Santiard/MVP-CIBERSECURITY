import React from 'react';
import Layout from '../components/Layout';
import OrganizationForm from '../components/OrganizationForm';
import { useNavigate } from 'react-router-dom';

const RegisterOrganizationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSaved = () => {
    // after saving, go back to organizations list
    navigate('/organizations');
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Registrar Organización</h2>
        <div style={{ maxWidth: 820 }}>
          <OrganizationForm open={true} onClose={() => navigate('/organizations')} onSaved={handleSaved} />
        </div>
      </div>
    </Layout>
  );
};

export default RegisterOrganizationPage;
