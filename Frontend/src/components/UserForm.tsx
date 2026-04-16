import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import PhoneField from './PhoneField';
import Switch from './Switch';
import dataService from '../services/dataService';
import {
  getPasswordPolicyIssues,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../utils/passwordPolicy';

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
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordIssues = getPasswordPolicyIssues(password);
  const requirePassword = !initial?.id;
  const shouldValidatePassword = requirePassword || password.length > 0;
  const showPasswordIssues = submitted || password.length > 0;

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setPhone(initial?.phone || '');
    setRole(initial?.role || 'user');
    setActive(initial?.active ?? true);
    setPassword('');
    setSubmitted(false);
    setErrors({});
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    
    // Validaciones básicas
    if (!name || !email) {
      alert('Nombre y correo son requeridos');
      return;
    }

    // Validaciones de exclusividad
    const newErrors: Record<string, string> = {};

    // Validar política de contraseña
    if (!initial?.id && !password) {
      newErrors.password = 'La contraseña es obligatoria para nuevos usuarios';
    }
    if (shouldValidatePassword && !isStrongPassword(password)) {
      newErrors.password = PASSWORD_POLICY_MESSAGE;
    }

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

    try {
      if (initial?.id) {
        const payload: Record<string, unknown> = { name, email, phone, role, active };
        if (password) payload.password = password;
        await dataService.updateUser(initial.id, payload as any);
      } else {
        await dataService.createUser({ name, email, phone, role, active, password } as any);
      }

      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el usuario';
      alert(message);
    }
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

      <label style={{ fontSize: 12 }}>{initial?.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Mínimo 8, con mayúscula, minúscula y especial"
        style={{
          padding: 8,
          borderRadius: 8,
          border: errors.password ? '1px solid var(--danger)' : '1px solid var(--border)'
        }}
      />
      {errors.password && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.password}</div>}
      {showPasswordIssues && shouldValidatePassword && passwordIssues.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>
          <div style={{ marginBottom: 4 }}>{PASSWORD_POLICY_MESSAGE}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {passwordIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 0',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>Cuenta activa</div>
          <span style={{ color: active ? 'var(--success)' : 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            {active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <Switch
          checked={active}
          onChange={setActive}
          ariaLabel={active ? 'Desactivar cuenta de usuario' : 'Activar cuenta de usuario'}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" className="btn" onClick={() => onClose && onClose()}>Cancelar</button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || !email.trim() || (requirePassword && !password) || (shouldValidatePassword && passwordIssues.length > 0)}
        >
          Guardar
        </button>
      </div>
    </form>
  );

  if (inline) return <div>{form}</div>;

  return (
    <Modal open={open} onClose={onClose ?? (() => {})} title={initial?.id ? 'Editar usuario' : 'Nuevo usuario'}>
      {form}
    </Modal>
  );
};

export default UserForm;
