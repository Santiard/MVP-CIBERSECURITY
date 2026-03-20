import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
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

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setNit(initial?.nit || '');
    setAddress(initial?.address || '');
    setPhone(initial?.phone || '');
  }, [initial, open]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name) return alert('Nombre es requerido');
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
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>NIT</label>
        <input value={nit} onChange={e => setNit(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Dirección</label>
        <input value={address} onChange={e => setAddress(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <label style={{ fontSize: 12 }}>Teléfono</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default OrganizationForm;
