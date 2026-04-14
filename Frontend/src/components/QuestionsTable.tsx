import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';

export type Question = {
  id_pregunta: number;
  texto: string;
  peso: number;
  id_control: number;
};

type Props = {
  controlId: number;
};

const QuestionsTable: React.FC<Props> = ({ controlId }) => {
  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const qs = await dataService.getQuestionsByControl(controlId);
    setRows(qs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [controlId]);

  const handleDelete = async (id_pregunta: number) => {
    if (!window.confirm('¿Eliminar pregunta?')) return;
    await dataService.deleteQuestion(id_pregunta);
    await load();
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>Preguntas del cuestionario</h3>
      <QuestionForm
        open={openForm}
        initial={editing || undefined}
        onClose={() => { setOpenForm(false); setEditing(null); }}
        onSaved={load}
        controlId={controlId}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nueva pregunta</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '12px 8px' }}>Texto</th>
              <th style={{ padding: '12px 8px' }}>Peso</th>
              <th style={{ padding: '12px 8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3}>Cargando...</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id_pregunta}>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.texto}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.peso}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn" onClick={() => { setEditing(r); setOpenForm(true); }}>Editar</button>
                  <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id_pregunta)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionsTable;

// QuestionForm component will be created below
import QuestionForm from './QuestionForm';
