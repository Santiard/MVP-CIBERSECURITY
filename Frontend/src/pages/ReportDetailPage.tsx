import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import CategoryResults from '../components/CategoryResults';
import { getReportByEvaluationId, ReportDetail } from '../services/reportApi';

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    getReportByEvaluationId(id).then(setReport).catch(() => setReport(null));
  }, [id]);

  return (
    <Layout>
      <div style={{display:'flex', flexDirection:'column', gap:20}}>
        <h2 style={{margin:0}}>Detalle del Reporte</h2>

        {!report && <div className="card">No se encontró el reporte solicitado.</div>}

        {report && (
          <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:20}}>
            <ReportSummary score={report.score} level={report.level} date={report.date} evaluator={report.evaluator} />

            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <CategoryResults rows={report.categories} />
              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <Link to={`/reports/${report.id}/report`} className="btn">Vista Completa</Link>
                <Link to="/reports" className="btn btn-primary">Volver</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportDetailPage;
