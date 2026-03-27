import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';

type Q = { id: string; name: string; dimensions: number; active: boolean };

const QuestionnairesTable: React.FC = () => {
  const [rows, setRows] = useState<Q[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = await dataService.getQuestionnaires();
    setRows(qs as Q[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    await dataService.toggleQuestionnaireActive(id);
    await load();
  };

  const handleSave = async (payload: { name: string; dimensions: number; active: boolean }) => {
    if (editing?.id) {
      await dataService.updateQuestionnaire(editing.id, payload as any);
    } else {
      await dataService.createQuestionnaire(payload as any);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Cuestionarios</h2>
      <QuestionnaireForm open={openForm} initial={editing || undefined} onClose={() => { setOpenForm(false); setEditing(null); }} onSaved={load} saveFn={handleSave} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: 'var(--muted)' }}>Listado de cuestionarios registrados</div>
        <div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nuevo cuestionario</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '12px 8px' }}>Nombre</th>
              <th style={{ padding: '12px 8px' }}>Dimensiones</th>
              <th style={{ padding: '12px 8px' }}>Estado</th>
              <th style={{ padding: '12px 8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.dimensions}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ padding: '6px 10px', borderRadius: 9999, background: r.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)', color: r.active ? 'var(--success)' : 'var(--danger)', fontWeight:700 }}>{r.active ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn" onClick={() => { setEditing(r); setOpenForm(true); }}>Editar</button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleToggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionnairesTable;
