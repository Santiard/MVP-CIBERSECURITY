import React from 'react';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import BarChart from '../components/BarChart';
import Recommendations from '../components/Recommendations';
import CategoryResults from '../components/CategoryResults';

const SAMPLE_CATS = [
  { id: 'c1', name: 'Políticas', value: 68 },
  { id: 'c2', name: 'Infraestructura', value: 82 },
  { id: 'c3', name: 'Personal', value: 92 },
  { id: 'c4', name: 'Tecnología', value: 60 },
];

const SAMPLE_RECS = [
  'Implementar políticas de respaldo automático',
  'Capacitación en ciberseguridad al personal',
  'Actualizar firewall empresarial',
];

const ReportViewPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0}}>Reporte de Evaluación</h2>
          <button className="btn btn-primary">Exportar PDF</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:20, marginTop:16}}>
          <ReportSummary score={72} level="Nivel Intermedio" date="15/02/2026" evaluator="Juan Perez" />

          <div className="card">
            <h3 style={{marginTop:0}}>Distribución por dimensiones</h3>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 0'}}>
              <BarChart labels={SAMPLE_CATS.map(c => c.name)} values={SAMPLE_CATS.map(c => c.value)} />
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>
            <div>
              <CategoryResults rows={SAMPLE_CATS} />
            </div>
            <div>
              <Recommendations items={SAMPLE_RECS} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportViewPage;
