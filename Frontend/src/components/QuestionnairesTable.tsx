import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';
import QuestionnairePreviewModal from './QuestionnairePreviewModal';
import editIcon from '../images/edit.svg';
import Switch from './Switch';

type Q = { id: string; name: string; description: string; active: boolean; aplica_nivel_bajo: boolean; aplica_nivel_medio: boolean; aplica_nivel_alto: boolean };

type Props = { mode?: 'admin' | 'evaluator' };

const QuestionnairesTable: React.FC<Props> = ({ mode = 'admin' }) => {
  const [rows, setRows] = useState<Q[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => window.innerWidth < 768 ? 5 : 10);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);
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
  }, [query, statusFilter, pageSize]);

  const filtered = rows.filter(r => {
    if (statusFilter !== '') {
      const isActive = statusFilter === 'true';
      if (r.active !== isActive) return false;
    }
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

  const handleSave = async (payload: { name: string; description: string; active: boolean; aplica_nivel_bajo: boolean; aplica_nivel_medio: boolean; aplica_nivel_alto: boolean }) => {
    if (editing?.id) {
      return await dataService.updateQuestionnaire(editing.id, payload as any);
    } else {
      return await dataService.createQuestionnaire(payload as any);
    }
  };

  const handleSaved = async () => {
    await load();
  };

  const handleAutoGenerate = async () => {
    if (!window.confirm("Se generará un formulario aleatorio que cubrirá al menos un control de cada dominio ISO. ¿Continuar?")) return;
    setLoading(true);
    try {
      await dataService.generateRandomQuestionnaire({
        nombre: `Auditoría Aleatoria ${new Date().toLocaleDateString()}`,
        descripcion: "Generado automáticamente asegurando cobertura ISO 27001",
        total_preguntas: 30,
        aplica_nivel_bajo: false,
        aplica_nivel_medio: true,
        aplica_nivel_alto: true
      });
      await load();
    } catch (err: any) {
      alert("Error al generar: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{mode === 'evaluator' ? 'Mis Formularios' : 'Formularios'}</h2>
      {mode === 'admin' && (
        <QuestionnaireForm open={openForm} initial={editing || undefined} onClose={() => { setOpenForm(false); setEditing(null); }} onSaved={handleSaved} saveFn={handleSave} />
      )}
      <QuestionnairePreviewModal open={!!previewQ} onClose={() => setPreviewQ(null)} questionnaire={previewQ as any} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input placeholder="Buscar por nombre..." value={query} onChange={e => setQuery(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', flex: '1 1 200px' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        {mode === 'admin' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn" onClick={handleAutoGenerate} title="Genera un formulario con al menos una pregunta por control ISO" disabled={loading}>
              Auto-generar (ISO)
            </button>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nuevo formulario</button>
          </div>
        )}
      </div>

      <div className="table-responsive-container">
        <table className="table-responsive">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Niveles Aplica</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted)' }}>
                  No hay registros todavía para mostrar.
                </td>
              </tr>
            )}
            {!loading && visibleRows.map(r => (
              <React.Fragment key={r.id}>
                <tr>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {r.aplica_nivel_bajo && <span style={{ padding: '2px 6px', fontSize: 11, background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 4 }}>Bajo</span>}
                      {r.aplica_nivel_medio && <span style={{ padding: '2px 6px', fontSize: 11, background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 4 }}>Medio</span>}
                      {r.aplica_nivel_alto && <span style={{ padding: '2px 6px', fontSize: 11, background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 4 }}>Alto</span>}
                    </div>
                  </td>
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
                        Vista previa
                      </button>
                    ) : (
                      <>
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
    </div>
  );
};

export default QuestionnairesTable;
