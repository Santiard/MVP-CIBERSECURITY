import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { listReports, ReportListItem } from '../services/reportApi';
import viewIcon from '../images/ojo.svg';
import FilterInput from '../components/FilterInput';

const ReportsPage: React.FC = () => {
  const [rowsData, setRowsData] = useState<ReportListItem[]>([]);
  const [orgFilter, setOrgFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [evaluatorFilter, setEvaluatorFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setRowsData(await listReports());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const evaluators = useMemo(() => {
    const map = new Map<number, string>();
    rowsData.forEach(r => {
      if (r.evaluatorId && r.evaluatorName) {
        map.set(r.evaluatorId, r.evaluatorName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rowsData]);

  const orgs = useMemo(() => Array.from(new Set(rowsData.map(r => r.orgName))).sort(), [rowsData]);

  const rows = rowsData.filter((r) => {
    if (orgFilter && r.orgName !== orgFilter) return false;
    if (dateFilter && r.date !== dateFilter) return false;
    if (evaluatorFilter && r.evaluatorId !== Number(evaluatorFilter)) return false;
    if (estadoFilter && r.estado !== estadoFilter) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [orgFilter, dateFilter, evaluatorFilter, estadoFilter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Reportes</h2>
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}
            >
              <option value="">Todas las organizaciones</option>
              {orgs.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px', color: dateFilter ? 'inherit' : 'var(--muted)' }}
              title="Filtrar por fecha"
            />
            <select
              value={evaluatorFilter}
              onChange={(e) => setEvaluatorFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}
            >
              <option value="">Todos los evaluadores</option>
              {evaluators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En progreso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '12px 8px' }}>Título</th>
                <th style={{ padding: '12px 8px' }}>Fecha</th>
                <th style={{ padding: '12px 8px' }}>Evaluador</th>
                <th style={{ padding: '12px 8px' }}>Estado</th>
                <th style={{ padding: '12px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }} colSpan={5}>Cargando...</td>
                </tr>
              )}
              {visibleRows.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.title}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.date}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', color: r.evaluatorName ? 'inherit' : 'var(--muted)' }}>{r.evaluatorName || 'Sin asignar'}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', textTransform: 'capitalize' }}>{r.estado}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                    <Link to={`/reports/${r.id}`} className="btn btn-icon" title="Ver">
                      <img src={viewIcon} alt="Ver" width={18} height={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
            <div style={{ color: 'var(--muted)' }}>Mostrando {visibleRows.length} de {rows.length} reportes</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)' }}>Filas</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
              <span style={{ margin: '0 4px', minWidth: 42, textAlign: 'center' }}>{safePage}/{pages}</span>
              <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages}>Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;
