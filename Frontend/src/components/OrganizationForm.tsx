import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import PhoneField from './PhoneField';
import dataService from '../services/dataService';

type Org = { id_empresa?: number; nombre?: string; sector?: string; tamano?: string };
type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Org;
  onSaved?: () => void;
};

const OrganizationForm: React.FC<Props> = ({ open, onClose, initial, onSaved }) => {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [sector, setSector] = useState(initial?.sector || '');
  const [tamano, setTamano] = useState(initial?.tamano || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setSector(initial?.sector || '');
    setTamano(initial?.tamano || '');
    setErrors({});
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!nombre) {
      alert('Nombre es requerido');
      return;
    }
    if (!sector) {
      alert('Sector es requerido');
      return;
    }
    if (!tamano) {
      alert('Tamaño es requerido');
      return;
    }

    // Clear previous errors
    setErrors({});

    // Validate NIT format if provided (local validation only)
    const localErrors: Record<string, string> = {};
    if (nit && !/^\d+$/.test(nit)) {
      localErrors.nit = 'El NIT solo puede contener números';
      setErrors(localErrors);
      return;
    }

    try {
      if (initial?.id_empresa) {
        await dataService.updateOrg(initial.id_empresa, { nombre, sector, tamano });
      } else {
        await dataService.createOrg({ nombre, sector, tamano });
      }
      
      onSaved && onSaved();
      onClose();
    } catch (error: any) {
      // Handle backend validation errors
      if (error.message && error.message.includes('email')) {
        setErrors({ email: 'Este correo electrónico ya está registrado en otra organización' });
      } else if (error.message && error.message.includes('NIT')) {
        setErrors({ nit: 'Este NIT ya está registrado en otra organización' });
      } else if (error.message && error.message.includes('teléfono')) {
        setErrors({ phone: 'Este número telefónico ya está registrado en otra organización' });
      } else {
        alert('Error al guardar la organización: ' + (error.message || 'Error desconocido'));
      }
    }
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
