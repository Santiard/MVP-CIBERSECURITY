import React, { useEffect, useState } from 'react';
import Layout from '../src/components/Layout';
import { getCurrentRole } from '../src/utils/auth';
import dataService from '../src/services/dataService';
import { listEvaluations, type EvaluationApiRow } from '../src/services/evaluationApi';

type Org = { id_empresa: number; nombre: string };
type User = { id: string; role: string };
type Questionnaire = { id: string };

const AdminDashboardPage: React.FC = () => {
  const role = getCurrentRole();
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [evals, setEvals] = useState<EvaluationApiRow[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const promises: Promise<any>[] = [
          dataService.getOrgs(),
          listEvaluations(),
          dataService.getQuestionnaires()
        ];
        
        if (isAdmin) {
          promises.push(dataService.getUsers());
        } else {
          promises.push(Promise.resolve([]));
        }

        const [o, e, q, u] = await Promise.all(promises);
        setOrgs(o || []);
        setEvals(e || []);
        setQuestionnaires(q || []);
        setUsers(u || []);
      } catch {
        // ignorar errores
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isAdmin]);

  const totalOrgs = orgs.length;
  const totalEvals = evals.length;
  const totalForms = questionnaires.length;
  const totalUsers = users.length;

  const adminUsers = users.filter(u => u.role === 'admin').length;
  const evaluatorUsers = users.filter(u => u.role === 'evaluator').length;
  const regularUsers = users.filter(u => u.role === 'user').length;

  const pendingEvals = evals.filter(e => {
    const st = (e.estado || '').toLowerCase();
    return st === 'pendiente' || st === '';
  }).length;
  const inProgressEvals = evals.filter(e => (e.estado || '').toLowerCase() === 'en progreso').length;
  const finishedEvals = evals.filter(e => {
    const st = (e.estado || '').toLowerCase();
    return st === 'finalizado' || st === 'finalizada';
  }).length;

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '1.8rem', color: 'var(--blue-700)' }}>
          {isAdmin ? 'Panel de Control Principal' : 'Panel de Seguimiento'}
        </h2>
        
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Cargando métricas...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {isAdmin && (
                <div className="card" style={{ padding: 20, borderTop: '4px solid var(--blue-900)' }}>
                  <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Total Usuarios</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-900)', marginTop: 8 }}>{totalUsers}</div>
                </div>
              )}
              <div className="card" style={{ padding: 20, borderTop: '4px solid var(--blue-700)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Organizaciones Registradas</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-700)', marginTop: 8 }}>{totalOrgs}</div>
              </div>
              <div className="card" style={{ padding: 20, borderTop: '4px solid var(--blue-500)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Evaluaciones Activas</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-500)', marginTop: 8 }}>{totalEvals}</div>
              </div>
              <div className="card" style={{ padding: 20, borderTop: '4px solid var(--blue-400)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Formularios Catálogo</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-400)', marginTop: 8 }}>{totalForms}</div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 16, color: 'var(--blue-700)' }}>Estado de Evaluaciones</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 100, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Pendiente</div>
                    <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${totalEvals ? (pendingEvals/totalEvals)*100 : 0}%`, background: 'var(--blue-400)', height: '100%', minWidth: pendingEvals > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                    </div>
                    <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{pendingEvals}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 100, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>En Progreso</div>
                    <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${totalEvals ? (inProgressEvals/totalEvals)*100 : 0}%`, background: 'var(--blue-500)', height: '100%', minWidth: inProgressEvals > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                    </div>
                    <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{inProgressEvals}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 100, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Finalizado</div>
                    <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${totalEvals ? (finishedEvals/totalEvals)*100 : 0}%`, background: 'var(--blue-700)', height: '100%', minWidth: finishedEvals > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                    </div>
                    <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{finishedEvals}</div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 16, color: 'var(--blue-700)' }}>Distribución de Usuarios</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 120, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Administradores</div>
                      <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${totalUsers ? (adminUsers/totalUsers)*100 : 0}%`, background: 'var(--blue-900)', height: '100%', minWidth: adminUsers > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                      </div>
                      <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{adminUsers}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 120, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Evaluadores</div>
                      <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${totalUsers ? (evaluatorUsers/totalUsers)*100 : 0}%`, background: 'var(--blue-500)', height: '100%', minWidth: evaluatorUsers > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                      </div>
                      <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{evaluatorUsers}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 120, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Usuarios (Org)</div>
                      <div style={{ flex: 1, background: 'var(--background)', height: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${totalUsers ? (regularUsers/totalUsers)*100 : 0}%`, background: 'var(--blue-500)', height: '100%', minWidth: regularUsers > 0 ? 12 : 0, transition: 'width 1s ease-out' }} />
                      </div>
                      <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{regularUsers}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Links */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: 'var(--blue-700)' }}>Accesos Rápidos</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {isAdmin && <a href="/users" className="btn" style={{ textDecoration: 'none', background: 'var(--background)', color: 'var(--blue-700)' }}>Gestión de Usuarios</a>}
                <a href="/organizations" className="btn" style={{ textDecoration: 'none', background: 'var(--background)', color: 'var(--blue-700)' }}>Organizaciones</a>
                <a href="/questionnaires" className="btn" style={{ textDecoration: 'none', background: 'var(--background)', color: 'var(--blue-700)' }}>Catálogo de Formularios</a>
                <a href="/evaluations" className="btn" style={{ textDecoration: 'none', background: 'var(--background)', color: 'var(--blue-700)' }}>Evaluaciones</a>
                <a href="/reports" className="btn" style={{ textDecoration: 'none', background: 'var(--background)', color: 'var(--blue-700)' }}>Reportes Ejecutivos</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;
