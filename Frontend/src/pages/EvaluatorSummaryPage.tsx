import React, { useEffect, useState } from "react";
import { listEvaluations, type EvaluationApiRow } from "../services/evaluationApi";
import dataService from "../services/dataService";
import { Link } from "react-router-dom";

type Org = { id_empresa: number; nombre: string };

const EvaluatorSummaryPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationApiRow[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [evs, orgData] = await Promise.all([
          listEvaluations(),
          dataService.getOrgs() as Promise<Org[]>
        ]);
        setEvaluations(evs);
        setOrgs(orgData);
      } catch {
        // ignorar errores
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const pendingCount = evaluations.filter(e => e.estado === 'pendiente' || !e.estado).length;
  const inProgressCount = evaluations.filter(e => e.estado === 'en progreso').length;
  const finishedCount = evaluations.filter(e => e.estado === 'finalizado').length;

  const orgNames = new Map<number, string>();
  orgs.forEach(o => orgNames.set(o.id_empresa, o.nombre));

  const assignedOrgs = Array.from(new Set(evaluations.map(e => e.id_empresa)));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <h1 style={{ marginTop: 0 }}>Mis Asignaciones</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Resumen de las evaluaciones y organizaciones que tienes bajo tu supervisión.
      </p>

      {loading ? (
        <p>Cargando información...</p>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 24, textAlign: 'center', borderTop: '4px solid var(--blue-500)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--blue-700)' }}>{assignedOrgs.length}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>Organizaciones asignadas</div>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center', borderTop: '4px solid var(--orange-500)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--orange-700)' }}>{pendingCount}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>Evaluaciones pendientes</div>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center', borderTop: '4px solid var(--blue-400)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--blue-600)' }}>{inProgressCount}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>En progreso</div>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center', borderTop: '4px solid var(--green-500)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--green-700)' }}>{finishedCount}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>Finalizadas</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Organizaciones a cargo</h3>
            {assignedOrgs.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No tienes organizaciones asignadas actualmente.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {assignedOrgs.map(orgId => (
                  <li key={orgId} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>{orgNames.get(orgId) || `Organización #${orgId}`}</span>
                    <Link to={`/evaluations?empresa=${orgId}`} className="btn" style={{ textDecoration: 'none', fontSize: 13, padding: '6px 12px' }}>
                      Ver evaluaciones
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluatorSummaryPage;
