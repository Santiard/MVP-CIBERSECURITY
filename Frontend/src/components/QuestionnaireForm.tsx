import React, { useEffect, useState } from 'react';
import { useAlert } from './alerts/AlertProvider';

type Props = {
  open: boolean;
  initial?: { id?: string; name?: string; description?: string; dimensions?: number; active?: boolean };
  onClose: () => void;
  onSaved: () => void;
  saveFn: (payload: { name: string; description: string; dimensions: number; active: boolean }) => Promise<any>;
};

const QuestionnaireForm: React.FC<Props> = ({ open, initial, onClose, onSaved, saveFn }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dimensions, setDimensions] = useState(initial?.dimensions ?? 3);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setDimensions(initial?.dimensions ?? 3);
      setActive(initial?.active ?? true);
    }
  }, [open, initial]);

  if (!open) return null;

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
      await saveFn({ name: name.trim(), description: description.trim(), dimensions, active });
      showAlert({
        type: 'success',
        title: 'Exito',
        message: initial?.id ? 'Cuestionario actualizado correctamente.' : 'Cuestionario creado correctamente.',
      });
      onSaved();
      onClose();
    } catch {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el cuestionario.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)' }}>
      <form noValidate onSubmit={submit} style={{ width: 520, background: 'var(--surface)', padding: 20, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>{initial?.id ? 'Editar cuestionario' : 'Nuevo cuestionario'}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 8 }}>* Campos obligatorios</p>
        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Nombre *</label>
        <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Descripción *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box', minHeight: 80, fontFamily: 'inherit', resize: 'none' }} />

        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Dimensiones *</label>
        <input type="number" value={dimensions} onChange={e => setDimensions(Number(e.target.value))} min={1} max={20} required style={{ width: 120, padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Activo
          </label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;
