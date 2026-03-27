import React from 'react';
import Layout from '../components/Layout';
import QuestionnairesTable from '../components/QuestionnairesTable';

const QuestionnairesPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Gestión de Cuestionarios</h2>
        <QuestionnairesTable />
      </div>
    </Layout>
  );
};

export default QuestionnairesPage;
