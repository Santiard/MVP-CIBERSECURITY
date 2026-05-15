import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import dataService from '../services/dataService';
import UserForm from './UserForm';
import Modal from './modal/Modal';
import ConfirmModal from './modal/ConfirmModal';
import Switch from './Switch';
import { getPasswordPolicyIssues, isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import { useAlert } from './alerts/AlertProvider';
import ResetPasswordModal from './modal/ResetPasswordModal';
import { getStoredAuthUser } from '../utils/auth';
import editIcon from '../images/edit.svg';
import deleteIcon from '../images/icons8-basura-llena(1).svg';

type User = { id: string; name: string; email: string; phone?: string; role: string; active?: boolean };

const UsersTable: React.FC = () => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => window.innerWidth < 768 ? 5 : 10);
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

  const filtered = rows.filter(r => {
    if (roleFilter && r.role !== roleFilter) return false;
    if (statusFilter !== '') {
      const isActive = statusFilter === 'true';
      if (r.active !== isActive) return false;
    }
    const q = query.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const handleDelete = async (id: string) => {
    const currentUser = getStoredAuthUser();
    if (currentUser && Number(currentUser.id_usuario) === Number(id)) {
      showAlert({
        type: 'error',
        title: 'No permitido',
        message: 'No puedes eliminar tu propia cuenta.'
      });
      return;
    }
    setDeleting({ id });
  };

  const handleResetPassword = async (id: string) => {
    setResetting({ id });
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError('');
    setResetSubmitted(false);
  };

  const [deleting, setDeleting] = useState<{ id: string; } | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [resetting, setResetting] = useState<{ id: string; } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
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
    if (!newPassword || !confirmNewPassword) {
      setResetError('Ingrese y confirme la nueva contraseña');
      showAlert({ type: 'warning', title: 'Advertencia', message: 'Debes ingresar y confirmar la nueva contraseña.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Las contraseñas no coinciden');
      showAlert({ type: 'warning', title: 'Advertencia', message: 'Las contraseñas no coinciden.' });
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
      setConfirmNewPassword('');
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input placeholder="Buscar por nombre o correo" value={query} onChange={e => setQuery(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', flex: '1 1 200px' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="evaluator">Evaluador</option>
          <option value="user">Usuario</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-light)', flex: '1 1 150px' }}>
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
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

      <Modal open={!!resetting} onClose={() => { setResetting(null); setNewPassword(''); setConfirmNewPassword(''); setResetError(''); setResetSubmitted(false); }} title="Cambiar contraseña">
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>* Campos obligatorios</p>
          <label style={{ fontSize: 12 }}>Nueva contraseña *</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
          <label style={{ fontSize: 12 }}>Confirmar contraseña *</label>
          <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={() => { setResetting(null); setNewPassword(''); setConfirmNewPassword(''); setResetError(''); setResetSubmitted(false); }} disabled={resetLoading}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmReset} disabled={resetLoading || !newPassword || !confirmNewPassword || resetIssues.length > 0}>{resetLoading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <div className="table-responsive-container">
        <table className="table-responsive">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Cargando...</td></tr>}
            {!loading && visible.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{r.role}</td>
                <td>
                  <div className="table-actions">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
                    <button className="btn btn-icon" onClick={() => { setEditing(r); setOpenForm(true); }} title="Editar">
                      <img src={editIcon} alt="Editar" width={18} height={18} />
                    </button>
                    <button className="btn" onClick={() => handleResetPassword(r.id)}>Cambiar contraseña</button>
                    <button
                      className="btn btn-icon"
                      style={{
                        opacity: getStoredAuthUser() && Number(getStoredAuthUser()!.id_usuario) === Number(r.id) ? 0.5 : 1,
                        cursor: getStoredAuthUser() && Number(getStoredAuthUser()!.id_usuario) === Number(r.id) ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleDelete(r.id)}
                      disabled={getStoredAuthUser() && Number(getStoredAuthUser()!.id_usuario) === Number(r.id)}
                      title={getStoredAuthUser() && Number(getStoredAuthUser()!.id_usuario) === Number(r.id) ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
                    >
                      <img src={deleteIcon} alt="Eliminar" width={18} height={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 5 && (
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
      )}
    </div>
  );
};

export default UsersTable;
