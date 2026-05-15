import React, { useEffect, useState } from 'react';
import Modal from './modal/Modal';
import dataService from '../services/dataService';
import { listEvaluations, EvaluationApiRow } from '../services/evaluationApi';

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };
type AppUser = { id: number; name: string; email: string; role: string; active?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  org: Org | null;
};

const OrganizationDetailsModal: React.FC<Props> = ({ open, onClose, org }) => {
  const [evaluations, setEvaluations] = useState<EvaluationApiRow[]>([]);
  const [evaluators, setEvaluators] = useState<AppUser[]>([]);
  const [relatedUsers, setRelatedUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !org) return;

    let cancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        const [allEvaluations, allUsersRes, orgMembers] = await Promise.all([
          listEvaluations(),
          dataService.getUsers().catch(() => []),
          dataService.listOrganizationUsers(org.id_empresa).catch(() => [])
        ]);

        if (cancelled) return;

        const allUsers = allUsersRes as AppUser[];

        // Filter evaluations for this org
        const orgEvaluations = allEvaluations.filter(e => e.id_empresa === org.id_empresa);
        setEvaluations(orgEvaluations);

        // Find evaluators assigned to these evaluations
        const evaluatorIds = Array.from(new Set(orgEvaluations.map(e => e.id_evaluador).filter(Boolean))) as number[];
        const orgEvaluators = evaluatorIds.map(id => allUsers.find(u => Number(u.id) === id)).filter(Boolean) as AppUser[];
        setEvaluators(orgEvaluators);

        // Find users related to this org
        const memberIds = orgMembers.map((m: any) => m.id_usuario);
        const orgUsers = memberIds.map((id: number) => allUsers.find(u => Number(u.id) === id)).filter(Boolean) as AppUser[];
        setRelatedUsers(orgUsers);

      } catch (error) {
        console.error("Failed to load organization details", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open, org]);

  if (!org) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Detalles de Organización: ${org.nombre}`} width="800px">
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>Cargando información...</div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Información General</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Nombre</div>
                <div style={{ fontWeight: 500 }}>{org.nombre}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>ID Empresa</div>
                <div style={{ fontWeight: 500 }}>{org.id_empresa}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Sector</div>
                <div style={{ fontWeight: 500 }}>{org.sector || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Tamaño</div>
                <div style={{ fontWeight: 500 }}>{org.tamano || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span>Evaluaciones</span>
                <span style={{ fontSize: 14, background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 999 }}>{evaluations.length}</span>
              </h3>
              {evaluations.length === 0 ? (
                <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>No hay evaluaciones registradas.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, display: 'grid', gap: 8 }}>
                  {evaluations.map(e => (
                    <li key={e.id_evaluacion}>
                      <strong>ID: {e.id_evaluacion}</strong> — <span style={{ textTransform: 'capitalize' }}>{e.estado}</span> 
                      <span style={{ color: 'var(--muted)', marginLeft: 8 }}>({e.fecha ? String(e.fecha).slice(0, 10) : 'Sin fecha'})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span>Evaluadores Asignados</span>
                <span style={{ fontSize: 14, background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 999 }}>{evaluators.length}</span>
              </h3>
              {evaluators.length === 0 ? (
                <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Ningún evaluador asignado.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, display: 'grid', gap: 8 }}>
                  {evaluators.map(u => (
                    <li key={u.id}>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>Usuarios de la Empresa</span>
              <span style={{ fontSize: 14, background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 999 }}>{relatedUsers.length}</span>
            </h3>
            {relatedUsers.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>No hay usuarios asociados a esta empresa.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: 'var(--muted)' }}>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>Nombre</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>Correo</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{u.name}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{u.email}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, background: u.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)', color: u.active ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OrganizationDetailsModal;
