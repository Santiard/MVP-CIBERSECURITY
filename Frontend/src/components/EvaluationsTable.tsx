import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/theme.css";
import Badge from "./Badge";
import FilterInput from "./FilterInput";
import dataService from "../services/dataService";
import { listEvaluations, type EvaluationApiRow } from "../services/evaluationApi";
import { getCurrentRole } from "../utils/auth";
import { isStaffRole } from "../utils/roleAccess";
import EvaluationProgress from "./EvaluationProgress";
import ProgressCell from "./ProgressCell";

type Org = { id_empresa: number; nombre: string };
type UserRow = { id: string; name: string; email?: string; role?: string };
type FormRow = { id: string; name: string };

function isEvaluationCompleted(estado?: string | null): boolean {
  const v = (estado || "").trim().toLowerCase();
  return v === "finalizada" || v === "finalizado" || v === "completada" || v === "completado";
}

const EvaluationsTable: React.FC = () => {
  const [filter, setFilter] = useState("");
  const [evaluatorFilter, setEvaluatorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => (window.innerWidth < 768 ? 5 : 10));
  const [rowsData, setRowsData] = useState<EvaluationApiRow[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [usersList, setUsersList] = useState<UserRow[]>([]);
  const [formsList, setFormsList] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await listEvaluations();
        setRowsData(data);

        const [o, users, forms] = await Promise.all([
          dataService.getOrgs().catch(() => [] as Org[]),
          dataService.getUsers().catch(() => [] as UserRow[]),
          dataService.getQuestionnaires().catch(() => [] as FormRow[]),
        ]);
        setOrgs(o as Org[]);
        setUsersList(users as UserRow[]);
        setFormsList(forms as FormRow[]);

        if (!isStaffRole(getCurrentRole()) && data.length > 0) {
          const org = (o as Org[]).find((x) => x.id_empresa === data[0].id_empresa);
          if (org && org.nombre !== localStorage.getItem("userOrgName")) {
            localStorage.setItem("userOrgName", org.nombre);
            window.dispatchEvent(new Event("userOrgNameChanged"));
          }
        }
      } catch {
        setError("No se pudieron cargar las evaluaciones. Verifica tu conexión e intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const orgName = useMemo(() => {
    const m = new Map<number, string>();
    orgs.forEach((o) => m.set(o.id_empresa, o.nombre));
    return m;
  }, [orgs]);

  const userById = useMemo(() => {
    const m = new Map<number, UserRow>();
    usersList.forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [usersList]);

  const formNameById = useMemo(() => {
    const m = new Map<number, string>();
    formsList.forEach((f) => m.set(Number(f.id), f.name));
    return m;
  }, [formsList]);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rowsData.filter((r) => {
      if (evaluatorFilter && r.id_evaluador !== Number(evaluatorFilter)) return false;
      if (statusFilter) {
        const st = (r.estado || "pendiente").trim().toLowerCase();
        if (statusFilter === "finalizada" && !isEvaluationCompleted(st)) return false;
        if (statusFilter === "en proceso" && !(st === "en proceso" || st === "en progreso")) return false;
        if (statusFilter === "pendiente" && st !== "pendiente") return false;
      }
      if (orgFilter && r.id_empresa !== Number(orgFilter)) return false;
      if (dateFilter && (!r.fecha || String(r.fecha).slice(0, 10) !== dateFilter)) return false;

      if (!q) return true;
      const name = (orgName.get(r.id_empresa) ?? "").toLowerCase();
      const fName = (formNameById.get(r.id_formulario) ?? "").toLowerCase();
      const uName = (userById.get(r.id_usuario)?.name ?? "").toLowerCase();
      return (
        name.includes(q) ||
        fName.includes(q) ||
        uName.includes(q) ||
        String(r.id_evaluacion).includes(q)
      );
    });
  }, [filter, evaluatorFilter, statusFilter, orgFilter, dateFilter, rowsData, orgName, formNameById, userById]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, evaluatorFilter, statusFilter, orgFilter, dateFilter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const staff = isStaffRole(getCurrentRole());

  return (
    <div className="card" style={{ minHeight: 240 }}>
      <h2 style={{ marginTop: 8 }}>{staff ? "Evaluaciones" : "Mis Evaluaciones Asignadas"}</h2>
      {!staff && (
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
          Aquí puedes ver el avance de tus cuestionarios asignados y responder las preguntas pendientes. Una vez completada al 100%, la evaluación queda bloqueada y se entrega de forma confidencial al evaluador.
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: "1 1 200px" }}>
          <FilterInput value={filter} onChange={setFilter} placeholder="Buscar por formulario, empresa, ID..." />
        </div>
        {staff && (
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)", flex: "1 1 150px" }}
          >
            <option value="">Todas las empresas</option>
            {orgs.map((o) => (
              <option key={o.id_empresa} value={o.id_empresa}>{o.nombre}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", flex: "1 1 150px", color: dateFilter ? "var(--text-primary)" : "var(--muted)" }}
          title="Filtrar por fecha"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-page)", color: "var(--text-primary)", flex: "1 1 150px" }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en proceso">En progreso</option>
          <option value="finalizada">Finalizada</option>
        </select>
      </div>

      <div className="table-responsive-container">
        <table className="table-responsive">
          <thead>
            <tr>
              {staff && <th>Organización</th>}
              <th>ID</th>
              <th>Formulario</th>
              {staff && <th>Usuario Asignado (Empresa)</th>}
              <th>Fecha</th>
              <th>{staff ? "Estado" : "Etapa"}</th>
              <th>Avance / Pendiente</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={staff ? 8 : 6} style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                  Cargando evaluaciones...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={staff ? 8 : 6} style={{ padding: "32px 16px", borderTop: "1px solid var(--border)" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(220,38,38,0.05)",
                      border: "1px solid rgba(220,38,38,0.2)",
                      borderRadius: 10,
                      padding: "20px 24px",
                    }}
                  >
                    <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 14 }}>{error}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && rowsData.length === 0 && (
              <tr>
                <td colSpan={staff ? 8 : 6} style={{ padding: "40px 16px", borderTop: "1px solid var(--border)" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      color: "var(--muted)",
                      padding: "24px 8px",
                    }}
                  >
                    <span>No hay evaluaciones asignadas para mostrar.</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visibleRows.map((r) => {
                const completed = isEvaluationCompleted(r.estado);
                const titular = userById.get(r.id_usuario);
                const formTitle = formNameById.get(r.id_formulario) ?? `Formulario #${r.id_formulario}`;

                return (
                  <React.Fragment key={r.id_evaluacion}>
                    <tr>
                      {staff && (
                        <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", fontWeight: 600 }}>
                          {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
                        </td>
                      )}
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", fontWeight: 700 }}>
                        #{r.id_evaluacion}
                      </td>
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                        {formTitle}
                      </td>
                      {staff && (
                        <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 600 }}>
                            {titular ? titular.name : `Usuario #${r.id_usuario}`}
                          </div>
                          {titular?.role && (
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>
                              {titular.role}
                            </div>
                          )}
                        </td>
                      )}
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.fecha || "—"}</td>
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                        <Badge status={r.estado || "pendiente"} />
                      </td>
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", minWidth: 120 }}>
                        <ProgressCell evaluationId={r.id_evaluacion} />
                      </td>
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        {!staff ? (
                          completed ? (
                            <button
                              type="button"
                              className="btn"
                              disabled
                              style={{
                                padding: "8px 14px",
                                borderRadius: 8,
                                opacity: 0.55,
                                cursor: "not-allowed",
                                fontWeight: 700,
                              }}
                              title="Esta evaluación ya fue completada al 100% y enviada al evaluador"
                            >
                              Evaluación Completada
                            </button>
                          ) : (
                            <Link
                              to={`/evaluations/${r.id_evaluacion}/workflow`}
                              className="btn btn-primary"
                              style={{
                                padding: "8px 14px",
                                borderRadius: 8,
                                textDecoration: "none",
                                display: "inline-block",
                              }}
                            >
                              Responder
                            </Link>
                          )
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Link
                              to={`/evaluations/${r.id_evaluacion}/workflow?respond=1`}
                              className="btn btn-primary"
                              style={{ padding: "7px 12px", borderRadius: 8, textDecoration: "none", fontSize: 12 }}
                              title="Responder o auditar preguntas del formulario"
                            >
                              Responder / Auditar
                            </Link>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => setExpandedId(expandedId === r.id_evaluacion ? null : r.id_evaluacion)}
                              style={{ padding: "7px 10px", fontSize: 12 }}
                            >
                              {expandedId === r.id_evaluacion ? "Ocultar avance" : "Detalle avance"}
                            </button>
                            <Link
                              to={`/reports/${r.id_evaluacion}`}
                              className="btn"
                              style={{ padding: "7px 10px", borderRadius: 8, textDecoration: "none", fontSize: 12 }}
                            >
                              Informe
                            </Link>
                            <Link
                              to={`/results-dashboard/${r.id_evaluacion}`}
                              className="btn"
                              style={{ padding: "7px 10px", borderRadius: 8, textDecoration: "none", fontSize: 12 }}
                            >
                              Power BI
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedId === r.id_evaluacion && staff && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <EvaluationProgress evaluationId={r.id_evaluacion} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
          <div style={{ color: "var(--muted)" }}>Mostrando {visibleRows.length} de {rows.length} evaluaciones</div>
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
  );
};

export default EvaluationsTable;
