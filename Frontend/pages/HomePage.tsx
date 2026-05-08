import React from 'react';
import Layout from '../src/components/Layout';
import '../src/styles/theme.css';
import { getCurrentRole } from '../src/utils/auth';

const HomePage: React.FC = () => {
  const role = getCurrentRole();
  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--blue-700)', marginBottom: 16 }}>
          Bienvenido a la Plataforma de Evaluación
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
          Esta plataforma centraliza la gestión y análisis de ciberseguridad. 
          Aquí podrás definir el alcance de las evaluaciones, responder cuestionarios, 
          identificar vulnerabilidades y generar reportes ejecutivos en tiempo real.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, textAlign: 'left' }}>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
            <h3 style={{ color: 'var(--blue-600)', marginTop: 0, fontSize: '1.2rem' }}>Gestión de Riesgos</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>Identifica y categoriza los riesgos de tu organización alineados a controles estandarizados y mejores prácticas.</p>
          </div>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
            <h3 style={{ color: 'var(--blue-600)', marginTop: 0, fontSize: '1.2rem' }}>Reportes Dinámicos</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>Visualiza el nivel de madurez y el porcentaje de cumplimiento mediante reportes visuales detallados.</p>
          </div>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
            <h3 style={{ color: 'var(--blue-600)', marginTop: 0, fontSize: '1.2rem' }}>Evaluaciones Ágiles</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>Asigna y responde formularios de manera eficiente, manteniendo siempre el progreso sincronizado.</p>
          </div>
        </div>

        {role === 'admin' && (
          <div style={{ marginTop: 40 }}>
            <a href="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 16, textDecoration: 'none' }}>
              Ir al Panel de Administración
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
