import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';
import dataService from '../services/dataService';
import OrganizationForm from './OrganizationForm';
import ConfirmModal from './modal/ConfirmModal';
import { useAlert } from './alerts/AlertProvider';

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };

const OrganizationsTable: React.FC<{ mode?: 'admin' | 'evaluator' }> = ({ mode = 'admin' }) => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<Org[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const o = await dataService.getOrgs();
    setRows(o as Org[]);
    setLoading(false);
  };

  const filtered = rows.filter(r => r.nombre.toLowerCase().includes(query.toLowerCase()) || r.sector.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const handleDelete = async (id_empresa: number) => {
    setDeletingOrgId(id_empresa);
  };

  const confirmDelete = async () => {
    if (!deletingOrgId) return;
    try {
      setDeletingLoading(true);
      await dataService.deleteOrg(deletingOrgId);
      setDeletingOrgId(null);
      showAlert({ type: 'success', title: 'Exito', message: 'Organizacion eliminada correctamente.' });
      await load();
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar la organizacion.' });
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Gestión de Organizaciones</h2>
      <OrganizationForm open={openForm} onClose={() => setOpenForm(false)} initial={editing || undefined} onSaved={load} />
      <ConfirmModal
        open={deletingOrgId != null}
        title="Eliminar organizacion"
        message="¿Confirmas que deseas eliminar esta organizacion?"
        confirmText="Eliminar"
        loading={deletingLoading}
        onCancel={() => setDeletingOrgId(null)}
        onConfirm={() => void confirmDelete()}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <input placeholder="Buscar por nombre o sector" value={query} onChange={e => setQuery(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/asignaciones" className="btn" style={{ textDecoration: 'none' }}>Asignaciones empresa ↔ evaluación</Link>
          <a href="/organizations/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>Nueva organización</a>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '12px 8px' }}>Nombre</th>
              <th style={{ padding: '12px 8px' }}>Sector</th>
              <th style={{ padding: '12px 8px' }}>Tamaño</th>
              <th style={{ padding: '12px 8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
            {!loading && visible.map(r => (
              <tr key={r.id_empresa}>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.nombre}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.sector}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.tamano}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  {/* Ver siempre disponible */}
                  <a href={`/organizations/${r.id_empresa}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 8, color: 'var(--white)' }}>VER</a>
                  {mode === 'admin' && (
                    <>
                      <button className="btn" onClick={() => { setEditing(r); setOpenForm(true); }} style={{ marginLeft: 8 }}>Editar</button>
                      <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id_empresa)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Mostrando {visible.length} de {filtered.length} organizaciones</div>
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
  );
};

export default OrganizationsTable;
