import React from 'react';

type Props = {
  score: number; // percentage
  level?: string;
  date?: string;
  evaluator?: string;
};

const ReportSummary: React.FC<Props> = ({ score, level = 'Nivel Intermedio', date, evaluator }) => {
  return (
    <div className="card" style={{display:'flex', gap:24, alignItems:'center', padding:24}}>
      <div style={{flex:'0 0 160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <div style={{fontSize:48, fontWeight:800, color:'var(--btn-primary-bg)'}}>{Math.round(score)}%</div>
        <div style={{color:'var(--muted)', marginTop:6}}>{level}</div>
      </div>

      <div style={{flex:1, display:'flex', justifyContent:'space-between', gap:12}}>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{color:'var(--muted)', fontSize:13}}>Fecha de Evaluación</div>
          <div style={{fontWeight:700}}>{date ?? '15/02/2026'}</div>
        </div>

        <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{color:'var(--muted)', fontSize:13}}>Evaluador</div>
          <div style={{fontWeight:700}}>{evaluator ?? 'Juan Perez'}</div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummary;
