import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import CategoryResults from '../components/CategoryResults';

const SAMPLE = [
  { id: 'c1', name: 'Gestión de Riesgos', value: 80 },
  { id: 'c2', name: 'Seguridad de la Información', value: 70 },
  { id: 'c3', name: 'Cumplimiento Normativo', value: 85 },
  { id: 'c4', name: 'Continuidad Operativa', value: 75 },
];

const ReportDetailPage: React.FC = () => {
  return (
    <Layout>
      <div style={{display:'flex', flexDirection:'column', gap:20}}>
        <h2 style={{margin:0}}>Detalle del Reporte</h2>

        <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:20}}>
          <ReportSummary score={78} level="Nivel Intermedio" date="15/02/2026" evaluator="Juan Perez" />

          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            <CategoryResults rows={SAMPLE} />
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <Link to="/reports" className="btn btn-primary">Volver</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportDetailPage;
