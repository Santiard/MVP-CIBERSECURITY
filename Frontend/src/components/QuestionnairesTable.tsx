import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';
import QuestionsTable from './QuestionsTable';
import editIcon from '../images/edit.svg';

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

  const handleSave = async (payload: { name: string; description: string; dimensions: number; active: boolean }) => {
    if (editing?.id) {
      return await dataService.updateQuestionnaire(editing.id, payload as any);
    } else {
      return await dataService.createQuestionnaire(payload as any);
    }
  };

  const handleSaved = async (result?: Q) => {
    await load();
    if (result && !editing?.id) {
      setSelectedQuestionnaireForModal(result);
      setQuestionsModalOpen(true);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Formularios</h2>
      <QuestionnaireForm open={openForm} initial={editing || undefined} onClose={() => { setOpenForm(false); setEditing(null); }} onSaved={handleSaved} saveFn={handleSave} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: 'var(--muted)' }}>Listado de formularios registrados</div>
        <div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nuevo formulario</button>
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
                    <button type="button" className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => setQuestionsForId(r.id)}>
                      Preguntas
                    </button>
                    <button type="button" className="btn btn-icon" onClick={() => { setEditing(r); setOpenForm(true); }} title="Editar">
                      <img src={editIcon} alt="Editar" width={18} height={18} />
                    </button>
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', marginLeft: 16 }} title={r.active ? 'Desactivar' : 'Activar'}>
                      <input type="checkbox" checked={r.active} onChange={() => handleToggle(r.id)} style={{ display: 'none' }} />
                      <div style={{
                        width: 36,
                        height: 20,
                        background: r.active ? 'var(--blue-500)' : 'var(--gray-400)',
                        borderRadius: 20,
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: 16,
                          height: 16,
                          background: '#fff',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: 2,
                          left: r.active ? 18 : 2,
                          transition: 'left 0.2s'
                        }} />
                      </div>
                    </label>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)' }}>Mostrando {visibleRows.length} de {rows.length} formularios</div>
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
      )}
      {questionsForId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)' }}>
          <div style={{ width: '80%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-light, #FFFFFF)', padding: 20, borderRadius: 12, position: 'relative' }}>
            <button onClick={() => setQuestionsForId(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)' }}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>Gestión de Preguntas</h3>
            {(() => {
              const r = rows.find(x => x.id === questionsForId);
              if (!r) return null;
              return <QuestionsTable controlId={Number(r.id)} questionnaireName={r.name} />;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnairesTable;
