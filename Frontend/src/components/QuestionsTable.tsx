import React, { useCallback, useEffect, useState, useMemo } from "react";
import questionBankApi, { type BankQuestion } from "../services/questionBankApi";
import QuestionForm from "./QuestionForm";
import { useAlert } from "./alerts/AlertProvider";
import Switch from "./Switch";

type Props = {
  controlId: number;
  questionnaireName?: string;
};

const QuestionsTable: React.FC<Props> = ({ controlId, questionnaireName }) => {
  const { showAlert } = useAlert();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = await questionBankApi.list();
      setQuestions(qs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (q: BankQuestion, isLinked: boolean) => {
    setTogglingId(q.id);
    try {
      if (isLinked) {
        // Was linked, now unlink
        await questionBankApi.unlinkFromControl(q.id, controlId);
      } else {
        // Was unlinked, now link
        await questionBankApi.linkToControl(q.id, controlId);
      }
      await load();
    } catch (err) {
      showAlert({ type: "error", title: "Error", message: "No se pudo cambiar el estado de la pregunta." });
    } finally {
      setTogglingId(null);
    }
  };

  // Group questions by dimension
  const byDimension = useMemo(() => {
    const groups: Record<string, BankQuestion[]> = {};
    for (const q of questions) {
      const dim = q.dimension || "Sin dimensión";
      if (!groups[dim]) groups[dim] = [];
      groups[dim].push(q);
    }
    return groups;
  }, [questions]);

  const dimensionKeys = Object.keys(byDimension).sort();

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>
        Catálogo de Preguntas{questionnaireName ? ` · ${questionnaireName}` : ""}{" "}
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>(control #{controlId})</span>
      </h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        Aquí ves todas las preguntas del Banco global, agrupadas por su dimensión. Activa el interruptor para asignar la pregunta a este formulario.
      </p>

      <QuestionForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={() => void load()}
        controlId={controlId}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setOpenForm(true)}
        >
          + Nueva pregunta
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Cargando catálogo...</div>
      ) : dimensionKeys.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No hay preguntas en el banco. Crea la primera.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {dimensionKeys.map((dim) => {
            const qs = byDimension[dim];
            const linkedCount = qs.filter(q => q.linkedControls.includes(controlId)).length;

            return (
              <div key={dim} style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Dimension Header */}
                <div style={{
                  background: "var(--surface-muted, rgba(25,118,210,0.06))",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{dim}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface)", padding: "4px 10px", borderRadius: 999 }}>
                    Asignadas: <strong style={{ color: linkedCount > 0 ? "var(--primary)" : "inherit" }}>{linkedCount}</strong> de {qs.length}
                  </div>
                </div>

                {/* Questions List */}
                <div style={{ display: "grid", gap: 0 }}>
                  {qs.map((q, idx) => {
                    const isLinked = q.linkedControls.includes(controlId);
                    const isToggling = togglingId === q.id;

                    return (
                      <div key={q.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px 16px",
                        borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                        background: isLinked ? "rgba(34,197,94,0.03)" : "transparent",
                        transition: "background 0.2s"
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: isLinked ? 600 : 400 }}>{q.text}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
                            Peso: <strong>{q.peso}</strong>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", opacity: isToggling ? 0.5 : 1 }}>
                          <Switch
                            checked={isLinked}
                            onChange={() => void handleToggle(q, isLinked)}
                            ariaLabel={`Asignar pregunta: ${q.text}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionsTable;
