import React from 'react';
import ProgressBar from './ProgressBar';

type Row = { id: string; name: string; value: number };

const CategoryResults: React.FC<{ rows: Row[] }> = ({ rows }) => {
  return (
    <div className="card">
      <h3 style={{marginTop:0, marginBottom:12}}>Resultados por Categoría</h3>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {rows.map(r => (
          <div key={r.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
            <div style={{flex:1, marginRight:12}}>
              <div style={{fontWeight:700}}>{r.name}</div>
              <div style={{marginTop:6}}>
                <ProgressBar value={r.value} label={`${r.value}%`} />
              </div>
            </div>
            <div style={{width:56, textAlign:'right', color:'var(--muted)'}}>{r.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryResults;
