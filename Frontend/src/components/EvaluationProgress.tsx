import React, { useEffect, useState } from "react";
import { getEvaluationById, listEvaluationControls } from "../services/evaluationApi";
import dataService from "../services/dataService";

const EvaluationProgress: React.FC<{ evaluationId: number }> = ({ evaluationId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ answered: number; total: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const ev = await getEvaluationById(evaluationId);
        const linked = await listEvaluationControls(evaluationId);
        
        let total = 0;
        for (const c of linked) {
          const qs = await dataService.getQuestionsByControl(String(c.id_control));
          total += qs.length;
        }

        const answered = Object.keys(ev.answers || {}).length;

        if (mounted) {
          setProgress({ answered, total });
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Error al cargar el progreso");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchProgress();
    return () => { mounted = false; };
  }, [evaluationId]);

  if (loading) {
    return <div style={{ padding: "16px", color: "var(--muted)", textAlign: "center" }}>Calculando progreso...</div>;
  }

  if (error) {
    return <div style={{ padding: "16px", color: "var(--danger)", textAlign: "center" }}>{error}</div>;
  }

  if (!progress) return null;

  const { answered, total } = progress;
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100);

  return (
    <div style={{ padding: "16px 24px", background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Progreso de llenado</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{answered} / {total} preguntas</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.08)", height: 10, borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "var(--blue-500)",
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--blue-700)" }}>
          {percent}%
        </div>
      </div>
    </div>
  );
};

export default EvaluationProgress;
