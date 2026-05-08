import React from 'react';
import Layout from '../components/Layout';
import EvaluationsTable from '../components/EvaluationsTable';
import EvaluatorDashboard from '../components/EvaluatorDashboard';
import { getCurrentRole } from '../utils/auth';

const EvaluationsPage: React.FC = () => {
  const role = getCurrentRole();
  const isEvaluator = role === 'evaluator';

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>
          {isEvaluator ? 'Mis Evaluaciones' : 'Gestión de Evaluaciones'}
        </h2>
        {isEvaluator ? <EvaluatorDashboard /> : <EvaluationsTable />}
      </div>
    </Layout>
  );
};

export default EvaluationsPage;
