import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';
import Badge from './Badge';
import FilterInput from './FilterInput';
import { listEvaluations } from '../services/evaluationApi';

type EvalRow = {
  id_evaluacion: number;
  id_empresa: number;
  id_usuario: number;
  fecha: string;
  estado: string;
};

const EvaluationsTable: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [rowsData, setRowsData] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listEvaluations();
        setRowsData(data as EvalRow[]);
      } catch (err) {
        setError('No se pudieron cargar las evaluaciones');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rowsData;
    return rowsData.filter(r => r.organization.toLowerCase().includes(q));
  }, [filter, rowsData]);

  return (
    <div className="card" style={{minHeight:240}}>
      <h2 style={{marginTop:0}}>Evaluaciones</h2>
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
            {loading && (
              <tr>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }} colSpan={5}>Cargando evaluaciones...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', color: 'var(--danger)' }} colSpan={5}>{error}</td>
              </tr>
            )}
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
