import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import PhoneField from './PhoneField';
import dataService from '../services/dataService';

type Props = {
  open?: boolean;
  inline?: boolean;
  onClose?: () => void;
  initial?: { id?: string; name?: string; email?: string; phone?: string; role?: string; active?: boolean };
  onSaved?: () => void;
};

const UserForm: React.FC<Props> = ({ open = false, inline = false, onClose, initial, onSaved }) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [role, setRole] = useState(initial?.role || 'user');
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setPhone(initial?.phone || '');
    setRole(initial?.role || 'user');
    setActive(initial?.active ?? true);
    setErrors({});
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validaciones básicas
    if (!name || !email) {
      alert('Nombre y correo son requeridos');
      return;
    }

    // Validaciones de exclusividad
    const newErrors: Record<string, string> = {};

    // Validar email duplicado
    const emailExists = await dataService.checkUserEmailExists(email, initial?.id);
    if (emailExists) {
      newErrors.email = 'Este correo electrónico ya está registrado';
    }

    // Validar teléfono duplicado (si está proporcionado)
    if (phone) {
      const phoneExists = await dataService.checkUserPhoneExists(phone, initial?.id);
      if (phoneExists) {
        newErrors.phone = 'Este número telefónico ya está registrado';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (initial?.id) {
      await dataService.updateUser(initial.id, { name, email, phone, role, active } as any);
    } else {
      await dataService.createUser({ name, email, phone, role, active } as any);
    }
    
    onSaved && onSaved();
    onClose && onClose();
  };
  const form = (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontSize: 12 }}>Nombre</label>
      <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

      <label style={{ fontSize: 12 }}>Correo</label>
      <input 
        type="email"
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        style={{ 
          padding: 8, 
          borderRadius: 8, 
            border: errors.email ? '1px solid var(--danger)' : '1px solid var(--border)'
        }} 
      />
      {errors.email && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.email}</div>}

      <label style={{ fontSize: 12 }}>Teléfono</label>
      <PhoneField value={phone} onChange={setPhone} error={errors.phone} />

      <label style={{ fontSize: 12 }}>Rol</label>
      <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
        <option value="admin">Administrador</option>
        <option value="evaluator">Evaluador</option>
        <option value="user">Usuario</option>
      </select>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
        <span style={{ color: active ? 'var(--green-600)' : 'var(--muted)' }}>{active ? 'Activo' : 'Inactivo'}</span>
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" className="btn" onClick={() => onClose && onClose()}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar</button>
      </div>
    </form>
  );

  if (inline) return <div>{form}</div>;

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar usuario' : 'Nuevo usuario'}>
      {form}
    </Modal>
  );
};

export default UserForm;
