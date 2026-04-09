import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import dataService from '../services/dataService';
import OrganizationForm from './OrganizationForm';

type Org = { id: string; name: string; email?: string; nit?: string; address?: string; phone?: string };

const OrganizationsTable: React.FC<{ mode?: 'admin' | 'evaluator' }> = ({ mode = 'admin' }) => {
  const [rows, setRows] = useState<Org[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const o = await dataService.getOrgs();
    setRows(o as Org[]);
    setLoading(false);
  };

  const filtered = rows.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || (r.email || '').toLowerCase().includes(query.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar organización?')) return;
    await dataService.deleteOrg(id);
    await load();
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Gestión de Organizaciones</h2>
      <OrganizationForm open={openForm} onClose={() => setOpenForm(false)} initial={editing || undefined} onSaved={load} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <input placeholder="Buscar por nombre o correo" value={query} onChange={e => setQuery(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
        <a href="/organizations/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>Nueva organización</a>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '12px 8px' }}>Nombre</th>
              <th style={{ padding: '12px 8px' }}>Correo</th>
              <th style={{ padding: '12px 8px' }}>NIT</th>
              <th style={{ padding: '12px 8px' }}>Dirección</th>
              <th style={{ padding: '12px 8px' }}>Teléfono</th>
              <th style={{ padding: '12px 8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}>Cargando...</td></tr>}
            {!loading && filtered.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.email}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.nit}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.address}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.phone}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  {/* Ver siempre disponible */}
                  <a href={`/organizations/${r.id}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 8, color: 'var(--white)' }}>VER</a>
                  {mode === 'admin' && (
                    <>
                      <button className="btn" onClick={() => { setEditing(r); setOpenForm(true); }} style={{ marginLeft: 8 }}>Editar</button>
                      <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizationsTable;
