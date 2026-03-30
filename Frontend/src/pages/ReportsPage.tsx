import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const ReportsPage: React.FC = () => {
  // Placeholder list of reports for navigation
  const sample = [
    { id: 'r1', title: 'Reporte Empresa ABC', date: '2026-02-15' },
    { id: 'r2', title: 'Reporte Empresa XYZ', date: '2026-03-01' },
  ];

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Reportes</h2>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '12px 8px' }}>Título</th>
                <th style={{ padding: '12px 8px' }}>Fecha</th>
                <th style={{ padding: '12px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sample.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.title}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.date}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                    <Link to={`/reports/${r.id}`} className="btn">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
