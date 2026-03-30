import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import dataService from '../services/dataService';
import UserForm from './UserForm';
import Modal from './modal/Modal';
import Switch from './Switch';

type User = { id: string; name: string; email: string; phone?: string; role: string; active?: boolean };

const UsersTable: React.FC = () => {
  const [rows, setRows] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const u = await dataService.getUsers();
    setRows(u as User[]);
    setLoading(false);
  };

  const filtered = rows.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.email.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id: string) => {
    setDeleting({ id });
  };

  const handleResetPassword = async (id: string) => {
    setResetting({ id });
  };

  const [deleting, setDeleting] = useState<{ id: string; } | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [resetting, setResetting] = useState<{ id: string; } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setDeletingLoading(true);
      await dataService.deleteUser(deleting.id);
      setDeleting(null);
      await load();
    } finally {
      setDeletingLoading(false);
    }
  };

  const confirmReset = async () => {
    if (!resetting) return;
    if (!newPassword) return alert('Ingrese nueva contraseña');
    try {
      setResetLoading(true);
      await dataService.resetPassword(resetting.id, newPassword);
      alert('Contraseña reiniciada (mock).');
      setResetting(null);
      setNewPassword('');
      await load();
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Gestión de Usuarios</h2>
      <UserForm open={openForm} onClose={() => setOpenForm(false)} initial={editing || undefined} onSaved={load} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <input placeholder="Buscar por nombre o correo" value={query} onChange={e => setQuery(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
        <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>Nuevo usuario</button>
      </div>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar usuario">
        <div>
          <p>¿Confirmas que deseas eliminar este usuario?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={() => setDeleting(null)} disabled={deletingLoading}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmDelete} disabled={deletingLoading}>{deletingLoading ? 'Eliminando...' : 'Eliminar'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!resetting} onClose={() => { setResetting(null); setNewPassword(''); }} title="Reiniciar contraseña">
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 12 }}>Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={() => { setResetting(null); setNewPassword(''); }} disabled={resetLoading}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmReset} disabled={resetLoading}>{resetLoading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '12px 8px' }}>Nombre</th>
              <th style={{ padding: '12px 8px' }}>Correo</th>
              <th style={{ padding: '12px 8px' }}>Teléfono</th>
              <th style={{ padding: '12px 8px' }}>Rol</th>
              <th style={{ padding: '12px 8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Cargando...</td></tr>}
            {!loading && visible.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.name}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.email}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.phone}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)' }}>{r.role}</td>
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
                    <Switch
                      checked={!!r.active}
                      onChange={async (next) => {
                        if (next !== !!r.active) {
                          await dataService.toggleUserActive(r.id);
                          await load();
                        }
                      }}
                      ariaLabel={r.active ? 'Desactivar usuario' : 'Activar usuario'}
                    />
                    <span style={{ color: r.active ? 'var(--green-600)' : 'var(--muted)', fontSize: 13 }}>{r.active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <button className="btn" onClick={() => { setEditing(r); setOpenForm(true); }}>Editar</button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleResetPassword(r.id)}>Reset pwd</button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Mostrando {filtered.length} usuarios</div>
        <div>
          <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span style={{ margin: '0 8px' }}>{page}/{pages}</span>
          <button className="btn" onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
