import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import ConfirmModal from "../components/modal/ConfirmModal";
import ProgressCell from "../components/ProgressCell";
import Badge from "../components/Badge";
import dataService from "../services/dataService";
import { useAlert } from "../components/alerts/AlertProvider";
import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
  patchEvaluation,
  type EvaluationApiRow,
} from "../services/evaluationApi";
import { getCurrentRole, getStoredAuthUser } from "../utils/auth";
import editIcon from "../images/edit.svg";
import deleteIcon from "../images/icons8-basura-llena(1).svg";
import refreshIcon from "../images/refresh-page-option.svg";
import viewIcon from "../images/ojo.svg";

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };
type User = {
  id: string;
  name: string;
  role: string;
  email: string;
  id_rol?: number;
  id_empresa?: number | null;
  active?: boolean;
};
type FormItem = { id: string; name: string; active: boolean; roles_ids?: number[] };

/**
 * Hub dedicado para Admin y Evaluador: relación Empresa ↔ Formulario ↔ Usuario de Empresa ↔ Evaluador.
 */
const EvaluationAssignmentsPage: React.FC = () => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightEmpresa = searchParams.get("empresa");

  const currentRole = getCurrentRole();
  const currentUser = getStoredAuthUser();

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [formularios, setFormularios] = useState<FormItem[]>([]);
  const [rows, setRows] = useState<EvaluationApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [newEvalOrgId, setNewEvalOrgId] = useState<string>("");
  const [newEvalFormularioId, setNewEvalFormularioId] = useState<string>("");
  const [newEvalUserId, setNewEvalUserId] = useState<string>("");
  const [newEvalEvaluatorId, setNewEvalEvaluatorId] = useState<string>(
    currentRole === "evaluator" && currentUser?.id ? String(currentUser.id) : ""
  );

  const [deleteFor, setDeleteFor] = useState<EvaluationApiRow | null>(null);
  const [editEval, setEditEval] = useState<EvaluationApiRow | null>(null);
  const [editOrgId, setEditOrgId] = useState<string>("");
  const [editFormularioId, setEditFormularioId] = useState<string>("");
  const [editUserId, setEditUserId] = useState<string>("");
  const [editEvaluatorId, setEditEvaluatorId] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const orgName = useMemo(() => {
    const m = new Map<number, string>();
    orgs.forEach((o) => m.set(o.id_empresa, o.nombre));
    return m;
  }, [orgs]);

  const userById = useMemo(() => {
    const m = new Map<number, User>();
    allUsers.forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [allUsers]);

  const formById = useMemo(() => {
    const m = new Map<number, FormItem>();
    formularios.forEach((f) => m.set(Number(f.id), f));
    return m;
  }, [formularios]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, ev, users, forms] = await Promise.all([
        dataService.getOrgs() as Promise<Org[]>,
        listEvaluations(),
        dataService.getUsers() as Promise<User[]>,
        dataService.getQuestionnaires() as Promise<FormItem[]>,
      ]);
      setOrgs(o);
      setRows(ev);
      setAllUsers(users);
      setEvaluators(users.filter((u) => u.role === "evaluator" || u.role === "admin"));
      setFormularios(forms);
    } catch {
      setError("No se pudieron cargar datos. ¿Sesión activa y API disponible?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (highlightEmpresa) setOrgFilter(highlightEmpresa);
  }, [highlightEmpresa]);

  // Usuarios elegibles de la empresa seleccionada en el modal "Nueva evaluación"
  const eligibleNewUsers = useMemo(() => {
    const orgIdNum = Number(newEvalOrgId);
    if (!orgIdNum) return [];
    const form = formById.get(Number(newEvalFormularioId));
    const formRoles = form?.roles_ids ?? [];
    return allUsers.filter((u) => {
      if (!u.role.startsWith("user_nivel_")) return false;
      if (u.id_empresa !== orgIdNum) return false;
      if (formRoles.length > 0 && u.id_rol && !formRoles.includes(u.id_rol)) return false;
      return true;
    });
  }, [allUsers, newEvalOrgId, newEvalFormularioId, formById]);

  // Auto-seleccionar el usuario de la empresa compatible cuando cambia empresa o formulario en "Nueva evaluación"
  useEffect(() => {
    if (eligibleNewUsers.length > 0) {
      if (!eligibleNewUsers.some((u) => u.id === newEvalUserId)) {
        setNewEvalUserId(eligibleNewUsers[0].id);
      }
    } else {
      setNewEvalUserId("");
    }
  }, [eligibleNewUsers, newEvalUserId]);

  // Usuarios elegibles de la empresa seleccionada en el modal "Editar asignación"
  const eligibleEditUsers = useMemo(() => {
    const orgIdNum = Number(editOrgId);
    if (!orgIdNum) return [];
    const form = formById.get(Number(editFormularioId));
    const formRoles = form?.roles_ids ?? [];
    return allUsers.filter((u) => {
      if (!u.role.startsWith("user_nivel_")) return false;
      if (u.id_empresa !== orgIdNum) return false;
      if (formRoles.length > 0 && u.id_rol && !formRoles.includes(u.id_rol)) return false;
      return true;
    });
  }, [allUsers, editOrgId, editFormularioId, formById]);

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

  const handleDelete = (ev: EvaluationApiRow) => {
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
        title: "Éxito",
        message: "Evaluación eliminada correctamente.",
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

  const handleCreateForOrg = async (
    id_empresa: number,
    id_formulario: number,
    id_usuario?: number,
    id_evaluador?: number,
    openWorkflow = false
  ) => {
    try {
      setBusyId(-1);
      const created = await createEvaluation({
        id_empresa,
        id_formulario,
        id_usuario,
        id_evaluador,
      });
      showAlert({
        type: "success",
        title: "Asignación creada",
        message: "La evaluación fue asignada correctamente al usuario de la empresa.",
      });
      await load();
      if (openWorkflow) {
        navigate(`/evaluations/${created.id_evaluacion}/workflow?respond=1`);
      }
    } catch (e) {
      showAlert({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "No se pudo crear la evaluación",
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
        id_formulario: Number(editFormularioId),
        id_usuario: editUserId ? Number(editUserId) : undefined,
        id_evaluador: editEvaluatorId ? Number(editEvaluatorId) : undefined,
      });
      showAlert({ type: "success", title: "Éxito", message: "Asignación actualizada correctamente" });
      await load();
      if (goToWorkflow) {
        navigate(`/evaluations/${editEval.id_evaluacion}/workflow?respond=1`);
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

  // KPIs de resumen rápido para el Evaluador / Admin
  const assignedOrgsCount = useMemo(() => new Set(rows.map((r) => r.id_empresa)).size, [rows]);
  const pendingCount = useMemo(
    () => rows.filter((e) => (e.estado || "pendiente").toLowerCase() === "pendiente").length,
    [rows]
  );
  const inProgressCount = useMemo(
    () => rows.filter((e) => (e.estado || "").toLowerCase().includes("progreso") || (e.estado || "").toLowerCase().includes("proceso")).length,
    [rows]
  );
  const finishedCount = useMemo(
    () => rows.filter((e) => (e.estado || "").toLowerCase().includes("final") || (e.estado || "").toLowerCase().includes("complet")).length,
    [rows]
  );

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Asignaciones de Formularios a Empresa y Usuarios</h2>
        <p style={{ color: "var(--muted)", marginTop: -8, marginBottom: 20, fontSize: 14 }}>
          Asigna cuestionarios a los usuarios de cada organización, supervisa cuánto les falta por responder o ingresa a responder y auditar directamente la evaluación.
        </p>

        {/* Tarjetas KPI de supervisión */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 18 }}>
          <div className="card" style={{ padding: 16, textAlign: "center", borderTop: "4px solid var(--gray-400)" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{assignedOrgsCount}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Organizaciones con evaluación</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center", borderTop: "4px solid #d97706" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>{pendingCount}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Evaluaciones pendientes</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center", borderTop: "4px solid var(--blue-500)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--blue-500)" }}>{inProgressCount}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>En progreso</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center", borderTop: "4px solid #16a34a" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>{finishedCount}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Finalizadas</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Filtrar por empresa:</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, minWidth: 220, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
            >
              <option value="">Todas las empresas</option>
              {orgs.map((o) => (
                <option key={o.id_empresa} value={String(o.id_empresa)}>
                  {o.nombre}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-icon" onClick={() => void load()} disabled={loading} title="Actualizar">
              <img src={refreshIcon} alt="Actualizar" width={18} height={18} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                if (formularios[0] && !newEvalFormularioId) {
                  setNewEvalFormularioId(String(formularios[0].id));
                }
                if (currentRole === "evaluator" && currentUser?.id) {
                  setNewEvalEvaluatorId(String(currentUser.id));
                }
                const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.showModal();
              }}
            >
              Asignar evaluación a usuario
            </button>
          </div>
        </div>

        <div className="card" style={{ minHeight: 200 }}>
          <h3 style={{ marginTop: 0 }}>Evaluaciones asignadas por empresa y usuario</h3>
          {loading && <p>Cargando…</p>}
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          {!loading && !error && (
            <div className="table-responsive-container">
              <table className="table-responsive" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th style={{ padding: "10px 8px" }}>ID</th>
                    <th style={{ padding: "10px 8px" }}>Empresa</th>
                    <th style={{ padding: "10px 8px" }}>Formulario Asignado</th>
                    <th style={{ padding: "10px 8px" }}>Usuario de la Empresa (Responde)</th>
                    <th style={{ padding: "10px 8px" }}>Evaluador Supervisor</th>
                    <th style={{ padding: "10px 8px" }}>Avance</th>
                    <th style={{ padding: "10px 8px" }}>Estado</th>
                    <th style={{ padding: "10px 8px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 16, color: "var(--muted)" }}>
                        No hay evaluaciones para este filtro.
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((r) => {
                    const hi =
                      highlightEmpresa && String(r.id_empresa) === highlightEmpresa
                        ? { background: "rgba(59, 130, 246, 0.08)" }
                        : {};
                    const titular = userById.get(r.id_usuario);
                    const evaluatorObj = r.id_evaluador ? userById.get(r.id_evaluador) : undefined;
                    const formObj = formById.get(r.id_formulario);

                    return (
                      <tr key={r.id_evaluacion} style={hi}>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", fontWeight: 700 }}>
                          #{r.id_evaluacion}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", fontWeight: 600 }}>
                          {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
                          {formObj?.name ?? `Formulario #${r.id_formulario}`}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 600 }}>
                            {titular ? titular.name : `Usuario #${r.id_usuario}`}
                          </div>
                          {titular && (
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>
                              {titular.email} ({titular.role})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", color: r.id_evaluador ? "inherit" : "var(--muted)" }}>
                          {evaluatorObj ? evaluatorObj.name : r.id_evaluador ? `Evaluador #${r.id_evaluador}` : "Sin asignar"}
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", minWidth: 110 }}>
                          <ProgressCell evaluationId={r.id_evaluacion} />
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
                          <Badge status={r.estado || "pendiente"} />
                        </td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Link
                              to={`/evaluations/${r.id_evaluacion}/workflow?respond=1`}
                              className="btn btn-primary"
                              style={{ textDecoration: "none", padding: "6px 10px", fontSize: 12 }}
                              title="Responder o auditar cuestionario como Evaluador/Admin"
                            >
                              Responder / Auditar
                            </Link>
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={() => {
                                setEditEval(r);
                                setEditOrgId(String(r.id_empresa));
                                setEditFormularioId(r.id_formulario ? String(r.id_formulario) : "");
                                setEditUserId(r.id_usuario ? String(r.id_usuario) : "");
                                setEditEvaluatorId(r.id_evaluador ? String(r.id_evaluador) : "");
                                setTimeout(() => {
                                  const dialog = document.getElementById("edit-evaluation-dialog") as HTMLDialogElement | null;
                                  dialog?.showModal();
                                }, 10);
                              }}
                              title="Editar asignación (cambiar usuario, formulario o evaluador)"
                            >
                              <img src={editIcon} alt="Editar" width={18} height={18} />
                            </button>
                            <Link
                              to={`/reports/${r.id_evaluacion}`}
                              className="btn btn-icon"
                              style={{ textDecoration: "none" }}
                              title="Ver informe confidencial"
                            >
                              <img src={viewIcon} alt="Ver informe" width={18} height={18} />
                            </Link>
                            <Link
                              to={`/results-dashboard/${r.id_evaluacion}`}
                              className="btn"
                              style={{ textDecoration: "none", padding: "6px 10px", fontSize: 12 }}
                              title="Analizar en Power BI"
                            >
                              Power BI
                            </Link>
                            <button
                              type="button"
                              className="btn btn-icon"
                              disabled={busyId === r.id_evaluacion}
                              onClick={() => handleDelete(r)}
                              title="Eliminar evaluación"
                            >
                              <img src={deleteIcon} alt="Eliminar" width={18} height={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && filtered.length > 5 && (
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

        {/* Modal Nueva Asignación */}
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
          <div
            style={{
              background: "linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)",
              padding: "20px 24px",
              borderBottom: "1px solid color-mix(in srgb, var(--blue-400) 50%, transparent)",
              color: "white",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 4, fontWeight: 600 }}>Asignar evaluación a usuario de empresa</h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Selecciona la empresa, el cuestionario y el usuario de la empresa que deberá responderlo (o respóndelo tú mismo como evaluador).
            </p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                1. Empresa a Evaluar *
              </label>
              <select
                value={newEvalOrgId}
                onChange={(e) => setNewEvalOrgId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Seleccione una empresa...</option>
                {orgs.map((o) => (
                  <option key={o.id_empresa} value={o.id_empresa}>
                    {o.nombre} ({o.sector} - {o.tamano})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                2. Formulario (Plantilla por Nivel) *
              </label>
              <select
                value={newEvalFormularioId}
                onChange={(e) => setNewEvalFormularioId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Seleccione un formulario...</option>
                {formularios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.active ? "" : "(Inactivo)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                3. Usuario de la Empresa que responderá el formulario *
              </label>
              <select
                value={newEvalUserId}
                onChange={(e) => setNewEvalUserId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                {eligibleNewUsers.length === 0 ? (
                  <option value="">Asignación automática según nivel del formulario</option>
                ) : (
                  eligibleNewUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.role})
                    </option>
                  ))
                )}
              </select>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Se filtran los usuarios de la empresa cuyo nivel coincide con el formulario seleccionado.
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                4. Evaluador Supervisor
              </label>
              <select
                value={newEvalEvaluatorId}
                onChange={(e) => setNewEvalEvaluatorId(e.target.value)}
                disabled={currentRole === "evaluator"}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Sin evaluador específico</option>
                {evaluators.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 8,
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-page)",
            }}
          >
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
              className="btn"
              disabled={busyId === -1}
              onClick={() => {
                const v = Number(newEvalOrgId);
                const formId = Number(newEvalFormularioId);
                const uid = newEvalUserId ? Number(newEvalUserId) : undefined;
                const evId = newEvalEvaluatorId ? Number(newEvalEvaluatorId) : undefined;
                if (!v || !formId) {
                  showAlert({
                    type: "warning",
                    title: "Advertencia",
                    message: "Seleccione una empresa y un formulario.",
                  });
                  return;
                }
                void handleCreateForOrg(v, formId, uid, evId, false);
                const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.close();
              }}
            >
              Solo Asignar al Usuario
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === -1}
              onClick={() => {
                const v = Number(newEvalOrgId);
                const formId = Number(newEvalFormularioId);
                const uid = newEvalUserId ? Number(newEvalUserId) : undefined;
                const evId = newEvalEvaluatorId ? Number(newEvalEvaluatorId) : undefined;
                if (!v || !formId) {
                  showAlert({
                    type: "warning",
                    title: "Advertencia",
                    message: "Seleccione una empresa y un formulario.",
                  });
                  return;
                }
                void handleCreateForOrg(v, formId, uid, evId, true);
                const dialog = document.getElementById("new-evaluation-dialog") as HTMLDialogElement | null;
                dialog?.close();
              }}
            >
              Asignar y Responder Ahora
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
            background: "var(--surface)",
            color: "var(--text-primary)",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            width: "90%",
            maxWidth: 520,
          }}
        >
          <div style={{ padding: "24px 24px 16px" }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Editar Asignación #{editEval?.id_evaluacion}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Empresa (Organización)</label>
                <select
                  value={editOrgId}
                  onChange={(e) => setEditOrgId(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
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
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Formulario (Plantilla)</label>
                <select
                  value={editFormularioId}
                  onChange={(e) => setEditFormularioId(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
                >
                  <option value="">-- Seleccione un formulario --</option>
                  {formularios.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name} {f.active ? "" : "(Inactivo)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Usuario de la Empresa (Responde)
                </label>
                <select
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
                >
                  {eligibleEditUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Evaluador Asignado</label>
                <select
                  value={editEvaluatorId}
                  onChange={(e) => setEditEvaluatorId(e.target.value)}
                  disabled={currentRole === "evaluator"}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)" }}
                >
                  <option value="">-- Seleccione un evaluador (opcional) --</option>
                  {evaluators.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-page)",
            }}
          >
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
              className="btn"
              disabled={busyId === (editEval?.id_evaluacion ?? -1)}
              onClick={() => void handleEditAssignment(false)}
            >
              Guardar cambios
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === (editEval?.id_evaluacion ?? -1)}
              onClick={() => void handleEditAssignment(true)}
            >
              Guardar y Responder
            </button>
          </div>
        </dialog>

        <ConfirmModal
          open={deleteFor != null}
          title={deleteFor ? `Eliminar evaluación #${deleteFor.id_evaluacion}` : "Eliminar evaluación"}
          message={
            deleteFor
              ? `¿Confirmas que deseas eliminar la evaluación de ${orgName.get(deleteFor.id_empresa) ?? "empresa"}?`
              : "¿Confirmas que deseas eliminar la evaluación?"
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
