import React from 'react';
import Layout from '../components/Layout';
import VulnerabilityCard from '../components/VulnerabilityCard';
import dataService from '../services/dataService';

const VulnerabilitiesPage: React.FC = () => {
  // For UI-only we'll use mock counts from dataService or static values
  const total = 15;
  const critical = 4;
  const lastScan = '12/05/2026';

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>Reporte de Vulnerabilidades</h2>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 20 }}>
          <VulnerabilityCard title="Vulnerabilidades detectadas" value={total} hint="Total identificadas en el último análisis" />
          <VulnerabilityCard title="Vulnerabilidades críticas" value={critical} hint="Clasificadas como críticas" />
          <VulnerabilityCard title="Último Escaneo" value={lastScan} hint="Fecha del último análisis técnico" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Detección de vulnerabilidades</h3>
              <p style={{ color: 'var(--muted)' }}>Ejecutar test de seguridad para la organización seleccionada.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => alert('Simulación: iniciar escaneo (UI-only)')}>Iniciar escaneo</button>
                <button className="btn" onClick={() => alert('Simulación: ver historial (UI-only)')}>Ver Historial</button>
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Sitios y Servicios Revisados</h3>
              <p style={{ color: 'var(--muted)' }}>Lista de páginas web, servicios y rutas analizadas durante los escaneos de seguridad.</p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => alert('Simulación: abrir lista de sitios (UI-only)')}>Ver Lista</button>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Historial de Vulnerabilidades</h3>
              <p style={{ color: 'var(--muted)' }}>Accede al histórico de análisis técnicos realizados anteriormente.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => alert('Simulación: ver historial completo (UI-only)')}>Ver Historial</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VulnerabilitiesPage;
