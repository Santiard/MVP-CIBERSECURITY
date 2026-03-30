import React from 'react';
import Layout from '../components/Layout';
import UsersTable from '../components/UsersTable';

const UsersPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <UsersTable />
      </div>
    </Layout>
  );
};

export default UsersPage;
