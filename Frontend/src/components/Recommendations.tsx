import React from 'react';
import type { ReportRecommendation } from '../services/reportApi';

const PRIORITY_CONFIG = {
  alta:  { label: 'Prioridad Alta',  color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)'  },
  media: { label: 'Prioridad Media', color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)'  },
  baja:  { label: 'Prioridad Baja',  color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)'  },
};

type Props = { items: ReportRecommendation[] };

const Recommendations: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const high   = items.filter((i) => i.priority === 'alta');
  const medium = items.filter((i) => i.priority === 'media');
  const low    = items.filter((i) => i.priority === 'baja');
  const groups = [
    { key: 'alta',  list: high   },
    { key: 'media', list: medium },
    { key: 'baja',  list: low    },
  ].filter((g) => g.list.length > 0) as { key: 'alta' | 'media' | 'baja'; list: ReportRecommendation[] }[];

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Plan de Mejora</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
        Acciones recomendadas ordenadas por nivel de urgencia para fortalecer la postura de ciberseguridad.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(({ key, list }) => {
          const cfg = PRIORITY_CONFIG[key];
          return list.map((item, idx) => (
            <div
              key={`${key}-${idx}`}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderLeft: `4px solid ${cfg.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>{item.control}</div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: cfg.color,
                  background: cfg.bg,
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: `1px solid ${cfg.border}`,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}>
                  {cfg.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.55 }}>{item.text}</p>
            </div>
          ));
        })}
      </div>
    </div>
  );
};

export default Recommendations;
