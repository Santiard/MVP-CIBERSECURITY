import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getControls,
  createControl,
  updateControl,
  deleteControl,
  Control,
  getDimensions,
  Dimension,
} from '../services/dataService';

export const ControlsPage: React.FC = () => {
  const [controls, setControls] = useState<Control[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [recAlta, setRecAlta] = useState('');
  const [recMedia, setRecMedia] = useState('');
  const [recBaja, setRecBaja] = useState('');
  const [activo, setActivo] = useState(true);
  const [selectedDims, setSelectedDims] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ctrlsData, dimsData] = await Promise.all([getControls(), getDimensions()]);
      setControls(Array.isArray(ctrlsData) ? ctrlsData : []);
      setDimensions(Array.isArray(dimsData) ? dimsData : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleOpenModal = (ctrl?: Control) => {
    if (ctrl) {
      setEditingId(ctrl.id_control);
      setNombre(ctrl.nombre);
      setDescripcion(ctrl.descripcion);
      setRecAlta(ctrl.rec_alta || '');
      setRecMedia(ctrl.rec_media || '');
      setRecBaja(ctrl.rec_baja || '');
      setActivo(ctrl.activo);
      setSelectedDims((ctrl.dimensiones || []).map((d) => d.id_dimension));
    } else {
      setEditingId(null);
      setNombre('');
      setDescripcion('');
      setRecAlta('');
      setRecMedia('');
      setRecBaja('');
      setActivo(true);
      setSelectedDims([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const toggleDimension = (id: number) => {
    setSelectedDims((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre,
      descripcion,
      activo,
      rec_alta: recAlta,
      rec_media: recMedia,
      rec_baja: recBaja,
      dimensiones_ids: selectedDims,
    };
    try {
      if (editingId) {
        await updateControl(editingId, payload);
      } else {
        await createControl(payload);
      }
      setIsModalOpen(false);
      void fetchData();
    } catch (err: any) {
      alert('Error al guardar control: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este control?')) return;
    try {
      await deleteControl(id);
      void fetchData();
    } catch (err: any) {
      alert('Error al eliminar control: ' + err.message);
    }
  };

  const groupedDimensions = dimensions.reduce((acc, dim) => {
    if (!acc[dim.categoria]) acc[dim.categoria] = [];
    acc[dim.categoria].push(dim);
    return acc;
  }, {} as Record<string, Dimension[]>);

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Gestión de Controles ISO</h2>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              Crear Control
            </button>
          </div>

          {loading && <p style={{ color: 'var(--muted)' }}>Cargando controles...</p>}
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

          {!loading && !error && (
            <div className="table-responsive-container">
              <table className="table-responsive">
                <thead>
                  <tr>
                    <th>Control</th>
                    <th>Dimensiones</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.map((ctrl) => (
                    <tr key={ctrl.id_control}>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>{ctrl.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ctrl.descripcion}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(ctrl.dimensiones || []).map((d) => (
                            <span
                              key={d.id_dimension}
                              style={{
                                background: 'var(--surface-light)',
                                border: '1px solid var(--border)',
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                              title={d.categoria}
                            >
                              {d.nombre}
                            </span>
                          ))}
                          {(!ctrl.dimensiones || ctrl.dimensiones.length === 0) && (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Sin dimensiones</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: ctrl.activo ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                            color: ctrl.activo ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {ctrl.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleOpenModal(ctrl)} className="btn" style={{ marginRight: 8 }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(ctrl.id_control)} className="btn" style={{ color: 'var(--danger)' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {controls.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        No hay controles registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(2,6,23,0.45)',
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: 720,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--surface, #fff)',
                padding: 24,
                borderRadius: 12,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                {editingId ? 'Editar Control' : 'Nuevo Control'}
              </h3>
              <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nombre del Control *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Descripción *</label>
                  <textarea
                    required
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                    rows={2}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Recomendación Alta</label>
                    <textarea
                      value={recAlta}
                      onChange={(e) => setRecAlta(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Recomendación Media</label>
                    <textarea
                      value={recMedia}
                      onChange={(e) => setRecMedia(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Recomendación Baja</label>
                    <textarea
                      value={recBaja}
                      onChange={(e) => setRecBaja(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                    Control Activo
                  </label>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>Dimensiones Asignadas</h4>
                  {Object.entries(groupedDimensions).map(([cat, dims]) => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--muted)' }}>{cat}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {dims.map((d) => (
                          <label
                            key={d.id_dimension}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--surface-light)',
                              border: '1px solid var(--border)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDims.includes(d.id_dimension)}
                              onChange={() => toggleDimension(d.id_dimension)}
                            />
                            <span>{d.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={handleCloseModal} className="btn">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
