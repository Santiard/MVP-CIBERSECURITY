import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import ReportSummary from '../components/ReportSummary';
import CategoryResults from '../components/CategoryResults';
import Recommendations from '../components/Recommendations';
import { useParams } from 'react-router-dom';
import { getReportByEvaluationId, type ReportDetail, type ReportCategory } from '../services/reportApi';

// ── Simple bar chart using SVG ────────────────────────────────────────────────
const BarChartSimple: React.FC<{ categories: ReportCategory[] }> = ({ categories }) => {
  if (categories.length === 0) return <div style={{ color: 'var(--muted)', padding: 16 }}>Sin datos suficientes.</div>;

  const BAR_H = 32;
  const GAP   = 12;
  const LABEL_W = 200;
  const VALUE_W = 40;
  const BAR_MAX = 300;
  const totalH  = categories.length * (BAR_H + GAP);

  function color(v: number) {
    if (v >= 80) return '#16a34a';
    if (v >= 60) return '#2563eb';
    if (v >= 40) return '#d97706';
    return '#dc2626';
  }

  return (
    <svg
      viewBox={`0 0 ${LABEL_W + BAR_MAX + VALUE_W + 20} ${totalH}`}
      style={{ width: '100%', maxWidth: 680, display: 'block' }}
    >
      {categories.map((c, i) => {
        const y   = i * (BAR_H + GAP);
        const bw  = Math.round((c.value / 100) * BAR_MAX);
        const col = color(c.value);
        return (
          <g key={c.id}>
            {/* Label */}
            <text x={LABEL_W - 8} y={y + BAR_H / 2 + 5} textAnchor="end" fontSize={12} fill="var(--gray-700)" fontWeight={600}
              style={{ fontFamily: 'inherit' }}>
              {c.name.length > 24 ? c.name.slice(0, 22) + '…' : c.name}
            </text>
            {/* Track */}
            <rect x={LABEL_W} y={y} width={BAR_MAX} height={BAR_H} rx={6} fill="rgba(0,0,0,0.05)" />
            {/* Fill */}
            <rect x={LABEL_W} y={y} width={bw} height={BAR_H} rx={6} fill={col} />
            {/* Value */}
            <text x={LABEL_W + BAR_MAX + 10} y={y + BAR_H / 2 + 5} fontSize={12} fontWeight={700} fill={col}
              style={{ fontFamily: 'inherit' }}>
              {c.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Answer detail table per control ──────────────────────────────────────────
const AnswerRow: React.FC<{
  questionText: string;
  valor: number | undefined;
  comentario: string | undefined;
  index: number;
}> = ({ questionText, valor, comentario, index }) => {
  function dotColor(v: number | undefined) {
    if (!v) return 'var(--muted)';
    if (v >= 4) return '#16a34a';
    if (v >= 3) return '#2563eb';
    if (v >= 2) return '#d97706';
    return '#dc2626';
  }
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--muted)', width: 32 }}>{index + 1}</td>
      <td style={{ padding: '10px 12px', fontSize: 13 }}>{questionText}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', width: 60 }}>
        {valor !== undefined ? (
          <span style={{
            display: 'inline-block',
            width: 28, height: 28, lineHeight: '28px',
            borderRadius: '50%',
            background: `${dotColor(valor)}18`,
            color: dotColor(valor),
            fontWeight: 800,
            fontSize: 13,
            textAlign: 'center',
          }}>{valor}</span>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
        )}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--gray-600)' }}>{comentario || '—'}</td>
    </tr>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ReportViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We need evaluation answers + control questions for the detail table
  // They're already computed inside reportApi; we'll retrieve them separately
  const [controlDetails, setControlDetails] = useState<{
    controlId: number;
    controlName: string;
    questions: { id: string; text: string; valor?: number; comentario?: string }[];
  }[]>([]);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    import('../services/evaluationApi').then(async ({ getEvaluationById, listEvaluationControls }) => {
      const dataService = (await import('../services/dataService')).default;
      const [rep, ev, ctrls] = await Promise.all([
        getReportByEvaluationId(id),
        getEvaluationById(id),
        listEvaluationControls(Number(id)),
      ]);
      setReport(rep);

      // Build control+question detail with answers
      const details = await Promise.all(ctrls.map(async (ctrl) => {
        const qs = await dataService.getQuestionsByControl(String(ctrl.id_control));
        return {
          controlId: ctrl.id_control,
          controlName: ctrl.nombre,
          questions: qs.map((q) => ({
            id: q.id,
            text: q.text,
            valor: ev.answers?.[q.id]?.valor !== undefined ? Number(ev.answers[q.id].valor) : undefined,
            comentario: ev.answers?.[q.id]?.comentario,
          })),
        };
      }));
      setControlDetails(details);
    }).catch(() => setError('No se pudo cargar el reporte.')).finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Informe de Ciberseguridad</h2>
          <button className="btn btn-primary" onClick={handlePrint}>Imprimir / Exportar PDF</button>
        </div>

        {loading && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Calculando informe completo...</div>}
        {error   && <div className="card" style={{ padding: 24, color: 'var(--danger)' }}>{error}</div>}

        {report && (
          <div ref={detailRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1 — Resumen ejecutivo */}
            <ReportSummary
              score={report.score}
              level={report.level}
              levelColor={report.levelColor}
              date={report.date}
              evaluator={report.evaluator}
              orgName={report.orgName}
              estado={report.estado}
              totalQuestions={report.totalQuestions}
              answeredQuestions={report.answeredQuestions}
            />

            {/* 2 — Gráfico de barras por formulario */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Resultados por Formulario (Alcance)</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
                Nivel de madurez alcanzado en cada formulario seleccionado como alcance de la evaluación.
              </p>
              <BarChartSimple categories={report.categories} />
            </div>

            {/* 3 — Detalle por formulario */}
            {controlDetails.length > 0 && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Detalle de Respuestas por Formulario</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
                  Scoring individual (escala 1–5) y comentarios del evaluador para cada pregunta.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {controlDetails.map((ctrl) => {
                    const cat = report.categories.find((c) => c.name === ctrl.controlName);
                    return (
                      <div key={ctrl.controlId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{ctrl.controlName}</div>
                          {cat && (
                            <span style={{
                              fontWeight: 800, fontSize: 15,
                              color: cat.value >= 80 ? '#16a34a' : cat.value >= 60 ? '#2563eb' : cat.value >= 40 ? '#d97706' : '#dc2626',
                            }}>
                              {cat.value}%
                            </span>
                          )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', background: 'var(--background)' }}>
                                <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', width: 32 }}>#</th>
                                <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)' }}>Pregunta</th>
                                <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', textAlign: 'center', width: 60 }}>Valor</th>
                                <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)' }}>Comentario del evaluador</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ctrl.questions.map((q, idx) => (
                                <AnswerRow
                                  key={q.id}
                                  index={idx}
                                  questionText={q.text}
                                  valor={q.valor}
                                  comentario={q.comentario}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4 — Resultados compactos por categoría */}
            <CategoryResults rows={report.categories} />

            {/* 5 — Plan de mejora */}
            <Recommendations items={report.recommendations} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportViewPage;
