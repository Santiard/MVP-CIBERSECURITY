import React, { useState, useEffect } from 'react';
import Modal from './modal/Modal';
import dataService from '../services/dataService';
import { useAlert } from './alerts/AlertProvider';

type Org = { id_empresa?: number; nombre?: string; sector?: string; tamano?: string };
type AppUser = { id: string; name: string; email: string; role: string; active?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Org;
  onSaved?: () => void;
};

const SIZE_OPTIONS = ['Pequeña', 'Mediana', 'Grande'] as const;

const OrganizationForm: React.FC<Props> = ({ open, onClose, initial, onSaved }) => {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [sector, setSector] = useState(initial?.sector || '');
  const [tamano, setTamano] = useState(initial?.tamano || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showAlert } = useAlert();
  const [eligibleUsers, setEligibleUsers] = useState<AppUser[]>([]);
  const [memberUserIds, setMemberUserIds] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setSector(initial?.sector || '');
    setTamano(initial?.tamano || '');
    setErrors({});
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingUsers(true);
    (async () => {
      try {
        const users = await dataService.getEligibleOrganizationMembers(
          initial?.id_empresa != null ? initial.id_empresa : undefined,
        );
        if (cancelled) return;
        setEligibleUsers(users as AppUser[]);
        if (initial?.id_empresa) {
          const members = await dataService.listOrganizationUsers(initial.id_empresa);
          if (cancelled) return;
          setMemberUserIds(members.map((m) => m.id_usuario));
        } else {
          setMemberUserIds([]);
        }
      } catch {
        if (!cancelled) {
          setEligibleUsers([]);
          setMemberUserIds([]);
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initial?.id_empresa]);

  const toggleMember = (id: number) => {
    setMemberUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const missingFields: string[] = [];
    const nextErrors: Record<string, string> = {};
    if (!nombre.trim()) {
      nextErrors.nombre = 'El nombre de la empresa es requerido';
      missingFields.push('Nombre de la empresa');
    }
    if (!sector.trim()) {
      nextErrors.sector = 'El sector es requerido';
      missingFields.push('Sector');
    }
    if (!tamano.trim()) {
      nextErrors.tamano = 'El tamaño es requerido';
      missingFields.push('Tamaño');
    }
    if (missingFields.length > 0) {
      setErrors(nextErrors);
      showAlert({
        type: 'warning',
        title: 'Advertencia',
        message: `Faltan campos obligatorios: ${missingFields.join(', ')}.`,
      });
      return;
    }

    setErrors({});

    try {
      if (initial?.id_empresa) {
        await dataService.updateOrg(initial.id_empresa, {
          nombre,
          sector,
          tamano,
          user_ids: memberUserIds,
        });
      } else {
        await dataService.createOrg({
          nombre,
          sector,
          tamano,
          ...(memberUserIds.length > 0 ? { user_ids: memberUserIds } : {}),
        });
      }
      showAlert({
        type: 'success',
        title: 'Exito',
        message: initial?.id_empresa ? 'Organizacion actualizada correctamente.' : 'Organizacion creada correctamente.',
      });

      onSaved && onSaved();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Error al guardar la organizacion: ' + message,
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id_empresa ? 'Editar organización' : 'Nueva organización'}
    >
      <form noValidate onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>* Campos obligatorios</p>
        <label style={{ fontSize: 12 }}>Nombre de la empresa *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{
            padding: 8,
            borderRadius: 8,
            border: errors.nombre ? '1px solid var(--danger)' : '1px solid var(--border)',
          }}
        />
        {errors.nombre && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.nombre}</div>
        )}

        <label style={{ fontSize: 12 }}>Sector *</label>
        <input
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          required
          style={{
            padding: 8,
            borderRadius: 8,
            border: errors.sector ? '1px solid var(--danger)' : '1px solid var(--border)',
          }}
        />
        {errors.sector && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.sector}</div>
        )}

        <label style={{ fontSize: 12 }}>Tamaño *</label>
        <select
          value={tamano}
          onChange={(e) => setTamano(e.target.value)}
          required
          style={{
            padding: 8,
            borderRadius: 8,
            border: errors.tamano ? '1px solid var(--danger)' : '1px solid var(--border)',
          }}
        >
          <option value="">Seleccione…</option>
          {SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.tamano && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{errors.tamano}</div>
        )}

        <div
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Usuarios de la empresa</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.45 }}>
            Solo se listan cuentas con rol <strong>usuario de empresa</strong> (no administradores ni evaluadores) que
            aún <strong>no están asignados a otra organización</strong>. Cada persona solo puede pertenecer a una
            empresa a la vez.
          </p>
          {loadingUsers ? (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Cargando usuarios…</div>
          ) : (
            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 8,
              }}
            >
              {eligibleUsers.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  No hay usuarios disponibles (o sin otra empresa asignada).
                </span>
              ) : (
                eligibleUsers.map((u) => {
                  const idNum = Number(u.id);
                  const disabled = !u.active;
                  const checked = memberUserIds.includes(idNum);
                  return (
                    <label
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 4px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleMember(idNum)}
                      />
                      <span>
                        {u.name} <span style={{ color: 'var(--muted)' }}>({u.email})</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OrganizationForm;
