import React from 'react';
import Layout from '../components/Layout';
import OrganizationsTable from '../components/OrganizationsTable';
import { getCurrentRole } from '../utils/auth';

const OrganizationsPage: React.FC = () => {
  const role = getCurrentRole();
  const tableMode = role === 'admin' ? 'admin' : 'evaluator';

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <OrganizationsTable mode={tableMode} />
      </div>
    </Layout>
  );
};

export default OrganizationsPage;
