import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { listReports, ReportListItem } from '../services/reportApi';

const ReportsPage: React.FC = () => {
  const [rows, setRows] = useState<ReportListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setRows(await listReports());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Reportes</h2>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '12px 8px' }}>Título</th>
                <th style={{ padding: '12px 8px' }}>Fecha</th>
                <th style={{ padding: '12px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }} colSpan={3}>Cargando...</td>
                </tr>
              )}
              {visibleRows.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.title}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.date}</td>
                  <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>
                    <Link to={`/reports/${r.id}`} className="btn">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </div>
    </Layout>
  );
};

export default ReportsPage;
