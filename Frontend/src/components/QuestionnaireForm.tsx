import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  initial?: { id?: string; name?: string; dimensions?: number; active?: boolean };
  onClose: () => void;
  onSaved: () => void;
  saveFn: (payload: { name: string; dimensions: number; active: boolean }) => Promise<any>;
};

const QuestionnaireForm: React.FC<Props> = ({ open, initial, onClose, onSaved, saveFn }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [dimensions, setDimensions] = useState(initial?.dimensions ?? 3);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDimensions(initial?.dimensions ?? 3);
      setActive(initial?.active ?? true);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveFn({ name, dimensions, active });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)' }}>
      <form onSubmit={submit} style={{ width: 520, background: 'var(--surface)', padding: 20, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>{initial?.id ? 'Editar cuestionario' : 'Nuevo cuestionario'}</h3>
        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Dimensiones</label>
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
