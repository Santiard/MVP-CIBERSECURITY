import React, { useEffect, useState, useMemo } from 'react';
import questionBankApi, { type BankQuestion } from '../services/questionBankApi';
import { useAlert } from './alerts/AlertProvider';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (question: BankQuestion) => Promise<void>;
  currentQuestionIds: string[]; // IDs de preguntas que ya están en el formulario
};

const QuestionBankModal: React.FC<Props> = ({ open, onClose, onSelect, currentQuestionIds }) => {
  const { showAlert } = useAlert();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dimFilter, setDimFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void load();
      setDimFilter('');
    }
  }, [open]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = await questionBankApi.list();
      setQuestions(qs);
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo cargar el banco de preguntas.' });
    } finally {
      setLoading(false);
    }
  };

  const dimensions = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.dimension).filter(Boolean))).sort();
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (dimFilter && q.dimension !== dimFilter) return false;
      return true;
    });
  }, [questions, dimFilter]);

  if (!open) return null;

  const handleSelect = async (q: BankQuestion) => {
    if (currentQuestionIds.includes(q.id)) {
      showAlert({ type: 'warning', title: 'Advertencia', message: 'Esta pregunta ya está en el formulario.' });
      return;
    }
    setSavingId(q.id);
    try {
      await onSelect(q);
      showAlert({ type: 'success', title: 'Agregada', message: 'Pregunta agregada al formulario.' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'Error al agregar la pregunta.' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ width: 700, maxWidth: '90vw', maxHeight: '90vh', background: 'var(--surface)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Agregar del Banco de Preguntas</h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <select 
            value={dimFilter} 
            onChange={e => setDimFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', width: '100%', maxWidth: 300 }}
          >
            <option value="">Todas las dimensiones</option>
            {dimensions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
          <table className="table-responsive" style={{ margin: 0 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
              <tr>
                <th>Texto</th>
                <th>Dimensión</th>
                <th style={{ width: 100 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Cargando...</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No hay preguntas disponibles.</td></tr>
              )}
              {!loading && filtered.map(q => {
                const isAdded = currentQuestionIds.includes(q.id);
                return (
                  <tr key={q.id}>
                    <td style={{ textAlign: 'left', fontSize: 13 }}>{q.text}</td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>{q.dimension || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isAdded ? (
                        <span style={{ fontSize: 12, color: 'var(--success)' }}>✔ Agregada</span>
                      ) : (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => void handleSelect(q)}
                          disabled={savingId === q.id}
                        >
                          {savingId === q.id ? '...' : 'Agregar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankModal;
