import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import dataService from '../services/dataService';
import UserForm from './UserForm';
import Modal from './modal/Modal';
import ConfirmModal from './modal/ConfirmModal';
import Switch from './Switch';
import { getPasswordPolicyIssues, isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import { useAlert } from './alerts/AlertProvider';

type User = { id: string; name: string; email: string; phone?: string; role: string; active?: boolean };

const UsersTable: React.FC = () => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const handleDelete = async (id: string) => {
    setDeleting({ id });
  };

  const handleResetPassword = async (id: string) => {
    setResetting({ id });
    setNewPassword('');
    setResetError('');
    setResetSubmitted(false);
  };

  const [deleting, setDeleting] = useState<{ id: string; } | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [resetting, setResetting] = useState<{ id: string; } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const resetIssues = getPasswordPolicyIssues(newPassword);
  const showResetIssues = resetSubmitted || newPassword.length > 0;

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
    setResetSubmitted(true);
    if (!newPassword) {
      setResetError('Ingrese nueva contraseña');
      showAlert({ type: 'warning', title: 'Advertencia', message: 'Debes ingresar la nueva contraseña.' });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setResetError(PASSWORD_POLICY_MESSAGE);
      showAlert({ type: 'warning', title: 'Advertencia', message: PASSWORD_POLICY_MESSAGE });
      return;
    }
    try {
      setResetLoading(true);
      setResetError('');
      await dataService.resetPassword(resetting.id, newPassword);
      showAlert({ type: 'success', title: 'Exito', message: 'Contrasena actualizada correctamente.' });
      setResetting(null);
      setNewPassword('');
      await load();
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo actualizar la contrasena.' });
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

      <ConfirmModal
        open={!!deleting}
        title="Eliminar usuario"
        message="¿Confirmas que deseas eliminar este usuario?"
        confirmText="Eliminar"
        loading={deletingLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />

      <Modal open={!!resetting} onClose={() => { setResetting(null); setNewPassword(''); setResetError(''); setResetSubmitted(false); }} title="Cambiar contraseña">
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>* Campo obligatorio</p>
          <label style={{ fontSize: 12 }}>Nueva contraseña *</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
          {showResetIssues && resetIssues.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>
              <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {resetIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {resetError && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{resetError}</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="btn" onClick={() => { setResetting(null); setNewPassword(''); setResetError(''); setResetSubmitted(false); }} disabled={resetLoading}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmReset} disabled={resetLoading || !newPassword || resetIssues.length > 0}>{resetLoading ? 'Guardando...' : 'Guardar'}</button>
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
                <td style={{ padding: '14px 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleResetPassword(r.id)}>Cambiar contraseña</button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleDelete(r.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Mostrando {visible.length} de {filtered.length} usuarios</div>
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
          <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
          <span style={{ margin: '0 4px', minWidth: 42, textAlign: 'center' }}>{safePage}/{pages}</span>
          <button className="btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePage >= pages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
