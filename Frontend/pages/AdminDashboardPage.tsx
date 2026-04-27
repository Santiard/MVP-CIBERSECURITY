import React from 'react';
import Layout from '../src/components/Layout';
import { getCurrentRole } from '../src/utils/auth';

const AdminCard: React.FC<{ title: string; subtitle?: string; to?: string }> = ({ title, subtitle, to }) => (
  <div className="card" style={{ padding: 20, minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      {subtitle && <div style={{ color: 'var(--muted)', marginTop: 6 }}>{subtitle}</div>}
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {to ? (
        <a href={to} className="btn btn-primary" style={{ textDecoration: 'none' }}>Abrir</a>
      ) : (
        <button className="btn" onClick={() => alert('Abrir módulo')}>Abrir</button>
      )}
    </div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const role = getCurrentRole();
  const isAdmin = role === 'admin';

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>{isAdmin ? 'Panel administrativo' : 'Panel de trabajo'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginTop: 16 }}>
          <AdminCard title="Cuestionarios" subtitle="Ver cuestionarios" to="/questionnaires" />
          <AdminCard title="Organizaciones" subtitle="Empresas registradas" to="/organizations" />
          {isAdmin && <AdminCard title="Usuarios" subtitle="Administrar usuarios" to="/users" />}
          <AdminCard title="Evaluaciones" subtitle="Historial y flujo" to="/evaluations" />
          <AdminCard title="Asignaciones" subtitle="Empresa ↔ evaluación" to="/asignaciones" />
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;
