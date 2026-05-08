import React, { useEffect, useState } from "react";
import { getEvaluationById, listEvaluationControls } from "../services/evaluationApi";
import dataService from "../services/dataService";

const ProgressCell: React.FC<{ evaluationId: number }> = ({ evaluationId }) => {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      try {
        const ev = await getEvaluationById(evaluationId);
        const linked = await listEvaluationControls(evaluationId);
        let total = 0;
        for (const c of linked) {
          const qs = await dataService.getQuestionsByControl(String(c.id_control));
          total += qs.length;
        }
        const answered = Object.keys(ev.answers || {}).length;
        if (mounted) {
          setPercent(total === 0 ? 0 : Math.round((answered / total) * 100));
        }
      } catch {
        // ignore errors
      }
    };
    void fetchProgress();
    return () => { mounted = false; };
  }, [evaluationId]);

  if (percent === null) return <span style={{ color: "var(--muted)", fontSize: 13 }}>...</span>;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden", minWidth: 50 }}>
        <div style={{ width: `${percent}%`, height: "100%", background: "var(--blue-500)", transition: "width 400ms ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{percent}%</span>
    </div>
  );
};

export default ProgressCell;
