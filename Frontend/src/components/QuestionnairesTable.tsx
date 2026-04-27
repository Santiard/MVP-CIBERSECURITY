import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';
import QuestionsTable from './QuestionsTable';

type Q = { id: string; name: string; dimensions: number; active: boolean };

const QuestionnairesTable: React.FC = () => {
  const [rows, setRows] = useState<Q[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);
  const [questionsForId, setQuestionsForId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = await dataService.getQuestionnaires();
    setRows(qs as Q[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

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
            {!loading && visibleRows.map(r => (
              <React.Fragment key={r.id}>
                <tr>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.dimensions}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ padding: '6px 10px', borderRadius: 9999, background: r.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)', color: r.active ? 'var(--success)' : 'var(--danger)', fontWeight:700 }}>{r.active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => setQuestionsForId((cur) => (cur === r.id ? null : r.id))}>
                      {questionsForId === r.id ? 'Ocultar preguntas' : 'Preguntas'}
                    </button>
                    <button type="button" className="btn" onClick={() => { setEditing(r); setOpenForm(true); }}>Editar</button>
                    <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={() => handleToggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
                {questionsForId === r.id && (
                  <tr>
                    <td colSpan={4} style={{ padding: 0, borderTop: '1px solid var(--border)', background: 'var(--surface-muted, rgba(0,0,0,0.02))' }}>
                      <div style={{ padding: '8px 12px 16px' }}>
                        <QuestionsTable controlId={Number(r.id)} questionnaireName={r.name} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Mostrando {visibleRows.length} de {rows.length} cuestionarios</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Filas</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
          <span style={{ margin: '0 4px', minWidth: 42, textAlign: 'center' }}>{safePage}/{pages}</span>
          <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairesTable;
