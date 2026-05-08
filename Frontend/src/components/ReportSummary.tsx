import React from 'react';
import type { ReportDetail } from '../services/reportApi';

type Props = Pick<ReportDetail, 'score' | 'level' | 'levelColor' | 'date' | 'evaluator' | 'orgName' | 'estado' | 'totalQuestions' | 'answeredQuestions'>;

const ESTADO_LABELS: Record<string, string> = {
  pendiente:   'Pendiente',
  'en progreso': 'En Proceso',
  finalizada:  'Finalizada',
  finalizado:  'Finalizada',
};

const ReportSummary: React.FC<Props> = ({ score, level, levelColor, date, evaluator, orgName, estado, totalQuestions, answeredQuestions }) => {
  // Circle progress ring
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const estadoLabel = ESTADO_LABELS[(estado ?? '').toLowerCase()] ?? estado;

  return (
    <div className="card" style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Organización evaluada</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>{orgName}</div>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          background: estado?.toLowerCase().includes('final') ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.1)',
          color: estado?.toLowerCase().includes('final') ? '#16a34a' : '#2563eb',
        }}>
          {estadoLabel}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Score ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={130} height={130} viewBox="0 0 130 130">
            <circle cx={65} cy={65} r={radius} fill="none" stroke="var(--border)" strokeWidth={10} />
            <circle
              cx={65} cy={65} r={radius}
              fill="none"
              stroke={levelColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: levelColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 2 }}>Madurez</div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', minWidth: 180 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Nivel</div>
            <div style={{ fontWeight: 700, color: levelColor }}>{level}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Fecha</div>
            <div style={{ fontWeight: 600 }}>{date}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Evaluador</div>
            <div style={{ fontWeight: 600 }}>{evaluator}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Completado</div>
            <div style={{ fontWeight: 600 }}>{answeredQuestions}/{totalQuestions} preguntas</div>
          </div>
        </div>
      </div>

      {/* Level description */}
      <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: 'var(--background)', borderLeft: `4px solid ${levelColor}`, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
        {score >= 80 && 'La organización demuestra prácticas de ciberseguridad sólidas y sistemáticas. Se recomienda mantener el nivel con revisiones periódicas y adaptación a nuevas amenazas.'}
        {score >= 60 && score < 80 && 'La organización cuenta con controles de seguridad implementados, pero existen brechas que deben ser atendidas. Se recomienda un plan de mejora continua.'}
        {score >= 40 && score < 60 && 'Los controles de seguridad son básicos o parciales. Existen riesgos significativos que requieren atención prioritaria para proteger los activos de información.'}
        {score < 40 && 'El nivel de madurez es inicial. La organización está expuesta a riesgos críticos de ciberseguridad. Se requiere acción inmediata para implementar controles fundamentales.'}
      </div>
    </div>
  );
};

export default ReportSummary;
