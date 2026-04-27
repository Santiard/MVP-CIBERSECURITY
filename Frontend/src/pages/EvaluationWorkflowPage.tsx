import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import dataService, { type Question } from "../services/dataService";
import {
  detachEvaluationControl,
  getEvaluationById,
  linkEvaluationControlsBulk,
  listEvaluationControls,
  patchEvaluation,
  type AnswerValue,
  type EvaluationDetail,
} from "../services/evaluationApi";
import { useAlert } from "../components/alerts/AlertProvider";

type QuestionnaireRow = Awaited<ReturnType<typeof dataService.getQuestionnaires>>[number];

async function syncEvaluationControls(evaluationId: number, desiredIds: Set<number>): Promise<void> {
  const linked = await listEvaluationControls(evaluationId);
  const linkedIds = new Set(linked.map((c) => c.id_control));
  const toRemove = [...linkedIds].filter((id) => !desiredIds.has(id));
  const toAdd = [...desiredIds].filter((id) => !linkedIds.has(id));
  await Promise.all(toRemove.map((cid) => detachEvaluationControl(evaluationId, cid)));
  if (toAdd.length > 0) {
    await linkEvaluationControlsBulk(evaluationId, toAdd);
  }
}

const EvaluationWorkflowPage: React.FC = () => {
  const { showAlert } = useAlert();
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const idNum = evaluationId ? Number(evaluationId) : NaN;

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRow[]>([]);
  const [selectedControlIds, setSelectedControlIds] = useState<Set<number>>(new Set());

  const [questionsFlat, setQuestionsFlat] = useState<{ controlName: string; question: Question }[]>([]);
  const [answersForm, setAnswersForm] = useState<Record<string, { valor: string; comentario: string }>>({});

  const loadBase = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    setError(null);
    try {
      const [ev, linked, qs] = await Promise.all([
        getEvaluationById(idNum),
        listEvaluationControls(idNum),
        dataService.getQuestionnaires(),
      ]);
      setEvaluation(ev);
      setQuestionnaires(qs);
      setSelectedControlIds(new Set(linked.map((c) => c.id_control)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la evaluación");
    } finally {
      setLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  const toggleControl = (controlId: number) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return next;
    });
  };

  const handleSaveScopeAndContinue = async () => {
    if (!Number.isFinite(idNum)) return;
    if (selectedControlIds.size === 0) {
      showAlert({
        type: "warning",
        title: "Advertencia",
        message: "Seleccione al menos un control (cuestionario) en el alcance.",
      });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await syncEvaluationControls(idNum, selectedControlIds);
      const linked = await listEvaluationControls(idNum);
      const pairs: { controlName: string; question: Question }[] = [];
      for (const c of linked) {
        const qs = await dataService.getQuestionsByControl(String(c.id_control));
        for (const q of qs) {
          pairs.push({ controlName: c.nombre, question: q });
        }
      }
      setQuestionsFlat(pairs);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el alcance");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || questionsFlat.length === 0 || !evaluation) return;
    setAnswersForm((prev) => {
      const next = { ...prev };
      for (const { question: q } of questionsFlat) {
        if (next[q.id] !== undefined) continue;
        const a = evaluation.answers[q.id];
        next[q.id] = {
          valor: a?.valor != null && !Number.isNaN(a.valor) ? String(a.valor) : "",
          comentario: a?.comentario ?? "",
        };
      }
      return next;
    });
  }, [step, questionsFlat, evaluation]);

  const handleSaveAnswers = async () => {
    if (!Number.isFinite(idNum) || !evaluation) return;
    setSaving(true);
    setError(null);
    try {
      const merged: Record<string, AnswerValue> = { ...evaluation.answers };
      for (const { question: q } of questionsFlat) {
        const row = answersForm[q.id] ?? { valor: "", comentario: "" };
        const vStr = row.valor.trim();
        const valor = vStr === "" ? undefined : Number(vStr);
        const comentario = row.comentario.trim() === "" ? undefined : row.comentario.trim();
        if (valor !== undefined && (Number.isNaN(valor) || valor < 1 || valor > 5)) {
          throw new Error(`La pregunta "${q.text.slice(0, 48)}…" requiere un valor entre 1 y 5 o vacío.`);
        }
        if (valor !== undefined || comentario !== undefined) {
          merged[q.id] = { valor, comentario };
        } else {
          delete merged[q.id];
        }
      }
      const updated = await patchEvaluation(idNum, { answers: merged });
      setEvaluation(updated);
      showAlert({
        type: "success",
        title: "Exito",
        message: "Respuestas guardadas correctamente.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar respuestas";
      setError(msg);
      showAlert({
        type: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!Number.isFinite(idNum)) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <p>Identificador de evaluación no válido.</p>
          <Link to="/asignaciones">Volver a asignaciones</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Flujo de evaluación #{idNum}</h2>
          <Link to="/asignaciones" className="btn" style={{ textDecoration: "none" }}>
            Asignaciones
          </Link>
        </div>
        {evaluation && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Empresa #{evaluation.id_empresa}</p>
        )}

        <div className="card" style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              fontWeight: 600,
              color: step === 1 ? "var(--blue-600, #2563eb)" : "var(--muted)",
            }}
          >
            1 · Alcance
          </span>
          <span style={{ color: "var(--muted)" }}>→</span>
          <span
            style={{
              fontWeight: 600,
              color: step === 2 ? "var(--blue-600, #2563eb)" : "var(--muted)",
            }}
          >
            2 · Cuestionario
          </span>
        </div>

        {loading && <p style={{ marginTop: 16 }}>Cargando…</p>}
        {error && (
          <p style={{ marginTop: 16, color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}

        {!loading && evaluation && step === 1 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0 }}>Seleccionar controles en alcance</h3>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Marque uno o más cuestionarios (controles) que formarán parte de esta evaluación. Al continuar se
              sincronizarán con el servidor (enlaces en <code>evaluacion_control</code>).
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0" }}>
              {questionnaires.map((q) => {
                const cid = Number(q.id);
                return (
                  <li
                    key={q.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedControlIds.has(cid)}
                      onChange={() => toggleControl(cid)}
                      id={`ctrl-${q.id}`}
                    />
                    <label htmlFor={`ctrl-${q.id}`} style={{ cursor: "pointer", flex: 1 }}>
                      <strong>{q.name}</strong>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{q.description}</div>
                    </label>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSaveScopeAndContinue()}>
              {saving ? "Guardando…" : "Guardar alcance y continuar"}
            </button>
          </div>
        )}

        {!loading && evaluation && step === 2 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0 }}>Responder preguntas</h3>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Una respuesta por pregunta: valor numérico 1–5 (madurez) y comentario opcional. Se guardan en{" "}
              <code>PATCH /evaluations/{idNum}</code> con el campo <code>answers</code>.
            </p>
            {questionsFlat.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No hay preguntas en los controles seleccionados. Revise el catálogo o la semilla de datos.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
                {questionsFlat.map(({ controlName, question: q }) => (
                  <div
                    key={q.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface-muted, rgba(0,0,0,0.02))",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{controlName}</div>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>{q.text}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                        Valor (1–5)
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={answersForm[q.id]?.valor ?? ""}
                          onChange={(e) =>
                            setAnswersForm((prev) => ({
                              ...prev,
                              [q.id]: { valor: e.target.value, comentario: prev[q.id]?.comentario ?? "" },
                            }))
                          }
                          style={{ padding: 8, borderRadius: 8, width: 100, border: "1px solid var(--border)" }}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200, fontSize: 13 }}>
                        Comentario
                        <input
                          type="text"
                          value={answersForm[q.id]?.comentario ?? ""}
                          onChange={(e) =>
                            setAnswersForm((prev) => ({
                              ...prev,
                              [q.id]: { valor: prev[q.id]?.valor ?? "", comentario: e.target.value },
                            }))
                          }
                          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" className="btn" disabled={saving} onClick={() => setStep(1)}>
                Volver al alcance
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || questionsFlat.length === 0}
                onClick={() => void handleSaveAnswers()}
              >
                {saving ? "Guardando…" : "Guardar respuestas"}
              </button>
              <Link to={`/reports/${idNum}`} className="btn" style={{ textDecoration: "none" }}>
                Ver informe
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvaluationWorkflowPage;
