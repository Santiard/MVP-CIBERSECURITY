import React from 'react';
import type { ReportCategory } from '../services/reportApi';

type Props = { rows: ReportCategory[] };

function scoreColor(value: number): string {
  if (value >= 80) return '#16a34a';
  if (value >= 60) return '#2563eb';
  if (value >= 40) return '#d97706';
  return '#dc2626';
}

function scoreLabel(value: number): string {
  if (value >= 80) return 'Avanzado';
  if (value >= 60) return 'Intermedio';
  if (value >= 40) return 'Básico';
  return 'Inicial';
}

const DimensionTag: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.4,
    background: active ? 'rgba(37,99,235,0.1)' : 'var(--background)',
    color: active ? '#2563eb' : 'var(--muted)',
    border: '1px solid',
    borderColor: active ? 'rgba(37,99,235,0.25)' : 'var(--border)',
  }}>{label}</span>
);

const CategoryResults: React.FC<Props> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Resultados por Formulario</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {rows.map((r) => {
          const color = scoreColor(r.value);
          const label = scoreLabel(r.value);
          return (
            <div key={r.id}>
              {/* Control name + level badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {r.answered}/{r.total} resp.
                  </span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: `${color}18`,
                    color,
                  }}>{label}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'rgba(0,0,0,0.06)', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${r.value}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 999,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Score + CIA dimensions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <DimensionTag label="C" active={r.dimensions.confidencialidad} />
                  <DimensionTag label="I" active={r.dimensions.integridad} />
                  <DimensionTag label="D" active={r.dimensions.disponibilidad} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color }}>{r.value}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CIA legend */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
        <strong>C</strong> = Confidencialidad &nbsp;·&nbsp; <strong>I</strong> = Integridad &nbsp;·&nbsp; <strong>D</strong> = Disponibilidad &nbsp;—&nbsp; Dimensiones CIA afectadas por el control.
      </div>
    </div>
  );
};

export default CategoryResults;
