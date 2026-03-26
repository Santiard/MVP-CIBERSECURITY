import React, {useMemo, useState} from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';
import Badge from './Badge';
import FilterInput from './FilterInput';

type EvalRow = {
  id: string;
  organization: string;
  date: string;
  result: string;
  status: string;
};

const SAMPLE: EvalRow[] = [
  { id: '1', organization: 'Empresa ABC', date: '10/03/2026', result: '72%', status: 'Finalizada' },
  { id: '2', organization: 'Empresa XYZ', date: '10/03/2026', result: '72%', status: 'Finalizada' },
  { id: '3', organization: 'Empresa Global', date: '10/03/2026', result: '72%', status: 'En progreso' },
  { id: '4', organization: 'Empresa Tech', date: '10/03/2026', result: '72%', status: 'Finalizada' },
];

const EvaluationsTable: React.FC = () => {
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SAMPLE;
    return SAMPLE.filter(r => r.organization.toLowerCase().includes(q));
  }, [filter]);

  return (
    <div className="card" style={{minHeight:240}}>
      <h2 style={{marginTop:0}}>Gestión de Evaluaciones</h2>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <FilterInput value={filter} onChange={setFilter} />
      </div>

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left', color:'var(--muted)'}}>
              <th style={{padding:'12px 8px'}}>Organización</th>
              <th style={{padding:'12px 8px'}}>Fecha</th>
              <th style={{padding:'12px 8px'}}>Resultado</th>
              <th style={{padding:'12px 8px'}}>Estado</th>
              <th style={{padding:'12px 8px'}}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{background:'transparent'}}>
                <td style={{padding:'14px 8px', borderTop:'1px solid var(--border)'}}>{r.organization}</td>
                <td style={{padding:'14px 8px', borderTop:'1px solid var(--border)'}}>{r.date}</td>
                <td style={{padding:'14px 8px', borderTop:'1px solid var(--border)'}}>{r.result}</td>
                <td style={{padding:'14px 8px', borderTop:'1px solid var(--border)'}}><Badge status={r.status} /></td>
                <td style={{padding:'14px 8px', borderTop:'1px solid var(--border)'}}>
                  <Link to={`/reports/${r.id}`} className="btn btn-primary" style={{padding:'8px 12px', borderRadius:8, textDecoration:'none', display:'inline-block'}}>VER</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvaluationsTable;
