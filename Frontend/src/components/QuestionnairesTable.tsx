import React, { useEffect, useState, useMemo } from 'react';
import dataService from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';
import QuestionsTable from './QuestionsTable';
import QuestionnairePreviewModal from './QuestionnairePreviewModal';
import editIcon from '../images/edit.svg';
import Switch from './Switch';

type Q = { id: string; name: string; dimensions: number; active: boolean };

type Props = { mode?: 'admin' | 'evaluator' };

const QuestionnairesTable: React.FC<Props> = ({ mode = 'admin' }) => {
  const [rows, setRows] = useState<Q[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dimFilter, setDimFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => window.innerWidth < 768 ? 5 : 10);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);
  const [questionsForId, setQuestionsForId] = useState<string | null>(null);
  const [previewQ, setPreviewQ] = useState<Q | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = await dataService.getQuestionnaires();
    setRows(qs as Q[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dimFilter, pageSize]);

  const dims = useMemo(() => Array.from(new Set(rows.map(r => r.dimensions))).sort((a,b) => a - b), [rows]);

  const filtered = rows.filter(r => {
    if (statusFilter !== '') {
      const isActive = statusFilter === 'true';
      if (r.active !== isActive) return false;
    }
    if (dimFilter && r.dimensions !== Number(dimFilter)) return false;
    return r.name.toLowerCase().includes(query.toLowerCase());
  });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      <h2 style={{ marginTop: 0 }}>{mode === 'evaluator' ? 'Mis Formularios' : 'Formularios'}</h2>
      {mode === 'admin' && (
        <QuestionnaireForm open={openForm} initial={editing || undefined} onClose={() => { setOpenForm(false); setEditing(null); }} onSaved={handleSaved} saveFn={handleSave} />
      )}
      <QuestionnairePreviewModal open={!!previewQ} onClose={() => setPreviewQ(null)} questionnaire={previewQ} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input placeholder="Buscar por nombre..." value={query} onChange={e => setQuery(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', flex: '1 1 200px' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <select value={dimFilter} onChange={e => setDimFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todas las dimensiones</option>
          {dims.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {mode === 'admin' && (
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nuevo formulario</button>
          </div>
        )}
      </div>

      <div className="table-responsive-container">
        <table className="table-responsive">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dimensiones</th>
              <th>Estado</th>
              <th>Acciones</th>
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
                    {mode === 'evaluator' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setPreviewQ(r)}
                        title="Vista previa del formulario"
                      >
                        👁 Vista previa
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => setQuestionsForId(r.id)}>
                          Preguntas
                        </button>
                        <button type="button" className="btn btn-icon" onClick={() => { setEditing(r); setOpenForm(true); }} title="Editar">
                          <img src={editIcon} alt="Editar" width={18} height={18} />
                        </button>
                        <Switch
                          checked={!!r.active}
                          confirmOnDisable={true}
                          confirmTitle="Desactivar formulario"
                          confirmMessage="¿Confirmas que deseas desactivar este formulario?"
                          confirmText="Desactivar"
                          onChange={async (next) => {
                            if (next !== !!r.active) {
                              await handleToggle(r.id);
                            }
                          }}
                          ariaLabel={r.active ? 'Desactivar formulario' : 'Activar formulario'}
                        />
                      </>
                    )}
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
