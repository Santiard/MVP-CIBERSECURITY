// Placeholder Dashboard page
import React from 'react';
import Layout from '../src/components/Layout';
import EvaluationsTable from '../src/components/EvaluationsTable';

export const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <EvaluationsTable />
    </Layout>
  );
};

export default DashboardPage;
