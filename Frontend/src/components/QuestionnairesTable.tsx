import React, { useEffect, useState } from 'react';
import dataService, { getDimensions, type Dimension } from '../services/dataService';
import QuestionnaireForm from './QuestionnaireForm';
import QuestionnairePreviewModal from './QuestionnairePreviewModal';
import editIcon from '../images/edit.svg';
import Switch from './Switch';

type Q = { id: string; name: string; description: string; active: boolean; roles_ids: number[] };

type Props = { mode?: 'admin' | 'evaluator' };

const QuestionnairesTable: React.FC<Props> = ({ mode = 'admin' }) => {
  const [rows, setRows] = useState<Q[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => (window.innerWidth < 768 ? 5 : 10));
  const [loading, setLoading] = useState(false);

  // Auto-generate Modal states
  const [openAutoModal, setOpenAutoModal] = useState(false);
  const [autoParams, setAutoParams] = useState({
    nombre: 'Formulario Autogenerado',
    descripcion: 'Formulario autogenerado desde catálogo ISO.',
    total_preguntas: 20,
    preguntas_por_dimension: 1,
    roles_ids: [] as number[],
    dimensiones_ids: [] as number[],
  });
  const [availableDimensions, setAvailableDimensions] = useState<Dimension[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id_rol: number; nombre: string }[]>([]);

  useEffect(() => {
    dataService.getRoles().then(setAvailableRoles).catch(console.error);
  }, []);

  useEffect(() => {
    if (openAutoModal) {
      dataService.getRoles().then(setAvailableRoles).catch(console.error);
      getDimensions().then(setAvailableDimensions).catch(console.error);
    }
  }, [openAutoModal]);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);
  const [previewQ, setPreviewQ] = useState<Q | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = await dataService.getQuestionnaires();
    setRows(qs as Q[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  const filtered = rows.filter((r) => {
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

  const handleSave = async (payload: { name: string; description: string; active: boolean; roles_ids: number[] }) => {
    if (editing?.id) {
      return await dataService.updateQuestionnaire(editing.id, payload as any);
    } else {
      return await dataService.createQuestionnaire(payload as any);
    }
  };

  const handleSaved = async () => {
    await load();
  };

  const handleAutoGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dataService.generateRandomQuestionnaire(autoParams);
      setOpenAutoModal(false);
      await load();
    } catch (err: any) {
      alert('Error al generar: ' + (err.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const roleMap = new Map(availableRoles.map((r) => [r.id_rol, r.nombre]));

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{mode === 'evaluator' ? 'Mis Formularios' : 'Formularios'}</h2>
      {mode === 'admin' && (
        <QuestionnaireForm
          open={openForm}
          initial={editing || undefined}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
          saveFn={handleSave}
        />
      )}
      <QuestionnairePreviewModal open={!!previewQ} onClose={() => setPreviewQ(null)} questionnaire={previewQ as any} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', flex: '1 1 200px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-light)',
            flex: '1 1 150px',
          }}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        {mode === 'admin' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => setOpenAutoModal(true)}
              title="Genera un formulario con al menos una pregunta por control ISO"
              disabled={loading}
            >
              Auto-generar (ISO)
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null);
                setOpenForm(true);
              }}
            >
              Nuevo formulario
            </button>
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
            {loading && (
              <tr>
                <td colSpan={4}>Cargando...</td>
              </tr>
            )}
            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted)' }}>
                  No hay registros todavía para mostrar.
                </td>
              </tr>
            )}
            {!loading &&
              visibleRows.map((r) => (
                <React.Fragment key={r.id}>
                  <tr>
                    <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                    <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {(r.roles_ids || []).map((rid) => (
                          <span
                            key={rid}
                            style={{
                              padding: '2px 6px',
                              fontSize: 11,
                              background: 'var(--surface-light)',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                            }}
                          >
                            {roleMap.get(rid) || `Rol #${rid}`}
                          </span>
                        ))}
                        {(!r.roles_ids || r.roles_ids.length === 0) && (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Todos</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                      <span
                        style={{
                          padding: '6px 10px',
                          borderRadius: 9999,
                          background: r.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)',
                          color: r.active ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 700,
                        }}
                      >
                        {r.active ? 'Activo' : 'Inactivo'}
                      </span>
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
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => {
                              setEditing(r);
                              setOpenForm(true);
                            }}
                            title="Editar"
                          >
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
          <div style={{ color: 'var(--muted)' }}>
            Mostrando {visibleRows.length} de {rows.length} formularios
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Filas</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
              Prev
            </button>
            <span style={{ margin: '0 4px', minWidth: 42, textAlign: 'center' }}>
              {safePage}/{pages}
            </span>
            <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages}>
              Next
            </button>
          </div>
        </div>
      )}
      {openAutoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2,6,23,0.45)',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--surface, #fff)',
              padding: 24,
              borderRadius: 12,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Configurar Formulario Autogenerado</h3>
            <form onSubmit={handleAutoGenerateSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nombre</label>
                <input
                  type="text"
                  required
                  value={autoParams.nombre}
                  onChange={(e) => setAutoParams({ ...autoParams, nombre: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Descripción</label>
                <textarea
                  required
                  value={autoParams.descripcion}
                  onChange={(e) => setAutoParams({ ...autoParams, descripcion: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                  rows={2}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Límite Total de Preguntas</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="500"
                    value={autoParams.total_preguntas}
                    onChange={(e) => setAutoParams({ ...autoParams, total_preguntas: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Preguntas por Dimensión ISO</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={autoParams.preguntas_por_dimension}
                    onChange={(e) =>
                      setAutoParams({ ...autoParams, preguntas_por_dimension: parseInt(e.target.value) || 1 })
                    }
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                  Tipo de Usuario (Roles / Escolaridad)
                </label>
                <div
                  style={{
                    border: '1px solid var(--border)',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    maxHeight: 120,
                    overflowY: 'auto',
                  }}
                >
                  {availableRoles
                    .filter((r) => !['admin', 'evaluator'].includes(r.nombre))
                    .map((rol) => (
                      <label key={rol.id_rol} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={autoParams.roles_ids.includes(rol.id_rol)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setAutoParams({ ...autoParams, roles_ids: [...autoParams.roles_ids, rol.id_rol] });
                            else
                              setAutoParams({
                                ...autoParams,
                                roles_ids: autoParams.roles_ids.filter((id) => id !== rol.id_rol),
                              });
                          }}
                        />
                        <span>{rol.nombre}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                  Dimensiones ISO a evaluar (Dejar vacío para todas)
                </label>
                <div
                  style={{
                    border: '1px solid var(--border)',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    maxHeight: 180,
                    overflowY: 'auto',
                    background: 'var(--surface-light)',
                  }}
                >
                  {availableDimensions.map((dim) => (
                    <label
                      key={dim.id_dimension}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        background: '#fff',
                        border: '1px solid var(--border)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoParams.dimensiones_ids.includes(dim.id_dimension)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setAutoParams({
                              ...autoParams,
                              dimensiones_ids: [...autoParams.dimensiones_ids, dim.id_dimension],
                            });
                          else
                            setAutoParams({
                              ...autoParams,
                              dimensiones_ids: autoParams.dimensiones_ids.filter((id) => id !== dim.id_dimension),
                            });
                        }}
                      />
                      {dim.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setOpenAutoModal(false)} className="btn">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Generando...' : 'Generar Formulario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnairesTable;
