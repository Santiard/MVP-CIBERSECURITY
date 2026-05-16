import React, { useEffect, useState } from 'react';
import Modal from './modal/Modal';
import dataService, { type Question } from '../services/dataService';

type Questionnaire = { id: string; name: string; dimensions: number; active: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  questionnaire: Questionnaire | null;
};

const QuestionnairePreviewModal: React.FC<Props> = ({ open, onClose, questionnaire }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !questionnaire) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const qs = await dataService.getQuestionsByControl(String(questionnaire.id));
        if (!cancelled) setQuestions(qs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, questionnaire]);

  if (!questionnaire) return null;

  // Group questions by dimension
  const byDimension = questions.reduce<Record<string, Question[]>>((acc, q) => {
    const dim = q.dimension || 'Sin dimensión';
    if (!acc[dim]) acc[dim] = [];
    acc[dim].push(q);
    return acc;
  }, {});
  const dimensionKeys = Object.keys(byDimension).sort();

  return (
    <Modal open={open} onClose={onClose} title={`Vista Previa: ${questionnaire.name}`} width="760px">
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Cargando preguntas...</div>
      ) : questions.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Este formulario no tiene preguntas registradas aún.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Header info */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            padding: '12px 16px',
            background: 'var(--surface-muted, rgba(25,118,210,0.06))',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total de preguntas</span>
              <span style={{ fontWeight: 700, fontSize: 20 }}>{questions.length}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Dimensiones</span>
              <span style={{ fontWeight: 700, fontSize: 20 }}>{questionnaire.dimensions}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Estado</span>
              <span style={{
                fontWeight: 700, fontSize: 14,
                color: questionnaire.active ? 'var(--success)' : 'var(--danger)',
              }}>
                {questionnaire.active ? '✔ Activo' : '✖ Inactivo'}
              </span>
            </div>
          </div>

          {/* Questions grouped by dimension */}
          {dimensionKeys.map((dim, dimIdx) => (
            <div key={dim} style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Dimension header */}
              <div style={{
                background: 'var(--btn-primary-bg)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'var(--white)',
                  fontWeight: 700, fontSize: 12,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{dimIdx + 1}</span>
                <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 14 }}>{dim}</span>
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.18)',
                  color: 'var(--white)',
                  borderRadius: 999, padding: '2px 10px', fontSize: 12,
                }}>
                  {byDimension[dim].length} pregunta{byDimension[dim].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Questions list */}
              <div style={{ display: 'grid', gap: 0 }}>
                {byDimension[dim]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((q, idx) => (
                    <div key={q.id} style={{
                      display: 'flex',
                      gap: 14,
                      padding: '14px 16px',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      alignItems: 'flex-start',
                    }}>
                      <span style={{
                        minWidth: 28, height: 28,
                        borderRadius: 8,
                        background: 'var(--surface-muted, rgba(25,118,210,0.06))',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                        fontWeight: 700, fontSize: 12,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)' }}>{q.text}</div>
                        {q.peso != null && (
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                            Peso: <strong>{q.peso}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar vista previa</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuestionnairePreviewModal;
