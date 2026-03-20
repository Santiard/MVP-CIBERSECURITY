import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import dataService from '../services/dataService';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: { id?: string; name?: string; email?: string; phone?: string; role?: string };
  onSaved?: () => void;
};

const UserForm: React.FC<Props> = ({ open, onClose, initial, onSaved }) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [role, setRole] = useState(initial?.role || 'user');

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setPhone(initial?.phone || '');
    setRole(initial?.role || 'user');
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !email) return alert('Nombre y correo son requeridos');
    if (initial?.id) {
      await dataService.updateUser(initial.id, { name, email, phone, role } as any);
    } else {
      await dataService.createUser({ name, email, phone, role } as any);
    }
    onSaved && onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar usuario' : 'Nuevo usuario'}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 12 }}>Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Correo</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Teléfono</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Rol</label>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
          <option value="admin">Administrador</option>
          <option value="evaluator">Evaluador</option>
          <option value="user">Usuario</option>
        </select>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
