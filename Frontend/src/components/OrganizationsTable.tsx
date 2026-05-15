import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/theme.css';
import dataService from '../services/dataService';
import OrganizationForm from './OrganizationForm';
import OrganizationDetailsModal from './OrganizationDetailsModal';
import ConfirmModal from './modal/ConfirmModal';
import { useAlert } from './alerts/AlertProvider';
import { SECTOR_OPTIONS } from '../constants/organizationOptions';
import editIcon from '../images/edit.svg';
import deleteIcon from '../images/icons8-basura-llena(1).svg';
import viewIcon from '../images/ojo.svg';

type Org = { id_empresa: number; nombre: string; sector: string; tamano: string };

const OrganizationsTable: React.FC<{ mode?: 'admin' | 'evaluator' }> = ({ mode = 'admin' }) => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<Org[]>([]);
  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [tamanoFilter, setTamanoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => window.innerWidth < 768 ? 5 : 10);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [viewingOrg, setViewingOrg] = useState<Org | null>(null);
  const [deletingOrgId, setDeletingOrgId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const o = await dataService.getOrgs();
    setRows(o as Org[]);
    setLoading(false);
  };

  const sectors = useMemo(() => SECTOR_OPTIONS, []);
  const tamanos = useMemo(() => Array.from(new Set(rows.map(r => r.tamano))).filter(Boolean).sort(), [rows]);

  const filtered = rows.filter(r => {
    if (sectorFilter && r.sector !== sectorFilter) return false;
    if (tamanoFilter && r.tamano !== tamanoFilter) return false;
    const q = query.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || r.sector.toLowerCase().includes(q);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, sectorFilter, tamanoFilter, pageSize]);

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
      <OrganizationDetailsModal open={!!viewingOrg} onClose={() => setViewingOrg(null)} org={viewingOrg} />
      <ConfirmModal
        open={deletingOrgId != null}
        title="Eliminar organizacion"
        message="¿Confirmas que deseas eliminar esta organizacion?"
        confirmText="Eliminar"
        loading={deletingLoading}
        onCancel={() => setDeletingOrgId(null)}
        onConfirm={() => void confirmDelete()}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input placeholder="Buscar por nombre..." value={query} onChange={e => setQuery(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', flex: '1 1 200px' }} />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los sectores</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={tamanoFilter} onChange={e => setTamanoFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los tamaños</option>
          {tamanos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <Link to="/asignaciones" className="btn" style={{ textDecoration: 'none' }}>Asignaciones empresa ↔ evaluación</Link>
          <a href="/organizations/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>Nueva organización</a>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="table-responsive">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Sector</th>
              <th>Tamaño</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
            {!loading && visible.map(r => (
              <tr key={r.id_empresa}>
                <td>{r.nombre}</td>
                <td>{r.sector}</td>
                <td>{r.tamano}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn btn-icon" onClick={() => setViewingOrg(r)} title="Ver detalles">
                      <img src={viewIcon} alt="Ver" width={18} height={18} />
                    </button>
                    {mode === 'admin' && (
                      <>
                        <button className="btn btn-icon" onClick={() => { setEditing(r); setOpenForm(true); }} title="Editar">
                          <img src={editIcon} alt="Editar" width={18} height={18} />
                        </button>
                        <button className="btn btn-icon" onClick={() => handleDelete(r.id_empresa)} title="Eliminar">
                          <img src={deleteIcon} alt="Eliminar" width={18} height={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 5 && (
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
      )}
    </div>
  );
};

export default OrganizationsTable;
