import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import ConfirmModal from "../components/modal/ConfirmModal";
import dataService from "../services/dataService";
import { useAlert } from "../components/alerts/AlertProvider";
import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
  patchEvaluation,
  type EvaluationApiRow,
} from "../services/evaluationApi";

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };

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
  const [rows, setRows] = useState<EvaluationApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [reassignFor, setReassignFor] = useState<EvaluationApiRow | null>(null);
  const [reassignOrgId, setReassignOrgId] = useState<string>("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newEvalOrgId, setNewEvalOrgId] = useState<string>("");
  const [deleteFor, setDeleteFor] = useState<EvaluationApiRow | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const orgName = useMemo(() => {
    const m = new Map<number, string>();
    orgs.forEach((o) => m.set(o.id_empresa, o.nombre));
    return m;
  }, [orgs]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, ev] = await Promise.all([dataService.getOrgs() as Promise<Org[]>, listEvaluations()]);
      setOrgs(o);
      setRows(ev);
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

  const handleReassign = async () => {
    if (!reassignFor || !reassignOrgId) return;
    const newId = Number(reassignOrgId);
    if (Number.isNaN(newId)) return;
    try {
      setBusyId(reassignFor.id_evaluacion);
      await patchEvaluation(reassignFor.id_evaluacion, { id_empresa: newId });
      setReassignFor(null);
      setReassignOrgId("");
      await load();
    } catch (e) {
      showAlert({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "Error al reasignar",
      });
    } finally {
      setBusyId(null);
    }
  };

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

  const handleCreateForOrg = async (id_empresa: number) => {
    try {
      setBusyId(-1);
      const created = await createEvaluation({ id_empresa });
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

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <h2 style={{ marginTop: 0 }}>Asignaciones: empresa ↔ evaluación</h2>

        <div
          className="card"
          style={{
            marginBottom: 20,
            background: "var(--surface-muted, rgba(0,0,0,0.03))",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <strong>Organización del producto</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>
              <strong>Organizaciones</strong>: alta y edición del catálogo de empresas (datos generales).
            </li>
            <li>
              <strong>Evaluaciones</strong>: listado global del inventario de evaluaciones (fechas, estados).
            </li>
            <li>
              <strong>Esta pantalla</strong>: operar la <em>relación</em> evaluación–empresa (crear una evaluación ya
              ligada a una empresa, reasignar de una empresa a otra, abrir informe o eliminar la evaluación).
            </li>
          </ul>
          <p style={{ margin: "12px 0 0", color: "var(--muted)" }}>
            El alcance y el cuestionario por evaluación se abren con <strong>Alcance y cuestionario</strong> (URL{" "}
            <code>/evaluations/:evaluationId/workflow</code>); aquí se consolida sobre todo la empresa asignada a cada
            evaluación.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
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
                    <th style={{ padding: "10px 8px" }}>ID eval.</th>
                    <th style={{ padding: "10px 8px" }}>Fecha</th>
                    <th style={{ padding: "10px 8px" }}>Estado</th>
                    <th style={{ padding: "10px 8px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, color: "var(--muted)" }}>
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
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.id_evaluacion}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.fecha || "—"}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>{r.estado}</td>
                        <td style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                          <Link
                            to={`/evaluations/${r.id_evaluacion}/workflow`}
                            className="btn btn-primary"
                            style={{ textDecoration: "none", marginRight: 8 }}
                          >
                            Alcance y cuestionario
                          </Link>
                          <Link
                            to={`/reports/${r.id_evaluacion}`}
                            className="btn"
                            style={{ textDecoration: "none", marginRight: 8 }}
                          >
                            Ver informe
                          </Link>
                          <button
                            type="button"
                            className="btn"
                            disabled={busyId === r.id_evaluacion}
                            onClick={() => {
                              setReassignFor(r);
                              setReassignOrgId(String(r.id_empresa));
                            }}
                          >
                            Reasignar empresa
                          </button>
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

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Nueva evaluación ligada a una empresa</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 0 }}>
            Crea una evaluación asociada a la empresa y abre el flujo (alcance + cuestionario).
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0, marginBottom: 10 }}>* Campo obligatorio</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13 }}>Empresa *</label>
            <select
              value={newEvalOrgId}
              onChange={(e) => setNewEvalOrgId(e.target.value)}
              required
              aria-required="true"
              style={{ padding: 8, borderRadius: 8, minWidth: 220, border: "1px solid var(--border)" }}
            >
              <option value="">Seleccione…</option>
              {orgs.map((o) => (
                <option key={o.id_empresa} value={String(o.id_empresa)}>
                  {o.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === -1}
              onClick={() => {
                const v = Number(newEvalOrgId);
                if (!v) {
                  showAlert({
                    type: "warning",
                    title: "Advertencia",
                    message: "Seleccione una empresa.",
                  });
                  return;
                }
                void handleCreateForOrg(v);
              }}
            >
              Crear y abrir flujo
            </button>
          </div>
        </div>

        {reassignFor && (
          <div
            role="dialog"
            aria-modal
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
          >
            <div className="card" style={{ width: 400, maxWidth: "92%", padding: 20 }}>
              <h4 style={{ marginTop: 0 }}>Reasignar evaluación #{reassignFor.id_evaluacion}</h4>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>Nueva empresa responsable:</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0, marginBottom: 8 }}>* Campo obligatorio</p>
              <select
                value={reassignOrgId}
                onChange={(e) => setReassignOrgId(e.target.value)}
                required
                aria-required="true"
                style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 8 }}
              >
                {orgs.map((o) => (
                  <option key={o.id_empresa} value={String(o.id_empresa)}>
                    {o.nombre}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setReassignFor(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" disabled={busyId != null} onClick={() => void handleReassign()}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
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
