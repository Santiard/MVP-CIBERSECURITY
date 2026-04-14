import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import VulnerabilityCard from '../components/VulnerabilityCard';
import { getVulnerabilityMetrics, listVulnerabilities } from '../services/vulnerabilityApi';

const VulnerabilitiesPage: React.FC = () => {
  const [metrics, setMetrics] = useState({ total: 0, critical: 0, lastScan: '-' });
  const [rows, setRows] = useState<Array<{ id_vulnerabilidad: number; descripcion: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [m, vulnerabilities] = await Promise.all([
          getVulnerabilityMetrics(),
          listVulnerabilities(),
        ]);
        setMetrics(m);
        setRows(vulnerabilities);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>Reporte de Vulnerabilidades</h2>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 20 }}>
          <VulnerabilityCard title="Vulnerabilidades detectadas" value={metrics.total} hint="Total identificadas en el último análisis" />
          <VulnerabilityCard title="Vulnerabilidades críticas" value={metrics.critical} hint="Clasificadas como críticas" />
          <VulnerabilityCard title="Último Escaneo" value={metrics.lastScan} hint="Fecha del último análisis técnico" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Detección de vulnerabilidades</h3>
              <p style={{ color: 'var(--muted)' }}>Registros cargados desde backend ({loading ? 'cargando...' : 'actualizado'}).</p>
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ padding: '10px 8px' }}>ID</th>
                      <th style={{ padding: '10px 8px' }}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id_vulnerabilidad}>
                        <td style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>{r.id_vulnerabilidad}</td>
                        <td style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>{r.descripcion}</td>
                      </tr>
                    ))}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }} colSpan={2}>Sin vulnerabilidades registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Sitios y Servicios Revisados</h3>
              <p style={{ color: 'var(--muted)' }}>Módulo conectado para consumir inventario técnico desde endpoints de entidad.</p>
            </div>
          </div>

          <div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Historial de Vulnerabilidades</h3>
              <p style={{ color: 'var(--muted)' }}>Último corte: {metrics.lastScan}. Total acumulado: {metrics.total}.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VulnerabilitiesPage;
