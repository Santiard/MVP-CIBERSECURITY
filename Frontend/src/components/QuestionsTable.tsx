import React, { useCallback, useEffect, useState } from "react";
import dataService, { type Question } from "../services/dataService";
import QuestionForm from "./QuestionForm";

type Props = {
  controlId: number;
  questionnaireName?: string;
};

const QuestionsTable: React.FC<Props> = ({ controlId, questionnaireName }) => {
  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = await dataService.getQuestionsByControl(String(controlId));
      setRows(qs);
    } finally {
      setLoading(false);
    }
  }, [controlId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta pregunta?")) return;
    await dataService.deleteQuestion(id);
    await load();
  };

  return (
    <div className="card" style={{ marginTop: 16, border: "1px solid var(--border)" }}>
      <h3 style={{ marginTop: 0 }}>
        Preguntas{questionnaireName ? ` · ${questionnaireName}` : ""}{" "}
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>(control #{controlId})</span>
      </h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
        Estas preguntas se usan en el flujo de evaluación (paso cuestionario) para este cuestionario.
      </p>
      <QuestionForm
        open={openForm}
        initial={editing ?? undefined}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSaved={() => void load()}
        controlId={controlId}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          Nueva pregunta
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              <th style={{ padding: "12px 8px" }}>Texto</th>
              <th style={{ padding: "12px 8px" }}>Peso</th>
              <th style={{ padding: "12px 8px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} style={{ padding: 12 }}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 12, color: "var(--muted)" }}>
                  No hay preguntas. Cree la primera con el botón de arriba.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.text}</td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.peso ?? "—"}</td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setEditing(r);
                        setOpenForm(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ marginLeft: 8 }}
                      onClick={() => void handleDelete(r.id)}
                    >
                      Eliminar
                    </button>
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
