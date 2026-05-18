import React, { useEffect, useState, useMemo } from 'react';
import { useAlert } from './alerts/AlertProvider';
import questionBankApi, { type BankQuestion } from '../services/questionBankApi';
import QuestionForm from './QuestionForm';

type Props = {
  open: boolean;
  initial?: { id?: string; name?: string; description?: string; dimensions?: number; active?: boolean; confidencialidad?: boolean; integridad?: boolean; disponibilidad?: boolean; rec_alta?: string; rec_media?: string; rec_baja?: string };
  onClose: () => void;
  onSaved: (result?: any) => void;
  saveFn: (payload: { name: string; description: string; dimensions: number; active: boolean; confidencialidad: boolean; integridad: boolean; disponibilidad: boolean; rec_alta: string; rec_media: string; rec_baja: string }) => Promise<any>;
};

const QuestionnaireForm: React.FC<Props> = ({ open, initial, onClose, onSaved, saveFn }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState(3);
  const [active, setActive] = useState(true);
  const [conf, setConf] = useState(false);
  const [integ, setInteg] = useState(false);
  const [disp, setDisp] = useState(false);

  const [recAlta, setRecAlta] = useState('');
  const [recMedia, setRecMedia] = useState('');
  const [recBaja, setRecBaja] = useState('');
  
  // Transfer list states
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingBank, setLoadingBank] = useState(false);

  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  const [openNewQuestion, setOpenNewQuestion] = useState(false);
  
  // Search filters
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');

  const loadBank = async (controlIdToSelect?: string) => {
    setLoadingBank(true);
    try {
      const qs = await questionBankApi.list();
      setBankQuestions(qs);
      
      if (controlIdToSelect) {
        const idNum = Number(controlIdToSelect);
        const sel = new Set<string>();
        for (const q of qs) {
          if (q.linkedControls.includes(idNum)) {
            sel.add(q.id);
          }
        }
        setSelectedIds(sel);
      } else {
        // If creating a new form, keep whatever the user has manually selected
        // However, if we just created a new question (via QuestionForm), we might want to automatically select it.
        // That will be handled by onSavedQuestion.
      }
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo cargar el banco de preguntas.' });
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setDimensions(initial?.dimensions ?? 3);
      setActive(initial?.active ?? true);
      setConf(initial?.confidencialidad ?? false);
      setInteg(initial?.integridad ?? false);
      setDisp(initial?.disponibilidad ?? false);
      setRecAlta(initial?.rec_alta ?? '');
      setRecMedia(initial?.rec_media ?? '');
      setRecBaja(initial?.rec_baja ?? '');
      
      setSelectedIds(new Set());
      void loadBank(initial?.id);
    } else {
      setLeftSearch('');
      setRightSearch('');
    }
  }, [open, initial]);

  const handleSavedQuestion = async (createdId?: string) => {
    await loadBank(initial?.id); // Refresh bank to get the new question
    if (createdId) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.add(createdId);
        return next;
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    if (!name.trim()) missingFields.push('Nombre');
    if (!description.trim()) missingFields.push('Descripción');
    if (!Number.isFinite(dimensions) || dimensions < 1) missingFields.push('Dimensiones');
    if (missingFields.length > 0) {
      showAlert({
        type: 'warning',
        title: 'Advertencia',
        message: `Faltan campos obligatorios: ${missingFields.join(', ')}.`,
      });
      return;
    }

    setSaving(true);
    try {
      const result = await saveFn({ 
        name: name.trim(), description: description.trim(), dimensions, active, 
        confidencialidad: conf, integridad: integ, disponibilidad: disp,
        rec_alta: recAlta.trim(), rec_media: recMedia.trim(), rec_baja: recBaja.trim()
      });
      
      const controlIdNum = Number(result.id || initial?.id);
      
      if (controlIdNum) {
        // Compute diff for questions
        const linkPromises: Promise<any>[] = [];
        for (const q of bankQuestions) {
          const wasSelected = q.linkedControls.includes(controlIdNum);
          const isSelected = selectedIds.has(q.id);
          
          if (isSelected && !wasSelected) {
            linkPromises.push(questionBankApi.linkToControl(q.id, controlIdNum).catch(() => {}));
          } else if (!isSelected && wasSelected) {
            linkPromises.push(questionBankApi.unlinkFromControl(q.id, controlIdNum).catch(() => {}));
          }
        }
        await Promise.all(linkPromises);
      }

      showAlert({
        type: 'success',
        title: 'Éxito',
        message: initial?.id ? 'Formulario actualizado correctamente.' : 'Formulario creado correctamente.',
      });
      onSaved(result);
      onClose();
    } catch {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el formulario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string, select: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (select) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const availableQuestions = useMemo(() => {
    return bankQuestions
      .filter(q => !selectedIds.has(q.id))
      .filter(q => q.text.toLowerCase().includes(leftSearch.toLowerCase()));
  }, [bankQuestions, selectedIds, leftSearch]);

  const assignedQuestions = useMemo(() => {
    return bankQuestions
      .filter(q => selectedIds.has(q.id))
      .filter(q => q.text.toLowerCase().includes(rightSearch.toLowerCase()));
  }, [bankQuestions, selectedIds, rightSearch]);

  const renderGroupedList = (list: BankQuestion[], action: 'add' | 'remove') => {
    const byDim = list.reduce<Record<string, BankQuestion[]>>((acc, q) => {
      const dim = q.dimension || 'Sin dimensión';
      if (!acc[dim]) acc[dim] = [];
      acc[dim].push(q);
      return acc;
    }, {});

    const keys = Object.keys(byDim).sort();
    if (keys.length === 0) return <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)' }}>No hay preguntas.</div>;

    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {keys.map(dim => (
          <div key={dim}>
            <div style={{ fontSize: 13, fontWeight: 700, padding: '8px 12px', background: 'var(--surface-muted, rgba(25,118,210,0.06))', borderRadius: 6, marginBottom: 4 }}>
              {dim} ({byDim[dim].length})
            </div>
            {byDim[dim].map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => toggleSelect(q.id, action === 'add')}
                  style={{
                    minWidth: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: action === 'add' ? 'var(--surface-muted, rgba(25,118,210,0.08))' : 'rgba(239,68,68,0.1)',
                    color: action === 'add' ? 'var(--primary)' : 'var(--danger)',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14
                  }}
                  title={action === 'add' ? 'Asignar al formulario' : 'Quitar del formulario'}
                >
                  {action === 'add' ? '+' : '-'}
                </button>
                <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                  {q.text}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Peso: {q.peso}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)' }}>
      
      {/* Modal para crear pregunta (se abre SOBRE este modal) */}
      <QuestionForm
        open={openNewQuestion}
        onClose={() => setOpenNewQuestion(false)}
        onSaved={handleSavedQuestion}
      />

      <form noValidate onSubmit={submit} style={{ width: '95vw', maxWidth: 1100, maxHeight: '95vh', background: 'var(--surface)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{initial?.id ? 'Editar Formulario' : 'Nuevo Formulario'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)' }}>&times;</button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Top Section: Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Nombre *</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Dimensiones *</label>
              <input type="number" value={dimensions} onChange={e => setDimensions(Number(e.target.value))} min={1} max={20} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Descripción *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box', minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                Formulario Activo
              </label>
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24, padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Dimensiones Afectadas (CIA)</strong>
                <div style={{ display: 'flex', gap: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={conf} onChange={e => setConf(e.target.checked)} />
                    Confidencialidad (C)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={integ} onChange={e => setInteg(e.target.checked)} />
                    Integridad (I)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={disp} onChange={e => setDisp(e.target.checked)} />
                    Disponibilidad (D)
                  </label>
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'var(--background)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Recomendaciones para el Plan de Mejora</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Define qué sugerirá el sistema según el puntaje obtenido por la organización en este formulario.</p>
              
              <div style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>Riesgo Crítico (Puntaje &lt; 40%)</label>
                <textarea className="input" rows={2} value={recAlta} onChange={e => setRecAlta(e.target.value)} placeholder="Ej: Establecer políticas formales. Riesgo de operación sin lineamientos..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>Riesgo Moderado (Puntaje &lt; 70%)</label>
                <textarea className="input" rows={2} value={recMedia} onChange={e => setRecMedia(e.target.value)} placeholder="Ej: Revisar y actualizar las políticas existentes..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>Riesgo Bajo / Mantenimiento (Puntaje &ge; 70%)</label>
                <textarea className="input" rows={2} value={recBaja} onChange={e => setRecBaja(e.target.value)} placeholder="Ej: Mantener revisiones periódicas y auditorías..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Bottom Section: Transfer List */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Asignación de Preguntas</h3>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                <strong>{selectedIds.size}</strong> preguntas asignadas
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flex: 1, alignItems: 'stretch' }}>
              
              {/* Left Column: Bank */}
              <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--surface-light)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Banco de Preguntas</span>
                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setOpenNewQuestion(true)}>
                    + Crear en banco
                  </button>
                </div>
                <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                  <input placeholder="Buscar en el banco..." value={leftSearch} onChange={e => setLeftSearch(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', boxSizing: 'border-box', fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                  {loadingBank ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Cargando banco...</div> : renderGroupedList(availableQuestions, 'add')}
                </div>
              </div>

              {/* Right Column: Assigned */}
              <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--surface-light)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Preguntas del Formulario</span>
                </div>
                <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                  <input placeholder="Buscar en asignadas..." value={rightSearch} onChange={e => setRightSearch(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', boxSizing: 'border-box', fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                  {renderGroupedList(assignedQuestions, 'remove')}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--surface-light)' }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || loadingBank}>
            {saving ? 'Guardando...' : initial?.id ? 'Guardar Cambios' : 'Crear Formulario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;
