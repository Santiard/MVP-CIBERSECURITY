import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import PhoneField from './PhoneField';
import dataService from '../services/dataService';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: { id?: string; name?: string; email?: string; nit?: string; address?: string; phone?: string };
  onSaved?: () => void;
};

const OrganizationForm: React.FC<Props> = ({ open, onClose, initial, onSaved }) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [nit, setNit] = useState(initial?.nit || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setNit(initial?.nit || '');
    setAddress(initial?.address || '');
    setPhone(initial?.phone || '');
    setErrors({});
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!name) {
      alert('Nombre es requerido');
      return;
    }

    // Validaciones de exclusividad
    const newErrors: Record<string, string> = {};

    // Validar email duplicado (si está proporcionado)
    if (email) {
      const emailExists = await dataService.checkOrgEmailExists(email, initial?.id);
      if (emailExists) {
        newErrors.email = 'Este correo electrónico ya está registrado en otra organización';
      }
    }

    // Validar NIT solo numérico
    if (nit && !/^\d+$/.test(nit)) {
      newErrors.nit = 'El NIT solo puede contener números';
    }

    // Validar NIT duplicado (si está proporcionado)
    if (nit && !newErrors.nit) {
      const nitExists = await dataService.checkOrgNitExists(nit, initial?.id);
      if (nitExists) {
        newErrors.nit = 'Este NIT ya está registrado en otra organización';
      }
    }

    // Validar teléfono duplicado (si está proporcionado)
    if (phone) {
      const phoneExists = await dataService.checkOrgPhoneExists(phone, initial?.id);
      if (phoneExists) {
        newErrors.phone = 'Este número telefónico ya está registrado en otra organización';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (initial?.id) {
      await dataService.updateOrg(initial.id, { name, email, nit, address, phone } as any);
    } else {
      await dataService.createOrg({ name, email, nit, address, phone } as any);
    }
    
    onSaved && onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar organización' : 'Nueva organización'}>
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

        <label style={{ fontSize: 12 }}>NIT</label>
        <input 
          inputMode="numeric"
          pattern="[0-9]*"
          value={nit} 
          onChange={e => setNit(e.target.value.replace(/\D/g, ''))} 
          style={{ 
            padding: 8, 
            borderRadius: 8, 
            border: errors.nit ? '1px solid var(--danger)' : '1px solid var(--border)' 
          }} 
        />
        {errors.nit && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.nit}</div>}

        <label style={{ fontSize: 12 }}>Dirección</label>
        <input value={address} onChange={e => setAddress(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Teléfono</label>
        <PhoneField 
          value={phone} 
          onChange={setPhone} 
          error={errors.phone} 
          maxDropdownHeight={120}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default OrganizationForm;
