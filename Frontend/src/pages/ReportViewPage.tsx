import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import BarChart from '../components/BarChart';
import Recommendations from '../components/Recommendations';
import CategoryResults from '../components/CategoryResults';
import { useParams } from 'react-router-dom';
import { getReportByEvaluationId, ReportDetail } from '../services/reportApi';

const ReportViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    getReportByEvaluationId(id).then(setReport).catch(() => setReport(null));
  }, [id]);

  const labels = report?.categories?.map(c => c.name) || [];
  const values = report?.categories?.map(c => c.value) || [];

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0}}>Reporte de Evaluación</h2>
          <button className="btn btn-primary">Exportar PDF</button>
        </div>

        {!report && <div className="card" style={{ marginTop: 16 }}>No se encontró el reporte solicitado.</div>}

        {report && (
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:20, marginTop:16}}>
            <ReportSummary score={report.score} level={report.level} date={report.date} evaluator={report.evaluator} />

            <div className="card">
              <h3 style={{marginTop:0}}>Distribución por dimensiones</h3>
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 0'}}>
                {values.length > 0 ? <BarChart labels={labels} values={values} /> : <div>Sin datos de dimensiones</div>}
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>
              <div>
                <CategoryResults rows={report.categories} />
              </div>
              <div>
                <Recommendations items={report.recommendations} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportViewPage;
