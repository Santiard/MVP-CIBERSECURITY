import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import CategoryResults from '../components/CategoryResults';
import { getReportByEvaluationId, type ReportDetail } from '../services/reportApi';
import viewIcon from '../images/ojo.svg';

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getReportByEvaluationId(id)
      .then(setReport)
      .catch(() => setError('No se pudo cargar el reporte. Verifique que la evaluación tenga respuestas guardadas.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Reporte de Evaluación</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {report && (
              <Link to={`/reports/${report.id}/report`} className="btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src={viewIcon} alt="Ver completo" width={16} height={16} />
                Vista Completa
              </Link>
            )}
            <Link to="/reports" className="btn btn-primary" style={{ textDecoration: 'none' }}>Volver</Link>
          </div>
        </div>

        {loading && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Calculando reporte...</div>}
        {error  && <div className="card" style={{ padding: 24, color: 'var(--danger)' }}>{error}</div>}

        {report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ReportSummary
              score={report.score}
              level={report.level}
              levelColor={report.levelColor}
              date={report.date}
              evaluator={report.evaluator}
              orgName={report.orgName}
              estado={report.estado}
              totalQuestions={report.totalQuestions}
              answeredQuestions={report.answeredQuestions}
            />
            <CategoryResults rows={report.categories} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportDetailPage;
