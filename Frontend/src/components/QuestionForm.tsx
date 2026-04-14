import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';
import { Question } from './QuestionsTable';

type Props = {
  open: boolean;
  initial?: Question;
  onClose: () => void;
  onSaved: () => void;
  controlId: number;
};

const QuestionForm: React.FC<Props> = ({ open, initial, onClose, onSaved, controlId }) => {
  const [texto, setTexto] = useState(initial?.texto ?? '');
  const [peso, setPeso] = useState(initial?.peso ?? 1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTexto(initial?.texto ?? '');
      setPeso(initial?.peso ?? 1);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id_pregunta) {
        await dataService.updateQuestion(initial.id_pregunta, { texto, peso });
      } else {
        await dataService.createQuestion({ texto, peso, id_control: controlId });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)' }}>
      <form onSubmit={submit} style={{ width: 420, background: 'var(--surface)', padding: 20, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>{initial?.id_pregunta ? 'Editar pregunta' : 'Nueva pregunta'}</h3>
        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Texto</label>
        <input value={texto} onChange={e => setTexto(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />
        <label style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Peso</label>
        <input type="number" value={peso} onChange={e => setPeso(Number(e.target.value))} min={1} max={10} required style={{ width: 120, padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }} />
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
