import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/theme.css";
import Badge from "./Badge";
import FilterInput from "./FilterInput";
import dataService from "../services/dataService";
import { listEvaluations, type EvaluationApiRow } from "../services/evaluationApi";

type Org = { id_empresa: number; nombre: string };

const EvaluationsTable: React.FC = () => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rowsData, setRowsData] = useState<EvaluationApiRow[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, o] = await Promise.all([listEvaluations(), dataService.getOrgs() as Promise<Org[]>]);
        setRowsData(data);
        setOrgs(o);
      } catch {
        setError("No se pudieron cargar las evaluaciones");
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

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rowsData;
    return rowsData.filter((r) => {
      const name = (orgName.get(r.id_empresa) ?? "").toLowerCase();
      return (
        name.includes(q) ||
        String(r.id_evaluacion).includes(q) ||
        (r.estado || "").toLowerCase().includes(q)
      );
    });
  }, [filter, rowsData, orgName]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <div className="card" style={{ minHeight: 240 }}>
      <p style={{ marginTop: 0, fontSize: 14, color: "var(--muted)" }}>
        Para <strong>asignar o mover</strong> evaluaciones entre empresas, usa{" "}
        <Link to="/asignaciones">Asignaciones empresa ↔ evaluación</Link>.
      </p>
      <h2 style={{ marginTop: 8 }}>Evaluaciones</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <FilterInput value={filter} onChange={setFilter} placeholder="Buscar por empresa, id o estado" />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              <th style={{ padding: "12px 8px" }}>Organización</th>
              <th style={{ padding: "12px 8px" }}>ID</th>
              <th style={{ padding: "12px 8px" }}>Fecha</th>
              <th style={{ padding: "12px 8px" }}>Estado</th>
              <th style={{ padding: "12px 8px" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                  Cargando evaluaciones...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", color: "var(--danger)" }}
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visibleRows.map((r) => (
                <tr key={r.id_evaluacion}>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                    {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
                  </td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.id_evaluacion}</td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>{r.fecha || "—"}</td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)" }}>
                    <Badge status={r.estado || "pendiente"} />
                  </td>
                  <td style={{ padding: "14px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
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
                      Flujo
                    </Link>
                    <Link
                      to={`/reports/${r.id_evaluacion}`}
                      className="btn"
                      style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
                    >
                      Informe
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
};

export default EvaluationsTable;
