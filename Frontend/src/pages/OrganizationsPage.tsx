import React from 'react';
import Layout from '../components/Layout';
import OrganizationsTable from '../components/OrganizationsTable';

const OrganizationsPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <OrganizationsTable />
      </div>
    </Layout>
  );
};

export default OrganizationsPage;
