import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
  loadPowerBiDataset,
  levelFromScore,
  type EnrichedQuestionAnswer,
  type IsoAnnexCategory,
  type NistFunction,
  type OrgLevelTier,
  type PowerBiDataset,
} from "../services/reportApi";

const NIST_ORDER: NistFunction[] = ["Identificar", "Proteger", "Detectar", "Responder", "Recuperar"];
const ANNEX_ORDER: IsoAnnexCategory[] = [
  "A.5 Organizacionales",
  "A.6 Personas",
  "A.7 Físicos",
  "A.8 Tecnológicos",
];
const TIER_ORDER: OrgLevelTier[] = [
  "Nivel Bajo (Operativo / Colaboradores)",
  "Nivel Medio (Técnico / TI)",
  "Nivel Alto (Estratégico / Dirección)",
];

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function calcWeightedScore(items: EnrichedQuestionAnswer[]): number {
  let sum = 0;
  let weights = 0;
  for (const r of items) {
    if (r.score !== null) {
      sum += r.score * r.peso;
      weights += r.peso;
    }
  }
  return weights > 0 ? Math.round(sum / weights) : 0;
}

// ── Radar SVG Interactivo (5 Ejes NIST CSF / ISO 27002 Conceptos) ─────────────
const NistRadarChart: React.FC<{
  data: { func: NistFunction; score: number; count: number }[];
  selectedNist: NistFunction | "";
  onSelectNist: (f: NistFunction | "") => void;
}> = ({ data, selectedNist, onSelectNist }) => {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 102;
  const levels = [20, 40, 60, 80, 100];

  const pointsForPolygon = (pctValues: number[]) =>
    pctValues
      .map((pct, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const r = (pct / 100) * radius;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(" ");

  const targetPolygon = pointsForPolygon(data.map(() => 80)); // Meta óptima ISO 80%
  const actualPolygon = pointsForPolygon(data.map((d) => d.score));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 310, overflow: "visible" }}>
        {/* Anillos concéntricos */}
        {levels.map((lvl) => (
          <polygon
            key={lvl}
            points={pointsForPolygon(data.map(() => lvl))}
            fill="none"
            stroke="var(--border)"
            strokeWidth={lvl === 80 ? 1.5 : 1}
            strokeDasharray={lvl === 80 ? "4 3" : undefined}
          />
        ))}
        {/* Ejes */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const x2 = cx + radius * Math.cos(angle);
          const y2 = cy + radius * Math.sin(angle);
          const lx = cx + (radius + 32) * Math.cos(angle);
          const ly = cy + (radius + 26) * Math.sin(angle);
          const isSelected = selectedNist === d.func;
          const col = scoreColor(d.score);

          return (
            <g
              key={d.func}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectNist(isSelected ? "" : d.func)}
            >
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--border)" strokeWidth={1} />
              <text
                x={lx}
                y={ly - 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isSelected ? 800 : 700}
                fill={isSelected ? "#2563eb" : "var(--text-primary, #1e293b)"}
              >
                {d.func}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill={col}
              >
                {d.score}%
              </text>
            </g>
          );
        })}
        {/* Meta recomendada (80%) */}
        <polygon points={targetPolygon} fill="rgba(22,163,74,0.05)" stroke="#16a34a" strokeWidth={1.2} strokeDasharray="4 3" />
        {/* Postura actual */}
        <polygon
          points={actualPolygon}
          fill="rgba(37,99,235,0.22)"
          stroke="#2563eb"
          strokeWidth={2.5}
        />
        {/* Puntos interactivos */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const r = (d.score / 100) * radius;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          const isSelected = selectedNist === d.func;
          return (
            <circle
              key={d.func}
              cx={px}
              cy={py}
              r={isSelected ? 7 : 5}
              fill={scoreColor(d.score)}
              stroke="#fff"
              strokeWidth={2}
              style={{ cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => onSelectNist(isSelected ? "" : d.func)}
            >
              <title>{`${d.func}: ${d.score}% (${d.count} preguntas) — Clic para filtrar`}</title>
            </circle>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
          Postura Actual
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
          Umbral Meta SGSI (80%)
        </span>
      </div>
    </div>
  );
};

// ── Componente Principal Power BI Dashboard ───────────────────────────────────
export const ResultsDashboardPage: React.FC = () => {
  const { id: routeEvalId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [dataset, setDataset] = useState<PowerBiDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Segmentadores principales (Slicers estilo Power BI) ──────────────────────
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<OrgLevelTier | "">("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedEvalId, setSelectedEvalId] = useState<string>(routeEvalId || searchParams.get("eval") || "");

  // ── Filtros cruzados interactivos (Cross-filtering al hacer clic en gráficas) ─
  const [selectedAnnex, setSelectedAnnex] = useState<IsoAnnexCategory | "">("");
  const [selectedNist, setSelectedNist] = useState<NistFunction | "">("");
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedNature, setSelectedNature] = useState<"General" | "Documentación" | "">("");
  const [onlyOsint, setOnlyOsint] = useState<boolean>(false);
  const [onlyCriticalGaps, setOnlyCriticalGaps] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"executive" | "iso_matrix" | "audit_table">("executive");

  // ── Estado de Ordenamiento y Filtros por Columna en la Matriz Detallada ──
  type MatrixSortColumn = "level" | "domain" | "nist" | "question" | "peso" | "score" | "comment" | "";
  const [matrixSortCol, setMatrixSortCol] = useState<MatrixSortColumn>("");
  const [matrixSortDir, setMatrixSortDir] = useState<"asc" | "desc">("asc");

  const [colLevelFilter, setColLevelFilter] = useState<string>("");
  const [colDomainFilter, setColDomainFilter] = useState<string>("");
  const [colNistFilter, setColNistFilter] = useState<string>("");
  const [colQuestionFilter, setColQuestionFilter] = useState<string>("");
  const [colPesoFilter, setColPesoFilter] = useState<string>("");
  const [colScoreFilter, setColScoreFilter] = useState<string>("");
  const [colCommentFilter, setColCommentFilter] = useState<string>("");

  const handleMatrixSort = (col: Exclude<MatrixSortColumn, "">) => {
    if (matrixSortCol !== col) {
      setMatrixSortCol(col);
      setMatrixSortDir("asc");
    } else if (matrixSortDir === "asc") {
      setMatrixSortDir("desc");
    } else {
      setMatrixSortCol("");
      setMatrixSortDir("asc");
    }
  };

  const clearMatrixColumnFilters = () => {
    setMatrixSortCol("");
    setMatrixSortDir("asc");
    setColLevelFilter("");
    setColDomainFilter("");
    setColNistFilter("");
    setColQuestionFilter("");
    setColPesoFilter("");
    setColScoreFilter("");
    setColCommentFilter("");
  };

  const hasMatrixColumnFilters =
    Boolean(matrixSortCol) ||
    Boolean(colLevelFilter) ||
    Boolean(colDomainFilter) ||
    Boolean(colNistFilter) ||
    Boolean(colQuestionFilter.trim()) ||
    Boolean(colPesoFilter) ||
    Boolean(colScoreFilter) ||
    Boolean(colCommentFilter);

  useEffect(() => {
    setLoading(true);
    loadPowerBiDataset()
      .then((ds) => {
        setDataset(ds);
        // Si venimos de /reports/:id, preseleccionamos la organización y esa evaluación
        const initialEvalId = routeEvalId || searchParams.get("eval");
        if (initialEvalId) {
          const ev = ds.evaluations.find((e) => String(e.id) === String(initialEvalId));
          if (ev) {
            setSelectedOrgId(String(ev.orgId));
            setSelectedEvalId(String(ev.id));
          }
        } else if (ds.organizations.length === 1) {
          setSelectedOrgId(String(ds.organizations[0].id));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando analíticas"))
      .finally(() => setLoading(false));
  }, [routeEvalId, searchParams]);

  // Evaluaciones disponibles según los slicers superiores
  const availableEvaluations = useMemo(() => {
    if (!dataset) return [];
    return dataset.evaluations.filter((e) => {
      if (selectedOrgId && String(e.orgId) !== selectedOrgId) return false;
      if (selectedTier && e.levelTier !== selectedTier) return false;
      if (selectedFormId && String(e.formularioId) !== selectedFormId) return false;
      return true;
    });
  }, [dataset, selectedOrgId, selectedTier, selectedFormId]);

  // Registros filtrados por Slicers Superiores (Base para gráficos comparativos)
  const slicerRecords = useMemo(() => {
    if (!dataset) return [];
    return dataset.records.filter((r) => {
      if (selectedOrgId && String(r.orgId) !== selectedOrgId) return false;
      if (selectedTier && r.levelTier !== selectedTier) return false;
      if (selectedFormId && String(r.formularioId) !== selectedFormId) return false;
      if (selectedEvalId && String(r.evaluationId) !== selectedEvalId) return false;
      return true;
    });
  }, [dataset, selectedOrgId, selectedTier, selectedFormId, selectedEvalId]);

  // Registros filtrados además por el Cross-Filtering de las gráficas
  const activeRecords = useMemo(() => {
    return slicerRecords.filter((r) => {
      if (selectedAnnex && r.annexCategory !== selectedAnnex) return false;
      if (selectedNist && r.nistFunction !== selectedNist) return false;
      if (selectedDomain && r.thematicDomain !== selectedDomain) return false;
      if (selectedNature && r.nature !== selectedNature) return false;
      if (onlyOsint && !r.isOsintVector) return false;
      if (onlyCriticalGaps && !(r.score !== null && r.score <= 40 && r.peso >= 1.0)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !r.questionText.toLowerCase().includes(q) &&
          !r.thematicDomain.toLowerCase().includes(q) &&
          !r.isoControlRef.toLowerCase().includes(q) &&
          !(r.comentario || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    slicerRecords,
    selectedAnnex,
    selectedNist,
    selectedDomain,
    selectedNature,
    onlyOsint,
    onlyCriticalGaps,
    searchQuery,
  ]);

  // ── Cálculos de KPIs y Agregaciones en Tiempo Real ──────────────────────────
  const metrics = useMemo(() => {
    const answered = activeRecords.filter((r) => r.score !== null);
    const globalScore = calcWeightedScore(answered);
    const maturity = levelFromScore(globalScore);

    // Documentación (Cláusula 7.5) vs Práctica Operativa (General)
    const docItems = answered.filter((r) => r.nature === "Documentación");
    const genItems = answered.filter((r) => r.nature === "General");
    const docScore = calcWeightedScore(docItems);
    const genScore = calcWeightedScore(genItems);

    // Superficie de Exposición OSINT & Ingeniería Social (Control A.5.7 / OSINT 2019)
    const osintItems = answered.filter((r) => r.isOsintVector);
    const osintProtectionScore = calcWeightedScore(osintItems);
    const osintExposureRisk = osintItems.length > 0 ? 100 - osintProtectionScore : 0;

    // Brechas críticas (Peso 1.0 con respuesta <= 2, es decir score <= 40)
    const criticalGaps = answered.filter((r) => r.peso >= 1.0 && (r.score ?? 0) <= 40);
    const highStrengths = answered.filter((r) => (r.score ?? 0) >= 80);

    // Distribución Likert (1 a 5 normalizado)
    const likertCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of answered) {
      const v = r.normalizedValor as 1 | 2 | 3 | 4 | 5 | undefined;
      if (v && likertCounts[v] !== undefined) likertCounts[v]++;
    }

    // Por Función NIST CSF (5 conceptos ISO 27002)
    const byNist = NIST_ORDER.map((func) => {
      const subset = slicerRecords.filter((r) => r.nistFunction === func && r.score !== null);
      return {
        func,
        score: calcWeightedScore(subset),
        count: subset.length,
      };
    });

    // Por Categoría Anexo A ISO 27001:2022 (A.5, A.6, A.7, A.8)
    const byAnnex = ANNEX_ORDER.map((cat) => {
      const subset = slicerRecords.filter((r) => r.annexCategory === cat && r.score !== null);
      return {
        cat,
        score: calcWeightedScore(subset),
        count: subset.length,
      };
    });

    // Por Propiedad CIA (Tríada de Seguridad)
    const ciaScores = {
      Confidencialidad: calcWeightedScore(answered.filter((r) => r.cia.c)),
      Integridad: calcWeightedScore(answered.filter((r) => r.cia.i)),
      Disponibilidad: calcWeightedScore(answered.filter((r) => r.cia.a)),
    };

    // Por Tipo de Control (Preventivo, Detectivo, Correctivo)
    const controlTypeScores = (["Preventivo", "Detectivo", "Correctivo"] as const).map((ct) => ({
      type: ct,
      score: calcWeightedScore(answered.filter((r) => r.controlType === ct)),
      count: answered.filter((r) => r.controlType === ct).length,
    }));

    // Por Nivel Organizacional (Bajo, Medio, Alto) dentro del alcance de la Organización
    const orgScopeRecords = dataset
      ? dataset.records.filter((r) => (!selectedOrgId || String(r.orgId) === selectedOrgId) && r.score !== null)
      : [];
    const byTier = TIER_ORDER.map((tier) => {
      const subset = orgScopeRecords.filter((r) => r.levelTier === tier);
      const evalsCount = new Set(subset.map((s) => s.evaluationId)).size;
      return {
        tier,
        shortLabel: tier.split(" (")[0],
        roleDesc: tier.includes("Bajo")
          ? "Cultura y Hábitos (Colaboradores)"
          : tier.includes("Medio")
            ? "Controles Técnicos (Sistemas y TI)"
            : "Gobierno y Riesgos (Alta Dirección)",
        score: calcWeightedScore(subset),
        count: subset.length,
        evalsCount,
      };
    });

    // Detector de Brecha de Percepción Directiva vs. TI (Las 8 preguntas compartidas tec_est)
    const sharedQuestionsMap = new Map<
      string,
      {
        text: string;
        domain: string;
        isoRef: string;
        annex: string;
        nist: string;
        peso: number;
        recommendation: string;
        tiScores: number[];
        dirScores: number[];
        tiValores: number[];
        dirValores: number[];
        tiComments: string[];
        dirComments: string[];
        tiUsers: string[];
        dirUsers: string[];
      }
    >();
    for (const r of orgScopeRecords) {
      if (!r.isSharedTecEst || r.score === null) continue;
      const key = r.questionText;
      if (!sharedQuestionsMap.has(key)) {
        sharedQuestionsMap.set(key, {
          text: r.questionText,
          domain: r.thematicDomain,
          isoRef: r.isoControlRef,
          annex: r.annexCategory,
          nist: r.nistFunction,
          peso: r.peso,
          recommendation: r.recommendation,
          tiScores: [],
          dirScores: [],
          tiValores: [],
          dirValores: [],
          tiComments: [],
          dirComments: [],
          tiUsers: [],
          dirUsers: [],
        });
      }
      const entry = sharedQuestionsMap.get(key)!;
      if (r.levelTier.includes("Medio")) {
        entry.tiScores.push(r.score);
        if (r.normalizedValor !== undefined) entry.tiValores.push(r.normalizedValor);
        if (r.comentario) entry.tiComments.push(r.comentario);
        if (r.userName && !entry.tiUsers.includes(r.userName)) entry.tiUsers.push(r.userName);
      }
      if (r.levelTier.includes("Alto")) {
        entry.dirScores.push(r.score);
        if (r.normalizedValor !== undefined) entry.dirValores.push(r.normalizedValor);
        if (r.comentario) entry.dirComments.push(r.comentario);
        if (r.userName && !entry.dirUsers.includes(r.userName)) entry.dirUsers.push(r.userName);
      }
    }
    const perceptionGaps = Array.from(sharedQuestionsMap.values())
      .map((item) => {
        const tiAvg = item.tiScores.length
          ? Math.round(item.tiScores.reduce((a, b) => a + b, 0) / item.tiScores.length)
          : null;
        const dirAvg = item.dirScores.length
          ? Math.round(item.dirScores.reduce((a, b) => a + b, 0) / item.dirScores.length)
          : null;
        const tiValAvg = item.tiValores.length
          ? Math.round((item.tiValores.reduce((a, b) => a + b, 0) / item.tiValores.length) * 10) / 10
          : null;
        const dirValAvg = item.dirValores.length
          ? Math.round((item.dirValores.reduce((a, b) => a + b, 0) / item.dirValores.length) * 10) / 10
          : null;
        const delta = dirAvg !== null && tiAvg !== null ? dirAvg - tiAvg : 0;
        return { ...item, tiAvg, dirAvg, tiValAvg, dirValAvg, delta };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // Agrupación por los 18 Dominios Temáticos ISO 27001
    const domainMap = new Map<
      string,
      {
        domain: string;
        isoRef: string;
        annex: IsoAnnexCategory;
        nist: NistFunction;
        items: EnrichedQuestionAnswer[];
        recommendation: string;
      }
    >();
    for (const r of activeRecords) {
      if (!domainMap.has(r.thematicDomain)) {
        domainMap.set(r.thematicDomain, {
          domain: r.thematicDomain,
          isoRef: r.isoControlRef,
          annex: r.annexCategory,
          nist: r.nistFunction,
          items: [],
          recommendation: r.recommendation,
        });
      }
      domainMap.get(r.thematicDomain)!.items.push(r);
    }
    const byDomain = Array.from(domainMap.values())
      .map((d) => {
        const ans = d.items.filter((i) => i.score !== null);
        const sc = calcWeightedScore(ans);
        const critCount = ans.filter((i) => (i.score ?? 0) <= 40 && i.peso >= 1.0).length;
        return {
          ...d,
          score: sc,
          answeredCount: ans.length,
          totalCount: d.items.length,
          criticalCount: critCount,
        };
      })
      .sort((a, b) => a.score - b.score);

    // Vectores OSINT desglosados
    const osintMap = new Map<string, EnrichedQuestionAnswer[]>();
    for (const r of answered) {
      if (!r.isOsintVector || !r.osintCategory) continue;
      if (!osintMap.has(r.osintCategory)) osintMap.set(r.osintCategory, []);
      osintMap.get(r.osintCategory)!.push(r);
    }
    const osintBreakdown = Array.from(osintMap.entries())
      .map(([category, items]) => {
        const protection = calcWeightedScore(items);
        return {
          category,
          protection,
          exposure: 100 - protection,
          count: items.length,
        };
      })
      .sort((a, b) => b.exposure - a.exposure);

    return {
      totalRecords: activeRecords.length,
      answeredCount: answered.length,
      globalScore,
      maturity,
      docScore,
      genScore,
      docCount: docItems.length,
      genCount: genItems.length,
      osintProtectionScore,
      osintExposureRisk,
      osintCount: osintItems.length,
      criticalGaps,
      highStrengths,
      likertCounts,
      byNist,
      byAnnex,
      ciaScores,
      controlTypeScores,
      byTier,
      perceptionGaps,
      byDomain,
      osintBreakdown,
    };
  }, [activeRecords, slicerRecords, dataset, selectedOrgId]);

  const clearCrossFilters = () => {
    setSelectedAnnex("");
    setSelectedNist("");
    setSelectedDomain("");
    setSelectedNature("");
    setOnlyOsint(false);
    setOnlyCriticalGaps(false);
    setSearchQuery("");
    clearMatrixColumnFilters();
  };

  // ── Filtrado y Ordenamiento por Columna de la Matriz Detallada ──
  const matrixAvailableDomains = useMemo(() => {
    return Array.from(new Set(activeRecords.map((r) => r.thematicDomain))).sort((a, b) => a.localeCompare(b));
  }, [activeRecords]);

  const matrixDisplayRecords = useMemo(() => {
    const filtered = activeRecords.filter((r) => {
      // 1. Filtro Columna Nivel / Evaluado
      if (colLevelFilter) {
        if (colLevelFilter === "Nivel Bajo" && !r.levelTier.includes("Bajo")) return false;
        if (colLevelFilter === "Nivel Medio" && !r.levelTier.includes("Medio")) return false;
        if (colLevelFilter === "Nivel Alto" && !r.levelTier.includes("Alto")) return false;
      }

      // 2. Filtro Columna Dominio & Control ISO
      if (colDomainFilter) {
        if (colDomainFilter === "__OSINT__") {
          if (!r.isOsintVector) return false;
        } else if (colDomainFilter.startsWith("ANNEX:")) {
          const annexVal = colDomainFilter.replace("ANNEX:", "");
          if (r.annexCategory !== annexVal) return false;
        } else if (r.thematicDomain !== colDomainFilter) {
          return false;
        }
      }

      // 3. Filtro Columna NIST / Tipo / Naturaleza
      if (colNistFilter) {
        if (colNistFilter.startsWith("NIST:")) {
          if (r.nistFunction !== colNistFilter.replace("NIST:", "")) return false;
        } else if (colNistFilter.startsWith("TYPE:")) {
          if (r.controlType !== colNistFilter.replace("TYPE:", "")) return false;
        } else if (colNistFilter.startsWith("NAT:")) {
          if (r.nature !== colNistFilter.replace("NAT:", "")) return false;
        }
      }

      // 4. Filtro Columna Pregunta Evaluada
      if (colQuestionFilter.trim()) {
        const qf = colQuestionFilter.toLowerCase().trim();
        const matchesText = r.questionText.toLowerCase().includes(qf);
        const matchesReverse = qf.includes("inversa") && r.isReverseCoded;
        if (!matchesText && !matchesReverse) return false;
      }

      // 5. Filtro Columna Peso
      if (colPesoFilter) {
        if (String(r.peso) !== colPesoFilter) return false;
      }

      // 6. Filtro Columna Score
      if (colScoreFilter) {
        const sc = r.score ?? -1;
        if (colScoreFilter === "BRECHA" && !(sc >= 0 && sc <= 40)) return false;
        if (colScoreFilter === "PROCESO" && sc !== 60) return false;
        if (colScoreFilter === "MADURO" && sc < 80) return false;
        if (["20", "40", "60", "80", "100"].includes(colScoreFilter) && String(sc) !== colScoreFilter) return false;
      }

      // 7. Filtro Columna Evidencia / Comentario
      if (colCommentFilter) {
        const hasCom = Boolean(r.comentario && r.comentario.trim());
        if (colCommentFilter === "__WITH_COMMENT__" && !hasCom) return false;
        if (colCommentFilter === "__NO_COMMENT__" && hasCom) return false;
        if (
          colCommentFilter !== "__WITH_COMMENT__" &&
          colCommentFilter !== "__NO_COMMENT__" &&
          !(r.comentario || "").toLowerCase().includes(colCommentFilter.toLowerCase().trim())
        ) {
          return false;
        }
      }

      return true;
    });

    if (!matrixSortCol) return filtered;

    const dirMultiplier = matrixSortDir === "asc" ? 1 : -1;
    const tierRank = (t: string) => (t.includes("Bajo") ? 1 : t.includes("Medio") ? 2 : 3);

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (matrixSortCol) {
        case "level":
          cmp = tierRank(a.levelTier) - tierRank(b.levelTier) || a.userName.localeCompare(b.userName);
          break;
        case "domain":
          cmp = a.thematicDomain.localeCompare(b.thematicDomain) || a.isoControlRef.localeCompare(b.isoControlRef);
          break;
        case "nist":
          cmp = a.nistFunction.localeCompare(b.nistFunction) || a.controlType.localeCompare(b.controlType);
          break;
        case "question":
          cmp = a.questionText.localeCompare(b.questionText);
          break;
        case "peso":
          cmp = a.peso - b.peso;
          break;
        case "score":
          cmp = (a.score ?? -1) - (b.score ?? -1);
          break;
        case "comment":
          cmp = (a.comentario || "").localeCompare(b.comentario || "");
          break;
      }
      return cmp * dirMultiplier;
    });
  }, [
    activeRecords,
    colLevelFilter,
    colDomainFilter,
    colNistFilter,
    colQuestionFilter,
    colPesoFilter,
    colScoreFilter,
    colCommentFilter,
    matrixSortCol,
    matrixSortDir,
  ]);

  const hasCrossFilters =
    Boolean(selectedAnnex) ||
    Boolean(selectedNist) ||
    Boolean(selectedDomain) ||
    Boolean(selectedNature) ||
    onlyOsint ||
    onlyCriticalGaps ||
    Boolean(searchQuery.trim());

  const currentOrgName = useMemo(() => {
    if (!dataset) return "Todas las Organizaciones";
    if (!selectedOrgId) return "Consolidado Multi-Organización";
    return dataset.organizations.find((o) => String(o.id) === selectedOrgId)?.name ?? `Organización #${selectedOrgId}`;
  }, [dataset, selectedOrgId]);

  return (
    <Layout>
      <div style={{ padding: "20px 24px", maxWidth: 1440, margin: "0 auto" }}>
        {/* ── Encabezado Ejecutivo ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "var(--blue-700, #1d4ed8)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: 6,
                  letterSpacing: 0.6,
                }}
              >
                ISO/IEC 27001:2022 · ISO 27002 · NIST CSF · OSINT
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                Centro de Inteligencia y Analítica Interactiva (Power BI Mode)
              </span>
            </div>
            <h2 style={{ margin: "6px 0 2px 0", fontSize: 24, fontWeight: 800 }}>
              Dashboard de Postura de Ciberseguridad — {currentOrgName}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Haz clic en cualquier gráfico, barra o eje del radar para filtrar en tiempo real los hallazgos, controles ISO y evidencias.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedEvalId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedEvalId("");
                  setSelectedFormId("");
                  setSelectedTier("");
                }}
                title="Consolidar todos los cuestionarios aplicados a los miembros de esta organización"
              >
                Ver Consolidado 360° de la Organización
              </button>
            )}
            <button type="button" className="btn" onClick={() => window.print()}>
              Exportar / Imprimir Informe
            </button>
            <Link to="/reports" className="btn" style={{ textDecoration: "none" }}>
              Lista de Evaluaciones
            </Link>
          </div>
        </div>

        {/* ── Barra Superior de Segmentadores (Slicers estilo Power BI) ── */}
        <div
          className="card"
          style={{
            position: "sticky",
            top: 8,
            zIndex: 30,
            padding: "14px 18px",
            marginBottom: 20,
            borderTop: "4px solid var(--blue-600, #2563eb)",
            boxShadow: "0 8px 20px rgba(2,6,23,0.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
                1. Entidad / Organización
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedEvalId("");
                }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600, background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Todas las organizaciones ({dataset?.organizations.length ?? 0})</option>
                {dataset?.organizations.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name} ({o.sector})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
                2. Nivel Organizacional (Rol)
              </label>
              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value as OrgLevelTier | "");
                  setSelectedEvalId("");
                }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600, background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Todos los Niveles (Vista 360°)</option>
                {TIER_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
                3. Cuestionario / Formulario
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setSelectedEvalId("");
                }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600, background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Todos los cuestionarios aplicados</option>
                {dataset?.questionnaires.map((q) => (
                  <option key={q.id} value={String(q.id)}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
                4. Evaluación / Miembro Específico
              </label>
              <select
                value={selectedEvalId}
                onChange={(e) => setSelectedEvalId(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600, background: "var(--bg-page)", color: "var(--text-primary)" }}
              >
                <option value="">Consolidado ({availableEvaluations.length} evaluaciones)</option>
                {availableEvaluations.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    Eval #{ev.id} · {ev.userName} ({ev.levelTier.split(" (")[0]}) — {ev.weightedScore}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Píldoras de Filtros Cruzados Activos */}
          {hasCrossFilters && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px dashed var(--border)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--blue-600, #2563eb)" }}>
                Filtros cruzados activos:
              </span>
              {selectedAnnex && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setSelectedAnnex("")}>
                  Anexo: {selectedAnnex} (Quitar)
                </button>
              )}
              {selectedNist && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setSelectedNist("")}>
                  Función NIST: {selectedNist} (Quitar)
                </button>
              )}
              {selectedDomain && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setSelectedDomain("")}>
                  Dominio: {selectedDomain} (Quitar)
                </button>
              )}
              {selectedNature && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setSelectedNature("")}>
                  Evidencia: {selectedNature} (Quitar)
                </button>
              )}
              {onlyOsint && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setOnlyOsint(false)}>
                  Solo Vectores OSINT (Quitar)
                </button>
              )}
              {onlyCriticalGaps && (
                <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setOnlyCriticalGaps(false)}>
                  Solo Brechas Críticas - Peso 1.0 (Quitar)
                </button>
              )}
              <button
                type="button"
                onClick={clearCrossFilters}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "var(--danger, #dc2626)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Procesando cubos analíticos ISO 27001 / NIST CSF / OSINT...
          </div>
        )}
        {error && (
          <div className="card" style={{ padding: 24, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {!loading && !error && dataset && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* ── BLOQUE 1: 5 Tarjetas KPI Ejecutivas (ISO/IEC 27004:2016) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {/* KPI 1: Índice de Madurez Ponderado */}
              <div className="card" style={{ padding: 18, borderLeft: `5px solid ${metrics.maturity.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  1. Madurez Global Ponderada (ISO 27004)
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: metrics.maturity.color }}>
                    {metrics.globalScore}%
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: `${metrics.maturity.color}18`,
                      color: metrics.maturity.color,
                    }}
                  >
                    {metrics.maturity.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  Ponderado por criticidad de control (<code>peso 1.0 / 0.7 / 0.4</code>) sobre{" "}
                  <strong>{metrics.answeredCount}</strong> respuestas evaluadas.
                </div>
              </div>

              {/* KPI 2: Coherencia Documental vs Práctica (Cláusula 7.5 vs 8) */}
              <div
                className="card"
                style={{
                  padding: 18,
                  borderLeft: "5px solid #2563eb",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSelectedNature(
                    selectedNature === "" ? "Documentación" : selectedNature === "Documentación" ? "General" : ""
                  )
                }
                title="Clic para alternar filtro entre Documentación formal y Práctica operativa"
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  2. Políticas (Cl. 7.5) vs. Operación Real
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Documentación</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(metrics.docScore) }}>
                      {metrics.docScore}%
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--muted)", fontWeight: 700 }}>vs.</div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Práctica Operativa</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(metrics.genScore) }}>
                      {metrics.genScore}%
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  {metrics.docScore - metrics.genScore >= 15
                    ? "Alerta: 'Seguridad en Papel' (políticas escritas que no se cumplen en la práctica)."
                    : metrics.genScore - metrics.docScore >= 15
                      ? "Alerta Auditoría: Controles empíricos sin soporte documental formal (Riesgo de No Conformidad Cl. 7.5)."
                      : "Coherencia equilibrada entre diseño normativo y ejecución."}
                </div>
              </div>

              {/* KPI 3: Superficie de Exposición OSINT e Ingeniería Social */}
              <div
                className="card"
                style={{
                  padding: 18,
                  borderLeft: `5px solid ${metrics.osintExposureRisk > 40 ? "#dc2626" : "#16a34a"}`,
                  cursor: "pointer",
                  background: onlyOsint ? "rgba(37,99,235,0.06)" : undefined,
                }}
                onClick={() => setOnlyOsint(!onlyOsint)}
                title="Clic para filtrar los vectores de exposición OSINT e Ingeniería Social"
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  3. Exposición Externa OSINT (Control A.5.7)
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: metrics.osintExposureRisk > 40 ? "#dc2626" : "#d97706",
                    }}
                  >
                    {metrics.osintExposureRisk}%
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                    Riesgo de Reconocimiento ({metrics.osintProtectionScore}% protegido)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  Evalúa {metrics.osintCount} vectores explotables vía OSINT (fuga en RRSS, phishing, credenciales, cloud).
                </div>
              </div>

              {/* KPI 4: Vectores Críticos Abiertos */}
              <div
                className="card"
                style={{
                  padding: 18,
                  borderLeft: `5px solid ${metrics.criticalGaps.length > 0 ? "#dc2626" : "#16a34a"}`,
                  cursor: "pointer",
                  background: onlyCriticalGaps ? "rgba(220,38,38,0.06)" : undefined,
                }}
                onClick={() => setOnlyCriticalGaps(!onlyCriticalGaps)}
                title="Clic para aislar las brechas críticas prioritarias (Peso 1.0 con nivel <= 2)"
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  4. Brechas Críticas Abiertas (Cl. 6.1.2)
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: metrics.criticalGaps.length > 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {metrics.criticalGaps.length}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    controles de Peso 1.0 en Nivel 1–2
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                   Frente a <strong>{metrics.highStrengths.length}</strong> controles consolidados en Nivel 4–5 (≥80%).
                </div>
              </div>
            </div>

            {/* ── Pestañas de Navegación Analítica (Estilo Hojas de Power BI) ── */}
            <div style={{ display: "flex", gap: 8, borderBottom: "2px solid var(--border)", paddingBottom: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={activeTab === "executive" ? "btn btn-primary" : "btn"}
                onClick={() => setActiveTab("executive")}
              >
                Hoja 1: Visión Ejecutiva 360°, Niveles y Radares ISO/NIST
              </button>
              <button
                type="button"
                className={activeTab === "iso_matrix" ? "btn btn-primary" : "btn"}
                onClick={() => setActiveTab("iso_matrix")}
              >
                Hoja 2: Los 18 Dominios ISO 27001, Superficie OSINT y Brecha Directiva
              </button>
              <button
                type="button"
                className={activeTab === "audit_table" ? "btn btn-primary" : "btn"}
                onClick={() => setActiveTab("audit_table")}
              >
                Hoja 3: Sustentación ("Lo Bueno y Lo Malo") y Evidencias ({metrics.totalRecords})
              </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                HOJA 1: VISIÓN EJECUTIVA, COMPARATIVA DE NIVELES Y RADARES ISO/NIST
               ════════════════════════════════════════════════════════════════════ */}
            {activeTab === "executive" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
                  {/* 1. Radar Pentagonal NIST CSF 2.0 / ISO 27002 Conceptos */}
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                          Radar de Capacidades de Defensa (NIST CSF / ISO 27002 Cl. 4.2)
                        </h3>
                        <p style={{ margin: "4px 0 12px 0", fontSize: 12, color: "var(--muted)" }}>
                          Equilibrio entre prevención, detección y resiliencia. <strong>Haz clic en un eje</strong> para filtrar.
                        </p>
                      </div>
                    </div>
                    <NistRadarChart
                      data={metrics.byNist}
                      selectedNist={selectedNist}
                      onSelectNist={setSelectedNist}
                    />
                  </div>

                  {/* 2. Los 4 Capítulos del Anexo A ISO 27001:2022 + Tríada CIA */}
                  <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        Cumplimiento Anexo A — ISO/IEC 27001:2022 (Cláusulas A.5 a A.8)
                      </h3>
                      <p style={{ margin: "4px 0 16px 0", fontSize: 12, color: "var(--muted)" }}>
                        Desempeño en los 4 dominios estructurales de la norma. Clic en una barra para aislar sus controles.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {metrics.byAnnex.map((ax) => {
                          const isSel = selectedAnnex === ax.cat;
                          const col = scoreColor(ax.score);
                          return (
                            <div
                              key={ax.cat}
                              onClick={() => setSelectedAnnex(isSel ? "" : ax.cat)}
                              style={{
                                cursor: "pointer",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: isSel ? "2px solid #2563eb" : "1px solid var(--border)",
                                background: isSel ? "rgba(37,99,235,0.06)" : "var(--bg-page)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                                <span>{ax.cat}</span>
                                <span style={{ color: col }}>
                                  {ax.score}% <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>({ax.count} preg.)</span>
                                </span>
                              </div>
                              <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 10, borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ width: `${ax.score}%`, height: "100%", background: col, borderRadius: 999, transition: "width 0.4s" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Balance de la Tríada CIA y Tipos de Control */}
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        Impacto en Propiedades CIA y Naturaleza del Control (ISO 27002):
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {(["Confidencialidad", "Integridad", "Disponibilidad"] as const).map((prop) => {
                          const val = metrics.ciaScores[prop];
                          return (
                            <div
                              key={prop}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                background: "var(--bg-page)",
                                textAlign: "center",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{prop}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(val) }}>{val}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. Triangulación por Niveles de la Organización + Distribución Likert */}
                  <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        Madurez por Nivel Organizacional (Cultura vs. TI vs. Dirección)
                      </h3>
                      <p style={{ margin: "4px 0 16px 0", fontSize: 12, color: "var(--muted)" }}>
                        Compara todos los cuestionarios aplicados a los diferentes miembros de la entidad. Clic para filtrar nivel.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {metrics.byTier.map((t) => {
                          const isSel = selectedTier === t.tier;
                          const col = scoreColor(t.score);
                          return (
                            <div
                              key={t.tier}
                              onClick={() => {
                                setSelectedTier(isSel ? "" : t.tier);
                                setSelectedEvalId("");
                              }}
                              style={{
                                cursor: "pointer",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: isSel ? "2px solid #2563eb" : "1px solid var(--border)",
                                background: isSel ? "rgba(37,99,235,0.06)" : "var(--bg-page)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: 13 }}>{t.shortLabel}</div>
                                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                    {t.roleDesc} · {t.evalsCount} eval.
                                  </div>
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{t.score}%</div>
                              </div>
                              <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                                <div style={{ width: `${t.score}%`, height: "100%", background: col, borderRadius: 999 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Distribución de Respuestas en Escala Likert 1 a 5 */}
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        Distribución de Madurez por Respuesta (Escala 1 a 5):
                      </div>
                      <div style={{ display: "flex", height: 22, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                        {([
                          { lvl: 1, col: "#dc2626", label: "1: Nunca" },
                          { lvl: 2, col: "#f97316", label: "2: Rara vez" },
                          { lvl: 3, col: "#eab308", label: "3: Parcial" },
                          { lvl: 4, col: "#3b82f6", label: "4: Formal" },
                          { lvl: 5, col: "#16a34a", label: "5: Optimizado" },
                        ] as const).map((item) => {
                          const c = metrics.likertCounts[item.lvl];
                          const pct = metrics.answeredCount > 0 ? Math.round((c / metrics.answeredCount) * 100) : 0;
                          if (pct === 0) return null;
                          return (
                            <div
                              key={item.lvl}
                              style={{
                                width: `${pct}%`,
                                background: item.col,
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title={`${item.label}: ${c} respuestas (${pct}%)`}
                            >
                              {pct >= 9 ? `${pct}%` : ""}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>1–2 Brecha ({metrics.likertCounts[1] + metrics.likertCounts[2]})</span>
                        <span style={{ color: "#d97706", fontWeight: 700 }}>3 En proceso ({metrics.likertCounts[3]})</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>4–5 Maduro ({metrics.likertCounts[4] + metrics.likertCounts[5]})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                HOJA 2: 18 DOMINIOS ISO 27001, SUPERFICIE OSINT Y BRECHA DIRECTIVA
               ════════════════════════════════════════════════════════════════════ */}
            {(activeTab === "iso_matrix" || activeTab === "executive") && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 20, alignItems: "start" }}>
                  {/* Mapa de Barras Interactivas de los 18 Dominios Temáticos ISO 27001 (Listado Completo sin scroll interno) */}
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        Ranking Total de los {metrics.byDomain.length} Dominios Temáticos (Anexo A ISO 27001:2022)
                      </h3>
                      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                        Ordenado del #1 (mayor riesgo) al #{metrics.byDomain.length} (mayor fortaleza)
                      </span>
                    </div>
                    <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "var(--muted)" }}>
                      Vista completa sin recortes. Haz clic en cualquier dominio para filtrar sus preguntas, comentarios y plan de remediación.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {metrics.byDomain.map((d, index) => {
                        const isSel = selectedDomain === d.domain;
                        const col = scoreColor(d.score);
                        return (
                          <div
                            key={d.domain}
                            onClick={() => setSelectedDomain(isSel ? "" : d.domain)}
                            style={{
                              cursor: "pointer",
                              padding: "10px 14px",
                              borderRadius: 8,
                              border: isSel ? "2px solid #2563eb" : "1px solid var(--border)",
                              background: isSel ? "rgba(37,99,235,0.06)" : "var(--bg-page)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: 26,
                                    height: 22,
                                    padding: "0 6px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: `${col}18`,
                                    color: col,
                                  }}
                                >
                                  #{index + 1}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.domain}</div>
                                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                                    {d.isoRef} · {d.annex} · NIST: {d.nist} · {d.answeredCount}/{d.totalCount} preg.
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {d.criticalCount > 0 && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      background: "rgba(220,38,38,0.12)",
                                      color: "#dc2626",
                                    }}
                                  >
                                    {d.criticalCount} brecha(s) crít.
                                  </span>
                                )}
                                <span style={{ fontWeight: 900, fontSize: 15, color: col }}>{d.score}%</span>
                              </div>
                            </div>
                            <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                              <div style={{ width: `${d.score}%`, height: "100%", background: col, borderRadius: 999 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columna Derecha: Superficie de Exposición OSINT e Inteligencia de Amenazas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="card" style={{ padding: 22 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        Vectores de Exposición OSINT e Ingeniería Social (ISO 27001 A.5.7 / OSINT 2019)
                      </h3>
                      <p style={{ margin: "4px 0 14px 0", fontSize: 12, color: "var(--muted)" }}>
                        Mide qué tan expuesto está el perímetro humano y digital frente a técnicas de reconocimiento abierto (fuga en redes sociales, metadatos, credenciales filtradas, phishing/vishing y servicios expuestos).
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {metrics.osintBreakdown.map((o, idx) => (
                          <div
                            key={o.category}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "var(--bg-page)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>
                                {idx + 1}. {o.category}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                                ({o.count} controles evaluados)
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                              <span style={{ color: "var(--muted)" }}>
                                Riesgo de Exposición Externa:{" "}
                                <strong style={{ color: o.exposure > 40 ? "#dc2626" : "#d97706" }}>{o.exposure}%</strong>
                              </span>
                              <span style={{ fontWeight: 800, color: scoreColor(o.protection) }}>
                                Nivel de Protección: {o.protection}%
                              </span>
                            </div>
                            <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 8, borderRadius: 999, overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${o.protection}%`,
                                  height: "100%",
                                  background: scoreColor(o.protection),
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen de Controles Preventivos vs Detectivos vs Correctivos */}
                    <div className="card" style={{ padding: 22 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        Desempeño por Tipo de Control (Atributo #Control_Types ISO/IEC 27002:2022)
                      </h3>
                      <p style={{ margin: "4px 0 14px 0", fontSize: 12, color: "var(--muted)" }}>
                        Evalúa si los controles actúan antes del incidente (Preventivos), durante el evento (Detectivos) o después de la materialización del impacto (Correctivos).
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {(["Preventivo", "Detectivo", "Correctivo"] as const).map((ct) => {
                          const val = metrics.controlTypeScores[ct];
                          const col = scoreColor(val);
                          const desc =
                            ct === "Preventivo"
                              ? "Evita que el incidente ocurra (políticas, MFA, hardening, bloqueo de pantalla)"
                              : ct === "Detectivo"
                                ? "Descubre eventos y anomalías en curso (SIEM, IDS/IPS, escaneos, identificación de phishing)"
                                : "Restaura la operación y corrige el impacto (Backups 3-2-1, BCP/DRP, playbooks de respuesta)";
                          return (
                            <div
                              key={ct}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--bg-page)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: 13 }}>Control {ct}</div>
                                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{desc}</div>
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: col }}>{val}%</div>
                              </div>
                              <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                                <div style={{ width: `${val}%`, height: "100%", background: col, borderRadius: 999 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECCIÓN COMPLETA A ANCHO TOTAL: ESPEJO DE PERCEPCIÓN (LAS 8 PREGUNTAS TEC_EST) ── */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17 }}>
                        Espejo de Percepción: Alta Dirección vs. Realidad TI (Los 8 Controles Compartidos <code>tec_est</code>)
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
                        Vista completa de las <strong>8 preguntas idénticas</strong> aplicadas tanto en el Formulario Estratégico (Nivel Alto) como en el Formulario Técnico (Nivel Medio) según <strong>ISO/IEC 27001 Cláusulas 5.1 y 9.3</strong>. Permite comparar sin recortes lo que la Gerencia declara frente a lo que el equipo de TI opera realmente.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, fontWeight: 700 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                        Delta &gt; +20%: Sobreconfianza Directiva
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
                        Delta &lt; -20%: TI supera la formalidad directiva
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
                        |Delta| ≤ 20%: Percepción Alineada
                      </span>
                    </div>
                  </div>

                  {metrics.perceptionGaps.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--muted)", padding: 16, border: "1px dashed var(--border)", borderRadius: 8 }}>
                      No hay respuestas simultáneas de Nivel Medio y Nivel Alto en el filtro seleccionado. Selecciona "Todos los Niveles (Vista 360°)" para visualizar la comparativa completa.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 16 }}>
                      {metrics.perceptionGaps.map((g, idx) => {
                        const isOverconfident = g.delta > 20;
                        const isTiAhead = g.delta < -20;
                        const statusBg = isOverconfident
                          ? "rgba(220,38,38,0.05)"
                          : isTiAhead
                            ? "rgba(37,99,235,0.05)"
                            : "var(--bg-page)";
                        const statusBorder = isOverconfident
                          ? "rgba(220,38,38,0.3)"
                          : isTiAhead
                            ? "rgba(37,99,235,0.3)"
                            : "var(--border)";
                        const badgeColor = isOverconfident ? "#dc2626" : isTiAhead ? "#2563eb" : "#15803d";
                        const badgeText = isOverconfident
                          ? `Alerta de Sobreconfianza Directiva (+${g.delta}% sobre TI)`
                          : isTiAhead
                            ? `TI opera por encima de la formalidad directiva (${g.delta}%)`
                            : `Criterio Alineado (Diferencia: ${g.delta > 0 ? `+${g.delta}` : g.delta}%)`;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedDomain(selectedDomain === g.domain ? "" : g.domain)}
                            style={{
                              padding: "16px 18px",
                              borderRadius: 10,
                              border: `1px solid ${statusBorder}`,
                              background: statusBg,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: 12,
                              cursor: "pointer",
                            }}
                            title="Haz clic para filtrar este dominio en la matriz inferior"
                          >
                            {/* Cabecera de la tarjeta: Número, Dominio ISO, Peso y Diagnóstico de Brecha */}
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#3b82f6" }}>
                                  Control Compartido #{idx + 1} · {g.domain} ({g.isoRef}) · Peso {g.peso}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    background: `${badgeColor}15`,
                                    color: badgeColor,
                                  }}
                                >
                                  {badgeText}
                                </span>
                              </div>

                              {/* Texto íntegro de la pregunta sin recortar */}
                              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, color: "var(--text-primary)" }}>
                                {g.text}
                              </div>
                            </div>

                            {/* Barras comparativas lado a lado: Alta Dirección vs TI */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                              {/* Lado Alta Dirección */}
                              <div style={{ background: "var(--bg-page)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                                    Alta Dirección (Nivel Alto)
                                  </span>
                                  <span style={{ fontSize: 15, fontWeight: 900, color: g.dirAvg !== null ? scoreColor(g.dirAvg) : "var(--muted)" }}>
                                    {g.dirAvg !== null ? `${g.dirAvg}%` : "Sin resp."}{" "}
                                    {g.dirValAvg !== null && (
                                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
                                        ({g.dirValAvg}/5)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 7, borderRadius: 999, overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${g.dirAvg ?? 0}%`,
                                      height: "100%",
                                      background: g.dirAvg !== null ? scoreColor(g.dirAvg) : "transparent",
                                      borderRadius: 999,
                                    }}
                                  />
                                </div>
                                {g.dirComments.length > 0 && (
                                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.35 }}>
                                    <strong>Nota Dirección:</strong> “{g.dirComments[0]}”
                                  </div>
                                )}
                              </div>

                              {/* Lado Realidad TI / Sistemas */}
                              <div style={{ background: "var(--bg-page)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                                    Realidad TI (Nivel Medio)
                                  </span>
                                  <span style={{ fontSize: 15, fontWeight: 900, color: g.tiAvg !== null ? scoreColor(g.tiAvg) : "var(--muted)" }}>
                                    {g.tiAvg !== null ? `${g.tiAvg}%` : "Sin resp."}{" "}
                                    {g.tiValAvg !== null && (
                                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
                                        ({g.tiValAvg}/5)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div style={{ background: "color-mix(in srgb, var(--text-primary) 14%, transparent)", height: 7, borderRadius: 999, overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${g.tiAvg ?? 0}%`,
                                      height: "100%",
                                      background: g.tiAvg !== null ? scoreColor(g.tiAvg) : "transparent",
                                      borderRadius: 999,
                                    }}
                                  />
                                </div>
                                {g.tiComments.length > 0 && (
                                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.35 }}>
                                    <strong>Nota TI:</strong> “{g.tiComments[0]}”
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Recomendación de alineación ISO */}
                            <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span>
                                <strong>Recomendación ISO:</strong> {g.recommendation}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                BLOQUE DE SUSTENTACIÓN: "LO BUENO Y LO MALO" + EXPLORADOR DE EVIDENCIAS
               ════════════════════════════════════════════════════════════════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
              {/* Columna Izquierda: LO BUENO (Fortalezas Consolidadas) */}
              <div className="card" style={{ padding: 22, borderTop: "4px solid #16a34a" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, color: "#15803d" }}>
                  Lo Bueno: Fortalezas y Controles Consolidados (Nivel 4–5 · ≥80%)
                </h3>
                <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "var(--muted)" }}>
                  Argumentos técnicos y organizacionales que sustentan el cumplimiento actual de la entidad ante auditoría.
                </p>
                {metrics.highStrengths.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>
                    Aún no se registran controles con calificación ≥80% en este filtro.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {metrics.highStrengths.slice(0, 10).map((s, i) => (
                      <div
                        key={`${s.evaluationId}-${s.questionId}-${i}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "rgba(22,163,74,0.06)",
                          border: "1px solid rgba(22,163,74,0.2)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>
                          <span>{s.thematicDomain} · {s.isoControlRef}</span>
                          <span>{s.score}% ({s.levelTier.split(" (")[0]})</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.questionText}</div>
                        {s.comentario && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                            Evidencia: “{s.comentario}”
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: LO MALO (Brechas Críticas y Plan de Remediación) */}
              <div className="card" style={{ padding: 22, borderTop: "4px solid #dc2626" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, color: "#dc2626" }}>
                  Lo Malo: Brechas Críticas y Plan de Tratamiento Priorizado (ISO 27001 Cl. 6.1.3)
                </h3>
                <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "var(--muted)" }}>
                  Controles con calificación deficiente (Nivel 1–2) priorizados por su peso de riesgo (<code>Peso 1.0</code> primero).
                </p>
                {metrics.criticalGaps.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                    No se detectan brechas críticas de Peso 1.0 en Nivel 1–2 para este filtro.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {metrics.criticalGaps.slice(0, 10).map((g, i) => (
                      <div
                        key={`${g.evaluationId}-${g.questionId}-${i}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "rgba(220,38,38,0.05)",
                          border: "1px solid rgba(220,38,38,0.22)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#dc2626", marginBottom: 4 }}>
                          <span>
                            [PRIORIDAD ALTA · Peso {g.peso}] {g.thematicDomain} ({g.isoControlRef})
                          </span>
                          <span>Score: {g.score}%</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{g.questionText}</div>
                        <div style={{ fontSize: 11, color: "var(--text-primary)", background: "rgba(59,130,246,0.14)", borderLeft: "3px solid #3b82f6", padding: "6px 8px", borderRadius: 6 }}>
                          <strong>Acción Correctiva ISO:</strong> {g.recommendation}
                        </div>
                        {g.comentario && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                            Hallazgo reportado ({g.userName}): “{g.comentario}”
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Explorador Dinámico de Preguntas, Evidencias y Trazabilidad ISO ── */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>
                    Matriz Detallada de Respuestas, Evidencias y Trazabilidad ISO 27001 ({matrixDisplayRecords.length} de {activeRecords.length} registros)
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--muted)" }}>
                    Haz clic en el título de cualquier columna para ordenar (Ascendente / Descendente) o utiliza los filtros individuales bajo cada encabezado.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {hasMatrixColumnFilters && (
                    <button
                      type="button"
                      className="btn"
                      onClick={clearMatrixColumnFilters}
                      style={{ fontSize: 12, padding: "7px 12px", color: "var(--danger, #dc2626)", fontWeight: 700 }}
                    >
                      Restablecer orden y filtros de tabla
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder="Búsqueda global rápida en toda la matriz..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      minWidth: 270,
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div className="table-responsive-container" style={{ maxHeight: 580, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
                <table className="table-responsive" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-page)", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                    {/* Fila 1: Encabezados Interactivos de Ordenamiento */}
                    <tr style={{ textAlign: "left", background: "var(--bg-page)" }}>
                      {(
                        [
                          { key: "level", label: "Nivel / Evaluado", align: "left" },
                          { key: "domain", label: "Dominio & Control ISO", align: "left" },
                          { key: "nist", label: "NIST / Tipo", align: "left" },
                          { key: "question", label: "Pregunta Evaluada", align: "left" },
                          { key: "peso", label: "Peso", align: "center" },
                          { key: "score", label: "Score", align: "center" },
                          { key: "comment", label: "Evidencia / Comentario", align: "left" },
                        ] as const
                      ).map((col) => {
                        const isSorted = matrixSortCol === col.key;
                        const sortBadge = isSorted
                          ? matrixSortDir === "asc"
                            ? " (Asc)"
                            : " (Desc)"
                          : "";
                        return (
                          <th
                            key={col.key}
                            onClick={() => handleMatrixSort(col.key)}
                            title="Haz clic para ordenar por esta columna (Ascendente / Descendente / Original)"
                            style={{
                              padding: "10px 8px 6px 8px",
                              textAlign: col.align,
                              cursor: "pointer",
                              userSelect: "none",
                              whiteSpace: "nowrap",
                              color: isSorted ? "#3b82f6" : "var(--text-primary)",
                              borderBottom: isSorted ? "2px solid #3b82f6" : "1px solid var(--border)",
                              background: isSorted ? "rgba(59,130,246,0.12)" : "var(--surface)",
                              transition: "background 0.15s",
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>
                              {col.label}
                              <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, color: isSorted ? "#2563eb" : "var(--muted)" }}>
                                {sortBadge || " [Ordenar]"}
                              </span>
                            </span>
                          </th>
                        );
                      })}
                    </tr>

                    {/* Fila 2: Controles de Filtrado Individual por Columna */}
                    <tr style={{ background: "var(--bg-page)", borderBottom: "2px solid var(--border)" }}>
                      {/* Filtro 1: Nivel / Evaluado */}
                      <th style={{ padding: "6px 8px" }}>
                        <select
                          value={colLevelFilter}
                          onChange={(e) => setColLevelFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colLevelFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colLevelFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todos los niveles</option>
                          <option value="Nivel Bajo">Nivel Bajo (Operativo)</option>
                          <option value="Nivel Medio">Nivel Medio (TI)</option>
                          <option value="Nivel Alto">Nivel Alto (Dirección)</option>
                        </select>
                      </th>

                      {/* Filtro 2: Dominio & Control ISO */}
                      <th style={{ padding: "6px 8px" }}>
                        <select
                          value={colDomainFilter}
                          onChange={(e) => setColDomainFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colDomainFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colDomainFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todos los dominios ({matrixAvailableDomains.length})</option>
                          <option value="__OSINT__">Solo Vectores OSINT</option>
                          <optgroup label="Por Capítulo Anexo A">
                            {ANNEX_ORDER.map((ax) => (
                              <option key={ax} value={`ANNEX:${ax}`}>
                                {ax}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Por Dominio Temático">
                            {matrixAvailableDomains.map((dom) => (
                              <option key={dom} value={dom}>
                                {dom}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </th>

                      {/* Filtro 3: NIST / Tipo */}
                      <th style={{ padding: "6px 8px" }}>
                        <select
                          value={colNistFilter}
                          onChange={(e) => setColNistFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colNistFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colNistFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todos (NIST / Tipo)</option>
                          <optgroup label="Función NIST CSF">
                            {NIST_ORDER.map((nf) => (
                              <option key={nf} value={`NIST:${nf}`}>
                                NIST: {nf}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Tipo de Control ISO 27002">
                            <option value="TYPE:Preventivo">Tipo: Preventivo</option>
                            <option value="TYPE:Detectivo">Tipo: Detectivo</option>
                            <option value="TYPE:Correctivo">Tipo: Correctivo</option>
                          </optgroup>
                          <optgroup label="Naturaleza de Evidencia">
                            <option value="NAT:General">Práctica: General</option>
                            <option value="NAT:Documentación">Política: Documentación</option>
                          </optgroup>
                        </select>
                      </th>

                      {/* Filtro 4: Pregunta Evaluada */}
                      <th style={{ padding: "6px 8px" }}>
                        <input
                          type="text"
                          placeholder="Filtrar texto de pregunta..."
                          value={colQuestionFilter}
                          onChange={(e) => setColQuestionFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colQuestionFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                          }}
                        />
                      </th>

                      {/* Filtro 5: Peso */}
                      <th style={{ padding: "6px 8px", textAlign: "center" }}>
                        <select
                          value={colPesoFilter}
                          onChange={(e) => setColPesoFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 4px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colPesoFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colPesoFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todos</option>
                          <option value="1">1.0 (Crítico)</option>
                          <option value="0.7">0.7 (Medio)</option>
                          <option value="0.4">0.4 (Bajo)</option>
                        </select>
                      </th>

                      {/* Filtro 6: Score */}
                      <th style={{ padding: "6px 8px", textAlign: "center" }}>
                        <select
                          value={colScoreFilter}
                          onChange={(e) => setColScoreFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 4px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colScoreFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colScoreFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todos</option>
                          <optgroup label="Nivel de Madurez">
                            <option value="BRECHA">Brecha (≤40%)</option>
                            <option value="PROCESO">En proceso (60%)</option>
                            <option value="MADURO">Maduro (≥80%)</option>
                          </optgroup>
                          <optgroup label="Calificación Exacta">
                            <option value="20">20% (1/5)</option>
                            <option value="40">40% (2/5)</option>
                            <option value="60">60% (3/5)</option>
                            <option value="80">80% (4/5)</option>
                            <option value="100">100% (5/5)</option>
                          </optgroup>
                        </select>
                      </th>

                      {/* Filtro 7: Evidencia / Comentario */}
                      <th style={{ padding: "6px 8px" }}>
                        <select
                          value={colCommentFilter}
                          onChange={(e) => setColCommentFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: colCommentFilter ? "rgba(37,99,235,0.08)" : "var(--bg-page)",
                            fontWeight: colCommentFilter ? 700 : 500,
                          }}
                        >
                          <option value="">Todas las filas</option>
                          <option value="__WITH_COMMENT__">Solo con comentario / evidencia</option>
                          <option value="__NO_COMMENT__">Sin comentario</option>
                        </select>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixDisplayRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                          No se encontraron registros con los filtros de columna seleccionados.
                        </td>
                      </tr>
                    ) : (
                      matrixDisplayRecords.map((r, idx) => {
                        const col = r.score !== null ? scoreColor(r.score) : "var(--muted)";
                        return (
                          <tr key={`${r.evaluationId}-${r.questionId}-${idx}`} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                              <div style={{ fontWeight: 700 }}>{r.levelTier.split(" (")[0]}</div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                {r.userName} (Eval #{r.evaluationId})
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ fontWeight: 700 }}>{r.thematicDomain}</div>
                              <div style={{ fontSize: 11, color: "var(--blue-600, #2563eb)", fontWeight: 600 }}>
                                {r.isoControlRef} · {r.annexCategory}
                              </div>
                              {r.isOsintVector && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    marginTop: 2,
                                    fontSize: 10,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    background: "rgba(245,158,11,0.14)",
                                    color: "#b45309",
                                    fontWeight: 700,
                                  }}
                                >
                                  Vector OSINT
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                              <div style={{ fontWeight: 700 }}>{r.nistFunction}</div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                {r.controlType} · {r.nature}
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px", maxWidth: 380 }}>
                              {r.questionText}
                              {r.isReverseCoded && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    marginLeft: 6,
                                    fontSize: 10,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    background: "rgba(37,99,235,0.1)",
                                    color: "#2563eb",
                                    fontWeight: 700,
                                  }}
                                  title="Pregunta redactada en sentido negativo: el valor fue invertido (6 - valor) según ISO/IEC 27004 para mantener coherencia de madurez."
                                >
                                  Escala Inversa Normalizada
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700 }}>{r.peso}</td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              {r.score !== null ? (
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    background: `${col}18`,
                                    color: col,
                                    fontWeight: 800,
                                  }}
                                >
                                  {r.score}% ({r.normalizedValor}/5)
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>Sin resp.</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 8px", color: "var(--muted)", maxWidth: 240 }}>
                              {r.comentario || "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResultsDashboardPage;
