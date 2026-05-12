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

const EvaluationsTable: React.FC = () => {
  const [filter, setFilter] = useState("");
  const [evaluatorFilter, setEvaluatorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rowsData, setRowsData] = useState<EvaluationApiRow[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [evaluators, setEvaluators] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load evaluations first — this is the critical request
        const data = await listEvaluations();
        setRowsData(data);

        // Orgs & users are supplementary — non-staff roles may get 403, ignore errors
        const [o, users] = await Promise.all([
          dataService.getOrgs().catch(() => [] as Org[]),
          dataService.getUsers().catch(() => [] as { id: number; name: string }[]),
        ]);
        setOrgs(o as Org[]);
        setEvaluators(users);

        if (!isStaffRole(getCurrentRole()) && data.length > 0) {
          const org = (o as Org[]).find(x => x.id_empresa === data[0].id_empresa);
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

  const evalName = useMemo(() => {
    const m = new Map<number, string>();
    evaluators.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [evaluators]);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rowsData.filter((r) => {
      if (evaluatorFilter && r.id_evaluador !== Number(evaluatorFilter)) return false;
      if (statusFilter && r.estado !== statusFilter) return false;
      if (orgFilter && r.id_empresa !== Number(orgFilter)) return false;

      if (!q) return true;
      const name = (orgName.get(r.id_empresa) ?? "").toLowerCase();
      return (
        name.includes(q) ||
        String(r.id_evaluacion).includes(q)
      );
    });
  }, [filter, evaluatorFilter, statusFilter, orgFilter, rowsData, orgName]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, evaluatorFilter, statusFilter, orgFilter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const staff = isStaffRole(getCurrentRole());

  return (
    <div className="card" style={{ minHeight: 240 }}>
      {staff && (
        <p style={{ marginTop: 0, fontSize: 14, color: "var(--muted)" }}>
          Para <strong>asignar o mover</strong> evaluaciones entre empresas, usa{" "}
          <Link to="/asignaciones">Asignaciones empresa ↔ evaluación</Link>.
        </p>
      )}
      <h2 style={{ marginTop: 8 }}>Evaluaciones</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: "1 1 200px" }}>
          <FilterInput value={filter} onChange={setFilter} placeholder="Buscar por empresa, ID..." />
        </div>
        {staff && (
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-light)", flex: "1 1 150px" }}
          >
            <option value="">Todas las empresas</option>
            {orgs.map((o) => (
              <option key={o.id_empresa} value={o.id_empresa}>{o.nombre}</option>
            ))}
          </select>
        )}
        {!staff && (
          <select
            value={evaluatorFilter}
            onChange={(e) => setEvaluatorFilter(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-light)", flex: "1 1 150px" }}
          >
            <option value="">Todos los evaluadores</option>
            {evaluators.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-light)", flex: "1 1 150px" }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en proceso">En progreso</option>
          <option value="finalizada">Finalizada</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              {staff && <th style={{ padding: "12px 8px" }}>Organización</th>}
              {staff && <th style={{ padding: "12px 8px" }}>ID</th>}
              <th style={{ padding: "12px 8px" }}>Fecha</th>
              {!staff && <th style={{ padding: "12px 8px" }}>Evaluador asignado</th>}
              <th style={{ padding: "12px 8px" }}>{staff ? 'Estado' : 'Etapa'}</th>
              {!staff && <th style={{ padding: "12px 8px" }}>Avance</th>}
              <th style={{ padding: "12px 8px" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={staff ? 5 : 4} style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                  Cargando evaluaciones...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={staff ? 5 : 4}
                  style={{ padding: "32px 16px", borderTop: "1px solid var(--border)" }}
                >
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)",
                    borderRadius: 10, padding: "20px 24px",
                  }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                    <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 14 }}>{error}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && rowsData.length === 0 && (
              <tr>
                <td colSpan={staff ? 5 : 4} style={{ padding: "40px 16px", borderTop: "1px solid var(--border)" }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    color: "var(--muted)",
                  }}>
                    <span style={{ fontSize: 36 }}>📋</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Aún no hay evaluaciones registradas</span>
                    <span style={{ fontSize: 13 }}>
                      {staff
                        ? "Crea una nueva evaluación desde el módulo de Asignaciones."
                        : "Cuando el administrador te asigne una evaluación, aparecerá aquí."}
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visibleRows.map((r) => (
                <React.Fragment key={r.id_evaluacion}>
                  <tr>
                    {staff && (
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                        {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
                      </td>
                    )}
                    {staff && <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.id_evaluacion}</td>}
                    <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.fecha || "—"}</td>
                    {!staff && (
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", color: r.id_evaluador ? "inherit" : "var(--muted)" }}>
                        {r.id_evaluador ? evalName.get(r.id_evaluador) ?? `Usuario #${r.id_evaluador}` : "Sin asignar"}
                      </td>
                    )}
                    <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                      <Badge status={r.estado || "pendiente"} />
                    </td>
                    {!staff && (
                      <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", minWidth: 100 }}>
                        <ProgressCell evaluationId={r.id_evaluacion} />
                      </td>
                    )}
                    <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                      {!staff ? (
                        <Link
                          to={`/evaluations/${r.id_evaluacion}/workflow`}
                          className="btn btn-primary"
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            textDecoration: "none",
                            display: "inline-block",
                            marginRight: 8,
                          }}
                        >
                          Responder
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setExpandedId(expandedId === r.id_evaluacion ? null : r.id_evaluacion)}
                          style={{ marginRight: 8 }}
                        >
                          {expandedId === r.id_evaluacion ? "Ocultar progreso" : "Ver progreso ▾"}
                        </button>
                      )}
                      <Link
                        to={`/reports/${r.id_evaluacion}`}
                        className="btn"
                        style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
                      >
                        Informe
                      </Link>
                    </td>
                  </tr>
                  {expandedId === r.id_evaluacion && staff && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <EvaluationProgress evaluationId={r.id_evaluacion} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
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
