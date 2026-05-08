import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dataService from "../services/dataService";
import { listEvaluations, type EvaluationApiRow } from "../services/evaluationApi";
import Badge from "./Badge";

type Org = { id_empresa: number; nombre: string };

function normalizeStatus(s: string): "pendiente" | "en progreso" | "completada" {
  const lower = (s || "").toLowerCase();
  if (lower === "en progreso" || lower === "en_progreso") return "en progreso";
  if (lower === "finalizado" || lower === "finalizada" || lower === "completada" || lower === "completado") return "completada";
  return "pendiente";
}

type SectionConfig = {
  key: "pendiente" | "en progreso" | "completada";
  label: string;
  accentColor: string;
  badgeBg: string;
};

const SECTIONS: SectionConfig[] = [
  { key: "pendiente",  label: "Evaluaciones Pendientes",   accentColor: "var(--orange-500)", badgeBg: "rgba(251,146,60,0.12)" },
  { key: "en progreso", label: "Evaluaciones En Proceso", accentColor: "var(--blue-500)",   badgeBg: "rgba(59,130,246,0.12)" },
  { key: "completada", label: "Evaluaciones Completadas",  accentColor: "var(--green-500)",  badgeBg: "rgba(34,197,94,0.12)"  },
];

type EvalTableProps = {
  rows: EvaluationApiRow[];
  orgName: Map<number, string>;
};

const EvalTable: React.FC<EvalTableProps> = ({ rows, orgName }) => {
  if (rows.length === 0) {
    return (
      <div style={{ padding: "20px 16px", color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
        No hay evaluaciones en esta categoría.
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--muted)", background: "var(--background)" }}>
            <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>Organización</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>ID</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>Fecha</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>Estado</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id_evaluacion} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "14px 16px", fontWeight: 500 }}>
                {orgName.get(r.id_empresa) ?? `Empresa #${r.id_empresa}`}
              </td>
              <td style={{ padding: "14px 16px", color: "var(--muted)" }}>#{r.id_evaluacion}</td>
              <td style={{ padding: "14px 16px" }}>{r.fecha || "—"}</td>
              <td style={{ padding: "14px 16px" }}>
                <Badge status={r.estado || "pendiente"} />
              </td>
              <td style={{ padding: "14px 16px", whiteSpace: "nowrap", display: "flex", gap: 8 }}>
                <Link
                  to={`/evaluations/${r.id_evaluacion}/workflow?respond=1`}
                  className="btn btn-primary"
                  style={{ padding: "7px 14px", borderRadius: 8, textDecoration: "none", fontSize: 13 }}
                >
                  Evaluar
                </Link>
                <Link
                  to={`/reports/${r.id_evaluacion}`}
                  className="btn"
                  style={{ padding: "7px 14px", borderRadius: 8, textDecoration: "none", fontSize: 13 }}
                >
                  Informe
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type AccordionSectionProps = {
  config: SectionConfig;
  rows: EvaluationApiRow[];
  orgName: Map<number, string>;
  open: boolean;
  onToggle: () => void;
};

const AccordionSection: React.FC<AccordionSectionProps> = ({ config, rows, orgName, open, onToggle }) => {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface-light, #fff)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderLeft: `4px solid ${config.accentColor}`,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 28,
              height: 28,
              borderRadius: 8,
              background: config.badgeBg,
              color: config.accentColor,
              fontWeight: 800,
              fontSize: 14,
              padding: "0 8px",
            }}
          >
            {rows.length}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--gray-900)" }}>{config.label}</span>
        </div>
        <span
          style={{
            fontSize: 18,
            color: "var(--muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            display: "inline-block",
            lineHeight: 1,
          }}
        >
          ▼
        </span>
      </button>

      {/* Body with smooth transition */}
      <div
        style={{
          maxHeight: open ? 2000 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <EvalTable rows={rows} orgName={orgName} />
        </div>
      </div>
    </div>
  );
};

const EvaluatorDashboard: React.FC = () => {
  const [rowsData, setRowsData] = useState<EvaluationApiRow[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keep pendiente open by default, others closed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pendiente: true,
    "en progreso": true,
    completada: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [evals, orgsData] = await Promise.all([listEvaluations(), dataService.getOrgs() as Promise<Org[]>]);
        setRowsData(evals);
        setOrgs(orgsData);
      } catch {
        setError("No se pudieron cargar las evaluaciones.");
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

  const grouped = useMemo(() => {
    const g: Record<string, EvaluationApiRow[]> = { pendiente: [], "en progreso": [], completada: [] };
    rowsData.forEach((r) => {
      const k = normalizeStatus(r.estado);
      g[k].push(r);
    });
    return g;
  }, [rowsData]);

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Cargando evaluaciones...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--danger)" }}>{error}</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {SECTIONS.map((sec) => (
        <AccordionSection
          key={sec.key}
          config={sec}
          rows={grouped[sec.key]}
          orgName={orgName}
          open={!!openSections[sec.key]}
          onToggle={() => toggle(sec.key)}
        />
      ))}
    </div>
  );
};

export default EvaluatorDashboard;
