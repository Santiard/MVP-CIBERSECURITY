import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import BackButton from "../components/BackButton";
import dataService, { type Question } from "../services/dataService";
import {
  getEvaluationById,
  patchEvaluation,
  type AnswerValue,
  type EvaluationDetail,
} from "../services/evaluationApi";
import { useAlert } from "../components/alerts/AlertProvider";
import viewIcon from "../images/ojo.svg";
import saveIcon from "../images/guardar.svg";
import checkIcon from "../images/listo.svg";
import { getCurrentRole, getStoredAuthUser } from "../utils/auth";
import { isStaffRole } from "../utils/roleAccess";

const EvaluationWorkflowPage: React.FC = () => {
  const { showAlert } = useAlert();
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const idNum = evaluationId ? Number(evaluationId) : NaN;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<"saved" | "finalized" | null>(null);

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [questionsFlat, setQuestionsFlat] = useState<{ controlName: string; question: Question }[]>([]);
  const [answersForm, setAnswersForm] = useState<Record<string, { valor: string; comentario: string }>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const autoSaveTimer = useRef<number | null>(null);
  const lastSavedAnswers = useRef<Record<string, { valor: string; comentario: string }>>({});
  const [autoSaving, setAutoSaving] = useState(false);

  const authRole = getCurrentRole();
  const authUser = getStoredAuthUser();
  const isStaff = isStaffRole(authRole);

  const totalQuestions = questionsFlat.length;
  const answeredCount = questionsFlat.filter(({ question: q }) => {
    const id = q.id;
    const localValor = answersForm[id]?.valor;
    if (localValor !== undefined && String(localValor).trim() !== "" && Number(localValor) >= 1) return true;
    const savedValor = evaluation?.answers?.[id]?.valor;
    if (savedValor !== undefined && String(savedValor).trim() !== "" && Number(savedValor) >= 1) return true;
    return false;
  }).length;
  const pendingCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const estadoLower = (evaluation?.estado ?? "").trim().toLowerCase();
  const isResolved =
    estadoLower.includes("final") || estadoLower.includes("complet");

  // Para usuario de empresa se bloquea cuando ya está finalizada; el Evaluador/Admin sí puede auditar o responder
  const isLockedForCurrentUser = !isStaff && isResolved;

  const isAssignee =
    evaluation != null && authUser != null && Number(authUser.id) === evaluation.id_usuario;
  const canRespondToQuestionnaire = (authRole?.startsWith("user") && isAssignee) || isStaff;

  const loadBase = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    setError(null);
    try {
      const ev = await getEvaluationById(idNum);
      setEvaluation(ev);

      const qs2 = await dataService.getQuestionsByControl(String(ev.id_formulario));
      const pairs = qs2.map((q) => ({ controlName: q.dimension || "Control ISO 27001", question: q }));
      setQuestionsFlat(pairs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la evaluación");
    } finally {
      setLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!canRespondToQuestionnaire || questionsFlat.length === 0 || !evaluation) return;
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
  }, [questionsFlat, evaluation, canRespondToQuestionnaire]);

  const handleSaveAnswers = async () => {
    if (!Number.isFinite(idNum) || !evaluation) return;
    if (!canRespondToQuestionnaire) return;
    if (isLockedForCurrentUser) return;
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
      const allAnswered = questionsFlat.every(({ question: q }) => {
        const v = merged[q.id]?.valor;
        return v !== undefined && Number(v) >= 1;
      });
      const newEstado = allAnswered ? "Finalizada" : "En progreso";
      const updated = await patchEvaluation(idNum, {
        answers: merged,
        estado: newEstado,
      });
      setEvaluation(updated);
      setLastSavedAt(new Date().toLocaleString("es-CO"));

      if (allAnswered) {
        setSuccessMessage("finalized");
      } else {
        setSuccessMessage("saved");
      }
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

  // Partial autosave (debounced) — saves answers but does NOT finalize the evaluation
  const saveAnswersPartial = async () => {
    if (!Number.isFinite(idNum) || !evaluation) return;
    if (!canRespondToQuestionnaire) return;
    if (isLockedForCurrentUser) return;
    const merged: Record<string, AnswerValue> = { ...evaluation.answers };
    for (const { question: q } of questionsFlat) {
      const row = answersForm[q.id] ?? { valor: "", comentario: "" };
      const vStr = row.valor.trim();
      const valor = vStr === "" ? undefined : Number(vStr);
      const comentario = row.comentario.trim() === "" ? undefined : row.comentario.trim();
      if (valor !== undefined && (Number.isNaN(valor) || valor < 1 || valor > 5)) {
        setError(`La pregunta "${q.text.slice(0, 48)}…" requiere un valor entre 1 y 5 o vacío.`);
        return;
      }
      if (valor !== undefined || comentario !== undefined) {
        merged[q.id] = { valor, comentario };
      } else {
        delete merged[q.id];
      }
    }
    setAutoSaving(true);
    try {
      const updated = await patchEvaluation(idNum, {
        answers: merged,
        estado: isResolved ? evaluation.estado : "En progreso",
      });
      setEvaluation(updated);
      setLastSavedAt(new Date().toLocaleString("es-CO"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al auto-guardar respuestas");
    } finally {
      setAutoSaving(false);
    }
  };

  useEffect(() => {
    if (!canRespondToQuestionnaire || isLockedForCurrentUser || questionsFlat.length === 0) {
      if (autoSaveTimer.current) {
        window.clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
      return;
    }

    autoSaveTimer.current = window.setInterval(() => {
      const hasChanges = JSON.stringify(answersForm) !== JSON.stringify(lastSavedAnswers.current);
      if (hasChanges) {
        lastSavedAnswers.current = JSON.parse(JSON.stringify(answersForm));
        void saveAnswersPartial();
      }
    }, 5000) as unknown as number;

    return () => {
      if (autoSaveTimer.current) {
        window.clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [canRespondToQuestionnaire, isLockedForCurrentUser, questionsFlat, answersForm]);

  if (!Number.isFinite(idNum)) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <p>Identificador de evaluación no válido.</p>
          <Link to={isStaff ? "/asignaciones" : "/evaluations"}>Volver</Link>
        </div>
      </Layout>
    );
  }

  // Si un usuario de empresa intenta entrar por URL a una evaluación que ya fue finalizada
  if (!loading && evaluation && !isStaff && isResolved && !successMessage) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <div className="card" style={{ maxWidth: 620, margin: "40px auto", padding: 32, textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <img src={checkIcon} alt="Completada" width={56} height={56} />
            </div>
            <h2 style={{ margin: "0 0 10px 0", color: "var(--success)" }}>
              Evaluación Completada y Entregada
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5, marginBottom: 24 }}>
              Este cuestionario ya fue respondido en su totalidad (100%) y entregado de manera confidencial al evaluador asignado a tu organización. Las respuestas se encuentran cerradas y no admiten modificaciones posteriores.
            </p>
            <Link to="/evaluations" className="btn btn-primary" style={{ textDecoration: "none", padding: "10px 22px" }}>
              Volver a Mis Evaluaciones
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Pantalla de confirmación tras guardar avance o finalizar
  if (successMessage) {
    const isFinalized = successMessage === "finalized";
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", marginTop: 40 }}>
            <div style={{ marginBottom: 24 }}>
              <img
                src={isFinalized ? checkIcon : saveIcon}
                alt={isFinalized ? "Éxito" : "Guardado"}
                width={64}
                height={64}
                style={{ opacity: 0.9 }}
              />
            </div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: isFinalized ? "var(--success)" : "var(--blue-500)",
                margin: "0 0 12px 0",
              }}
            >
              {isFinalized ? "Evaluación Finalizada" : "Avance Guardado"}
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", margin: "0 0 32px 0" }}>
              {isFinalized
                ? isStaff
                  ? "La evaluación ha quedado finalizada al 100% y lista para análisis de resultados."
                  : "Tu cuestionario se ha completado al 100% y fue enviado de forma confidencial al evaluador asignado."
                : `Tus respuestas se han guardado correctamente. Te faltan ${pendingCount} preguntas por responder para finalizar.`}
            </p>

            {evaluation && (
              <div
                className="card"
                style={{
                  border: `1px solid ${isFinalized ? "var(--success)" : "var(--blue-400)"}`,
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 32,
                  textAlign: "left",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 16, color: "var(--blue-400, #3b82f6)" }}>
                  Estado de tu Cuestionario
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Evaluación</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>#{evaluation.id_evaluacion}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Estado</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isFinalized ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {isFinalized ? "Finalizada" : "En progreso"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Preguntas Respondidas</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {answeredCount} de {totalQuestions} ({pendingCount} pendientes)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Progreso</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--blue-500)" }}>{progressPercent}%</div>
                  </div>
                </div>

                {lastSavedAt && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Último guardado</div>
                    <div style={{ fontSize: 14 }}>{lastSavedAt}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Solo Evaluador y Admin pueden ver los reportes y el Power BI */}
              {isStaff && (
                <>
                  <Link
                    to={`/results-dashboard/${idNum}`}
                    className="btn btn-primary"
                    style={{ textDecoration: "none", display: "block", padding: 12, fontSize: 16, fontWeight: 600 }}
                  >
                    Analizar Resultados en Power BI
                  </Link>
                  <Link
                    to={`/reports/${idNum}`}
                    className="btn"
                    style={{ textDecoration: "none", display: "block", padding: 12, fontSize: 16, fontWeight: 600 }}
                  >
                    {isFinalized ? "Ver Reporte Ejecutivo Completo" : "Ver Reporte Parcial"}
                  </Link>
                </>
              )}

              {!isFinalized && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSuccessMessage(null)}
                  style={{ padding: 12, fontSize: 16, fontWeight: 600 }}
                >
                  Continuar Respondiendo ({pendingCount} pendientes)
                </button>
              )}

              <Link
                to={isStaff ? "/asignaciones" : "/evaluations"}
                className={isFinalized && !isStaff ? "btn btn-primary" : "btn"}
                style={{ textDecoration: "none", display: "block", padding: 12, fontSize: 16, fontWeight: 600 }}
              >
                {isStaff ? "Volver a Asignaciones" : "Volver a Mis Evaluaciones"}
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {totalQuestions > 0 && (
          <div
            className="card"
            style={{
              position: "sticky",
              top: 8,
              zIndex: 40,
              padding: "12px 20px",
              marginBottom: 18,
              borderTop: "4px solid var(--blue-500)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span>Progreso del Cuestionario</span>
                  <span>
                    {answeredCount} respondidas ·{" "}
                    <strong style={{ color: pendingCount > 0 ? "#d97706" : "#16a34a" }}>
                      {pendingCount} pendientes por responder
                    </strong>
                  </span>
                </div>
                <div
                  style={{
                    background: "color-mix(in srgb, var(--text-primary) 14%, transparent)",
                    height: 12,
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: progressPercent === 100 ? "var(--success)" : "var(--blue-500)",
                      transition: "width 400ms ease",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{progressPercent}% completado</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {autoSaving ? "Autoguardando…" : lastSavedAt ? `Guardado: ${lastSavedAt}` : "Autoguardado activo"}
                  </div>
                </div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--bg-page)",
                    border: "1px solid var(--border)",
                    fontWeight: 800,
                    color: progressPercent === 100 ? "var(--success)" : "var(--blue-500)",
                  }}
                >
                  {progressPercent}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <BackButton fallback={isStaff ? "/asignaciones" : "/evaluations"} />
            <h2 style={{ margin: 0 }}>
              {isStaff ? `Auditoría y Respuesta de Evaluación #${idNum}` : `Cuestionario de Evaluación #${idNum}`}
            </h2>
          </div>
          <Link to={isStaff ? "/asignaciones" : "/evaluations"} className="btn" style={{ textDecoration: "none" }}>
            {isStaff ? "Volver a Asignaciones" : "Mis Evaluaciones"}
          </Link>
        </div>

        {evaluation && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Estado actual:{" "}
            <strong style={{ color: isResolved ? "var(--success)" : "var(--warning)" }}>
              {evaluation.estado || "Pendiente"}
            </strong>
            {pendingCount > 0
              ? ` · Faltan ${pendingCount} de ${totalQuestions} preguntas por responder`
              : " · Todas las preguntas han sido respondidas"}
          </p>
        )}

        {evaluation && !isStaff && !isAssignee && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid color-mix(in srgb, var(--warning) 35%, var(--border))",
              background: "color-mix(in srgb, var(--warning) 14%, var(--surface))",
              fontSize: 14,
            }}
          >
            Esta evaluación tiene otro usuario como titular. Solo el usuario asignado o el evaluador supervisor pueden responder este cuestionario.
          </div>
        )}

        {loading && <p style={{ marginTop: 16 }}>Cargando preguntas…</p>}
        {error && (
          <p style={{ marginTop: 16, color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}

        {!loading && evaluation && canRespondToQuestionnaire && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0 }}>Preguntas del Cuestionario</h3>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Selecciona una calificación del 1 al 5 para cada control y agrega observaciones o evidencias en el campo de comentario si aplica.
            </p>

            {questionsFlat.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No hay preguntas vinculadas a este formulario.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                {questionsFlat.map(({ controlName, question: q }, index) => {
                  const currentVal = Number(answersForm[q.id]?.valor ?? evaluation?.answers?.[q.id]?.valor ?? 0);
                  const isAnswered = currentVal >= 1 && currentVal <= 5;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: 16,
                        borderRadius: 8,
                        border: isAnswered ? "1px solid var(--border)" : "1px solid rgba(217,119,6,0.45)",
                        background: "var(--bg-page)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                          Pregunta #{index + 1} · {controlName}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isAnswered ? "var(--success)" : "#d97706",
                          }}
                        >
                          {isAnswered ? `Respondida (${currentVal}/5)` : "Pendiente por responder"}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 12, lineHeight: 1.45 }}>{q.text}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                          Valor (1–5)
                          <div style={{ display: "flex", gap: 6 }}>
                            {[1, 2, 3, 4, 5].map((v) => {
                              const selected = currentVal === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  disabled={saving || isLockedForCurrentUser}
                                  onClick={() =>
                                    setAnswersForm((prev) => ({
                                      ...prev,
                                      [q.id]: { valor: String(v), comentario: prev[q.id]?.comentario ?? "" },
                                    }))
                                  }
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    border: selected ? "2px solid var(--blue-500)" : "1px solid var(--border)",
                                    background: selected ? "var(--blue-500)" : "var(--surface)",
                                    color: selected ? "#fff" : "var(--text-primary)",
                                    fontWeight: selected ? 700 : 600,
                                    fontSize: 14,
                                    cursor: saving || isLockedForCurrentUser ? "not-allowed" : "pointer",
                                    transition: "all 0.15s",
                                    outline: "none",
                                    flexShrink: 0,
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {v}
                                </button>
                              );
                            })}
                          </div>
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200, fontSize: 13 }}>
                          Comentario / Evidencia (Opcional)
                          <input
                            type="text"
                            value={answersForm[q.id]?.comentario ?? ""}
                            disabled={saving || isLockedForCurrentUser}
                            onChange={(e) =>
                              setAnswersForm((prev) => ({
                                ...prev,
                                [q.id]: { valor: prev[q.id]?.valor ?? "", comentario: e.target.value },
                              }))
                            }
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text-primary)",
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || questionsFlat.length === 0 || isLockedForCurrentUser}
                onClick={() => void handleSaveAnswers()}
              >
                {isLockedForCurrentUser
                  ? "Evaluación finalizada"
                  : saving
                    ? "Guardando…"
                    : progressPercent === 100
                      ? "Finalizar y Enviar Evaluación"
                      : `Guardar Avance (${pendingCount} pendientes)`}
              </button>

              {isStaff && (
                <Link to={`/reports/${idNum}`} className="btn btn-icon" style={{ textDecoration: "none" }} title="Ver informe confidencial">
                  <img src={viewIcon} alt="Ver informe" width={18} height={18} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvaluationWorkflowPage;
