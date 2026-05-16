import React from 'react';
import Layout from '../components/Layout';
import QuestionnairesTable from '../components/QuestionnairesTable';
import { getCurrentRole } from '../utils/auth';

const QuestionnairesPage: React.FC = () => {
  const role = getCurrentRole();
  const mode = role === 'evaluator' ? 'evaluator' : 'admin';

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <QuestionnairesTable mode={mode} />
      </div>
    </Layout>
  );
};

export default QuestionnairesPage;
