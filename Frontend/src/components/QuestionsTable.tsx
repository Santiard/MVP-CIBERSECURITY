import React, { useCallback, useEffect, useState } from "react";
import dataService, { type Question } from "../services/dataService";
import QuestionForm from "./QuestionForm";
import ConfirmModal from "./modal/ConfirmModal";
import { useAlert } from "./alerts/AlertProvider";

type Props = {
  controlId: number;
  questionnaireName?: string;
};

const QuestionsTable: React.FC<Props> = ({ controlId, questionnaireName }) => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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

  useEffect(() => {
    setPage(1);
  }, [controlId, pageSize]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const handleDelete = async (id: string) => {
    setDeletingQuestionId(id);
  };

  const confirmDelete = async () => {
    if (!deletingQuestionId) return;
    try {
      setDeletingLoading(true);
      await dataService.deleteQuestion(deletingQuestionId);
      setDeletingQuestionId(null);
      showAlert({ type: "success", title: "Exito", message: "Pregunta eliminada correctamente." });
      await load();
    } catch {
      showAlert({ type: "error", title: "Error", message: "No se pudo eliminar la pregunta." });
    } finally {
      setDeletingLoading(false);
    }
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
      <ConfirmModal
        open={deletingQuestionId != null}
        title="Eliminar pregunta"
        message="¿Confirmas que deseas eliminar esta pregunta?"
        confirmText="Eliminar"
        loading={deletingLoading}
        onCancel={() => setDeletingQuestionId(null)}
        onConfirm={() => void confirmDelete()}
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
              visibleRows.map((r) => (
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
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
        <div style={{ color: "var(--muted)" }}>Mostrando {visibleRows.length} de {rows.length} preguntas</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Filas</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: 6, borderRadius: 8, border: "1px solid var(--border)" }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
          <span style={{ margin: "0 4px", minWidth: 42, textAlign: "center" }}>{safePage}/{pages}</span>
          <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionsTable;
