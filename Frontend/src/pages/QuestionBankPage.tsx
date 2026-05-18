import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAlert } from '../components/alerts/AlertProvider';
import ConfirmModal from '../components/modal/ConfirmModal';
import questionBankApi, { type BankQuestion } from '../services/questionBankApi';
import dataService from '../services/dataService';
import editIcon from '../images/edit.svg';
import deleteIcon from '../images/icons8-basura-llena(1).svg';

type FormEntry = { id: string; name: string };

const QuestionBankPage: React.FC = () => {
  const { showAlert } = useAlert();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dimFilter, setDimFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<BankQuestion | null>(null);
  const [formText, setFormText] = useState('');
  const [formDim, setFormDim] = useState('');
  const [formPeso, setFormPeso] = useState(1);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<BankQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [qs, qstnnrs] = await Promise.all([
        questionBankApi.list(),
        dataService.getQuestionnaires(),
      ]);
      setQuestions(qs);
      setForms((qstnnrs as FormEntry[]).map((q: any) => ({ id: String(q.id), name: q.name })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dimensions = useMemo(() =>
    Array.from(new Set(questions.map(q => q.dimension).filter(Boolean))).sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (dimFilter && q.dimension !== dimFilter) return false;
      if (formFilter && !q.linkedControls.includes(Number(formFilter))) return false;
      return true;
    });
  }, [questions, dimFilter, formFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [dimFilter, formFilter]);

  const openCreate = () => {
    setEditing(null);
    setFormText('');
    setFormDim('');
    setFormPeso(1);
    setOpenForm(true);
  };

  const openEdit = (q: BankQuestion) => {
    setEditing(q);
    setFormText(q.text);
    setFormDim(q.dimension);
    setFormPeso(q.peso);
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) { showAlert({ type: 'warning', title: 'Advertencia', message: 'El texto es obligatorio.' }); return; }
    if (!formDim.trim()) { showAlert({ type: 'warning', title: 'Advertencia', message: 'La dimensión es obligatoria.' }); return; }
    setSaving(true);
    try {
      if (editing) {
        await questionBankApi.update(editing.id, { text: formText.trim(), dimension: formDim.trim(), peso: formPeso });
        showAlert({ type: 'success', title: 'Éxito', message: 'Pregunta actualizada. El cambio se refleja en todos los formularios que la usan.' });
      } else {
        await questionBankApi.create({ text: formText.trim(), dimension: formDim.trim(), peso: formPeso });
        showAlert({ type: 'success', title: 'Éxito', message: 'Pregunta creada en el banco.' });
      }
      setOpenForm(false);
      await load();
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await questionBankApi.delete(deleting.id);
      showAlert({ type: 'success', title: 'Eliminada', message: 'Pregunta eliminada del banco.' });
      setDeleting(null);
      await load();
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Error al eliminar.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Banco de Preguntas</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
              Preguntas reutilizables que pueden vincularse a múltiples formularios. Al editar una pregunta aquí, el cambio se refleja en todos los formularios que la usan.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva pregunta</button>
        </div>

        <div className="card">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <select value={dimFilter} onChange={e => setDimFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 160px' }}>
              <option value="">Todas las dimensiones</option>
              {dimensions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={formFilter} onChange={e => setFormFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 200px' }}>
              <option value="">Todos los formularios</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="table-responsive-container">
            <table className="table-responsive">
              <thead>
                <tr>
                  <th>Texto de la pregunta</th>
                  <th>Dimensión</th>
                  <th>Peso</th>
                  <th>Formularios vinculados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Cargando...</td></tr>}
                {!loading && visible.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No hay preguntas en el banco.</td></tr>
                )}
                {!loading && visible.map(q => (
                  <tr key={q.id}>
                    <td style={{ textAlign: 'left', maxWidth: 360 }}>{q.text}</td>
                    <td style={{ textAlign: 'center' }}>
                      {q.dimension ? (
                        <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
                          {q.dimension}
                        </span>
                      ) : <span style={{ color: 'var(--muted)', fontSize: 12 }}>Sin dimensión</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{q.peso}</td>
                    <td style={{ textAlign: 'center' }}>
                      {q.linkedControls.length === 0
                        ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>Sin vincular</span>
                        : <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', fontWeight: 600, fontSize: 12 }}>
                            {q.linkedControls.length} formulario{q.linkedControls.length !== 1 ? 's' : ''}
                          </span>
                      }
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button className="btn btn-icon" onClick={() => openEdit(q)} title="Editar">
                          <img src={editIcon} alt="Editar" width={18} height={18} />
                        </button>
                        <button className="btn btn-icon" onClick={() => setDeleting(q)} title="Eliminar">
                          <img src={deleteIcon} alt="Eliminar" width={18} height={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
              <span style={{ padding: '6px 12px', fontSize: 13 }}>{safePage}/{pages}</span>
              <button className="btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePage >= pages}>Next</button>
            </div>
          )}
        </div>

        {/* Create / Edit modal */}
        {openForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <form onSubmit={e => void handleSave(e)}
              style={{ width: 480, background: 'var(--surface)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-md)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>{editing ? 'Editar pregunta' : 'Nueva pregunta del banco'}</h3>
              {editing && (
                <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--warning, #f59e0b)', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '8px 12px' }}>
                  ⚠️ Editar esta pregunta actualizará automáticamente todos los formularios que la usan.
                </p>
              )}
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 12 }}>* Campos obligatorios</p>

              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Texto de la pregunta *</label>
              <textarea value={formText} onChange={e => setFormText(e.target.value)} rows={3} required
                placeholder="Escribe la pregunta..."
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box', resize: 'vertical', fontSize: 14 }} />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 12, marginBottom: 4 }}>Dimensión *</label>
              <input value={formDim} onChange={e => setFormDim(e.target.value)} required
                placeholder="Ej: Confidencialidad, Integridad, Disponibilidad..."
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 12, marginBottom: 4 }}>Peso *</label>
              <input type="number" value={formPeso} onChange={e => setFormPeso(Number(e.target.value))}
                min={0.1} max={10} step={0.1} required
                style={{ width: 100, padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button type="button" className="btn" onClick={() => setOpenForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear pregunta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete confirm */}
        <ConfirmModal
          open={!!deleting}
          title="Eliminar pregunta"
          message={`¿Confirmas que deseas eliminar "${deleting?.text?.slice(0, 60)}..."? Se desvinculará de todos los formularios que la usan.`}
          confirmText="Eliminar"
          loading={deleteLoading}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </Layout>
  );
};

export default QuestionBankPage;
