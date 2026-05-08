import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import ConfirmModal from "../components/modal/ConfirmModal";
import EvaluatorSummaryPage from "./EvaluatorSummaryPage";
import dataService from "../services/dataService";
import { useAlert } from "../components/alerts/AlertProvider";
import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
  patchEvaluation,
  type EvaluationApiRow,
} from "../services/evaluationApi";
import { getCurrentRole } from "../utils/auth";

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };
type User = { id: string; name: string; role: string; email: string };

/**
 * Hub dedicado: relación empresa (organización) ↔ evaluación.
 * No sustituye el catálogo de empresas ni el de evaluaciones; centraliza asignar, reasignar, ver informe y eliminar vínculos.
 */
const EvaluationAssignmentsPage: React.FC = () => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightEmpresa = searchParams.get("empresa");

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [rows, setRows] = useState<EvaluationApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("");
  
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newEvalOrgId, setNewEvalOrgId] = useState<string>("");
  const [newEvalEvaluatorId, setNewEvalEvaluatorId] = useState<string>("");
  const [deleteFor, setDeleteFor] = useState<EvaluationApiRow | null>(null);
  const [editEval, setEditEval] = useState<EvaluationApiRow | null>(null);
  const [editOrgId, setEditOrgId] = useState<string>("");
  const [editEvaluatorId, setEditEvaluatorId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const orgName = useMemo(() => {
    const m = new Map<number, string>();
    orgs.forEach((o) => m.set(o.id_empresa, o.nombre));
    return m;
  }, [orgs]);

  const evalName = useMemo(() => {
    const m = new Map<number, string>();
    evaluators.forEach((e) => m.set(Number(e.id), e.name));
    return m;
  }, [evaluators]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, ev, users] = await Promise.all([
        dataService.getOrgs() as Promise<Org[]>, 
        listEvaluations(),
        dataService.getUsers()
      ]);
      setOrgs(o);
      setRows(ev);
      setEvaluators(users.filter(u => u.role === "evaluator"));
    } catch {
      setError("No se pudieron cargar datos. ¿Sesión activa y API disponible?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (highlightEmpresa) setOrgFilter(highlightEmpresa);
  }, [highlightEmpresa]);

  const filtered = useMemo(() => {
    if (!orgFilter) return rows;
    const id = Number(orgFilter);
    if (Number.isNaN(id)) return rows;
    return rows.filter((r) => r.id_empresa === id);
  }, [rows, orgFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [orgFilter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  

  const handleDelete = async (ev: EvaluationApiRow) => {
    setDeleteFor(ev);
  };

  const confirmDelete = async () => {
    if (!deleteFor) return;
    try {
      setBusyId(deleteFor.id_evaluacion);
      await deleteEvaluation(deleteFor.id_evaluacion);
      setDeleteFor(null);
      showAlert({
        type: "success",
        title: "Exito",
        message: "Evaluacion eliminada correctamente.",
      });
      await load();
    } catch (e) {
      showAlert({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "Error al eliminar",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateForOrg = async (id_empresa: number, id_evaluador?: number) => {
    try {
      setBusyId(-1);
      const created = await createEvaluation({ id_empresa, id_evaluador });
      await load();
      navigate(`/evaluations/${created.id_evaluacion}/workflow`);
    } catch (e) {
      showAlert({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "No se pudo crear la evaluacion",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleEditAssignment = async (goToWorkflow = false) => {
    if (!editEval) return;
    try {
      setBusyId(editEval.id_evaluacion);
      await patchEvaluation(editEval.id_evaluacion, {
        id_empresa: Number(editOrgId),
        id_evaluador: editEvaluatorId ? Number(editEvaluatorId) : undefined,
      });
      showAlert({ type: "success", title: "Éxito", message: "Asignación actualizada correctamente" });
      await load();
      if (goToWorkflow) {
        navigate(`/evaluations/${editEval.id_evaluacion}/workflow`);
      }
    } catch (e) {
      showAlert({ type: "error", title: "Error", message: e instanceof Error ? e.message : "Error al actualizar" });
    } finally {
      setBusyId(null);
      const dialog = document.getElementById("edit-evaluation-dialog") as HTMLDialogElement | null;
      dialog?.close();
      setEditEval(null);
    }
  };

  if (getCurrentRole() === "evaluator") {
    return (
      <Layout>
        <EvaluatorSummaryPage />
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>ASIGNACIONES DE FORMULARIOS A EMPRESA</h2>

        <div className="card" style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>Filtrar por empresa</label>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 8, minWidth: 220, border: "1px solid var(--border)" }}
          >
            <option value="">Todas las empresas</option>
            {orgs.map((o) => (
              <option key={o.id_empresa} value={String(o.id_empresa)}>
                {o.nombre}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={() => load()} disabled={loading}>
            Actualizar
          </button>
          <Link to="/organizations" className="btn" style={{ textDecoration: "none" }}>
            Ir a organizaciones
          </Link>
          <Link to="/evaluations" className="btn" style={{ textDecoration: "none" }}>
            Ir a evaluaciones
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const fallbackOrgId = highlightEmpresa ?? orgFilter ?? (orgs[0] ? String(orgs[0].id_empresa) : "");
              setNewEvalOrgId(fallbackOrgId);
              const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
              dialog?.showModal();
            }}
          >
            Asignar evaluación
          </button>
        </div>

        <div className="card" style={{ minHeight: 200 }}>
          <h3 style={{ marginTop: 0 }}>Evaluaciones por empresa</h3>
          {loading && <p>Cargando…</p>}
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          {!loading && !error && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th style={{ padding: "10px 8px" }}>Empresa</th>
                    <th style={{ padding: "10px 8px" }}>Evaluador Asignado</th>
                    <th style={{ padding: "10px 8px" }}>ID eval.</th>
                    <th style={{ padding: "10px 8px" }}>Fecha</th>
                    <th style={{ padding: "10px 8px" }}>Estado</th>
                    <th style={{ padding: "10px 8px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 16, color: "var(--muted)" }}>
                        No hay evaluaciones para este filtro.
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((r) => {
                    const hi =
                      highlightEmpresa && String(r.id_empresa) === highlightEmpresa
                        ? { background: "rgba(59, 130, 246, 0.08)" }
                        : {};
                    return (
                      <tr key={r.id_evaluacion} style={hi}>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
                          {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", color: r.id_evaluador ? "inherit" : "var(--muted)" }}>
                          {r.id_evaluador ? evalName.get(r.id_evaluador) ?? `Usuario #${r.id_evaluador}` : "Sin asignar"}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.id_evaluacion}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.fecha || "—"}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.estado}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginRight: 8 }}
                            onClick={() => {
                              setEditEval(r);
                              setEditOrgId(String(r.id_empresa));
                              setEditEvaluatorId(r.id_evaluador ? String(r.id_evaluador) : "");
                              setTimeout(() => {
                                const dialog = document.getElementById("edit-evaluation-dialog") as HTMLDialogElement | null;
                                dialog?.showModal();
                              }, 10);
                            }}
                          >
                            Editar
                          </button>
                          <Link
                            to={`/reports/${r.id_evaluacion}`}
                            className="btn"
                            style={{ textDecoration: "none", marginRight: 8 }}
                          >
                            Ver informe
                          </Link>
                          {/* Reasignación deshabilitada: la empresa responsable no se puede cambiar desde aquí */}
                          <button
                            type="button"
                            className="btn"
                            style={{ marginLeft: 8 }}
                            disabled={busyId === r.id_evaluacion}
                            onClick={() => handleDelete(r)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
              <div style={{ color: "var(--muted)" }}>Mostrando {visibleRows.length} de {filtered.length} evaluaciones</div>
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
          )}
        </div>

        <dialog
          id="new-evaluation-dialog"
          style={{
            width: "min(640px, calc(100vw - 32px))",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: 0,
            background: "var(--surface)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)",
            padding: "20px 24px",
            borderBottom: "1px solid color-mix(in srgb, var(--blue-400) 50%, transparent)",
            color: "white",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 4, fontWeight: 600 }}>Nueva evaluación ligada a una empresa</h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>Crea una evaluación asociada a la empresa y abre el flujo (alcance + cuestionario).</p>
          </div>
          <div style={{ padding: "24px" }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0, marginBottom: 10 }}>* Campo obligatorio</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Empresa *</label>
                <select
                  value={newEvalOrgId}
                  onChange={(e) => setNewEvalOrgId(e.target.value)}
                  required
                  aria-required="true"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                >
                  <option value="">Seleccione…</option>
                  {orgs.map((o) => (
                    <option key={o.id_empresa} value={String(o.id_empresa)}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Evaluador *</label>
                <select
                  value={newEvalEvaluatorId}
                  onChange={(e) => setNewEvalEvaluatorId(e.target.value)}
                  required
                  aria-required="true"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                >
                  <option value="">Seleccione el evaluador asignado…</option>
                  {evaluators.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-muted, rgba(0,0,0,0.02))",
          }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.close();
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === -1}
              onClick={() => {
                const v = Number(newEvalOrgId);
                const evId = Number(newEvalEvaluatorId);
                if (!v || !evId) {
                  showAlert({
                    type: "warning",
                    title: "Advertencia",
                    message: "Seleccione una empresa y un evaluador.",
                  });
                  return;
                }
                void handleCreateForOrg(v, evId);
                const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.close();
              }}
            >
              Crear y abrir flujo
            </button>
          </div>
        </dialog>

        {/* Modal de edición */}
        <dialog
          id="edit-evaluation-dialog"
          style={{
            padding: 0,
            border: "none",
            borderRadius: 12,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            width: "90%",
            maxWidth: 500,
          }}
        >
          <div style={{ padding: "24px 24px 16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Editar Asignación</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Empresa (Organización)</label>
                <select
                  value={editOrgId}
                  onChange={(e) => setEditOrgId(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                >
                  <option value="">-- Seleccione una empresa --</option>
                  {orgs.map((o) => (
                    <option key={o.id_empresa} value={String(o.id_empresa)}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Evaluador Asignado</label>
                <select
                  value={editEvaluatorId}
                  onChange={(e) => setEditEvaluatorId(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                >
                  <option value="">-- Seleccione un evaluador (opcional) --</option>
                  {evaluators.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-muted, rgba(0,0,0,0.02))",
          }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const dialog = document.getElementById("edit-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.close();
                setEditEval(null);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === (editEval?.id_evaluacion ?? -1)}
              onClick={() => handleEditAssignment(false)}
            >
              Guardar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === (editEval?.id_evaluacion ?? -1)}
              onClick={() => handleEditAssignment(true)}
            >
              Guardar y editar alcance
            </button>
          </div>
        </dialog>

        {/* Reasignación removida: no se permite cambiar empresa desde esta vista */}
        <ConfirmModal
          open={deleteFor != null}
          title={deleteFor ? `Eliminar evaluacion #${deleteFor.id_evaluacion}` : "Eliminar evaluacion"}
          message={
            deleteFor
              ? `¿Confirmas que deseas eliminar la evaluacion de ${orgName.get(deleteFor.id_empresa) ?? "empresa"}?`
              : "¿Confirmas que deseas eliminar la evaluacion?"
          }
          confirmText="Eliminar"
          loading={deleteFor != null && busyId === deleteFor.id_evaluacion}
          onCancel={() => setDeleteFor(null)}
          onConfirm={() => void confirmDelete()}
        />
      </div>
    </Layout>
  );
};

export default EvaluationAssignmentsPage;
