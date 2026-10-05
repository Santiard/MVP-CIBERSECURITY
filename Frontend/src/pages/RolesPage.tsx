import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import dataService from '../services/dataService';
import { useAlert } from '../components/alerts/AlertProvider';

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<{id_rol: number, nombre: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState('');
  const { showAlert } = useAlert();

  const load = async () => {
    try {
      setLoading(true);
      const data = await dataService.getRoles();
      setRoles(data);
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudieron cargar los roles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newRole.trim()) return;
    try {
      await dataService.createRole({ nombre: newRole.trim() });
      setNewRole('');
      await load();
      showAlert({ type: 'success', title: 'Éxito', message: 'Rol creado.' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo crear el rol.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este rol?')) return;
    try {
      await dataService.deleteRole(id);
      await load();
      showAlert({ type: 'success', title: 'Éxito', message: 'Rol eliminado.' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar el rol.' });
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Gestión de Roles</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input 
            type="text" 
            placeholder="Nuevo Rol (ej. user_nivel_experto)" 
            value={newRole} 
            onChange={e => setNewRole(e.target.value)} 
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid var(--border)' }}
          />
          <button className="btn btn-primary" onClick={handleCreate}>Crear</button>
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--surface-light)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id_rol} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{r.id_rol}</td>
                  <td style={{ padding: 12 }}>{r.nombre}</td>
                  <td style={{ padding: 12 }}>
                    <button className="btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id_rol)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 12, textAlign: 'center' }}>No hay roles.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default RolesPage;
