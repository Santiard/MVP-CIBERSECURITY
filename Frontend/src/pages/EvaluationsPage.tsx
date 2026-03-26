import React from 'react';
import Layout from '../components/Layout';
import EvaluationsTable from '../components/EvaluationsTable';

const EvaluationsPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Gestión de Evaluaciones</h2>
        <p style={{ color: 'var(--muted)', marginTop: 4, marginBottom: 16 }}>Filtrar por organización</p>
        <EvaluationsTable />
      </div>
    </Layout>
  );
};

export default EvaluationsPage;
