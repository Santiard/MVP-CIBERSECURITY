import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDimensions, createDimension, updateDimension, deleteDimension, Dimension } from '../services/dataService';

export const DimensionsPage: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoria, setCategoria] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const fetchDimensions = async () => {
    setLoading(true);
    try {
      const data = await getDimensions();
      setDimensions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar dimensiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDimensions();
  }, []);

  const handleOpenModal = (dim?: Dimension) => {
    if (dim) {
      setEditingId(dim.id_dimension);
      setCategoria(dim.categoria);
      setNombre(dim.nombre);
      setDescripcion(dim.descripcion || '');
    } else {
      setEditingId(null);
      setCategoria('');
      setNombre('');
      setDescripcion('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDimension(editingId, { categoria, nombre, descripcion });
      } else {
        await createDimension({ categoria, nombre, descripcion });
      }
      setIsModalOpen(false);
      void fetchDimensions();
    } catch (err: any) {
      alert('Error al guardar dimensión: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta dimensión?')) return;
    try {
      await deleteDimension(id);
      void fetchDimensions();
    } catch (err: any) {
      alert('Error al eliminar dimensión: ' + err.message);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Gestión de Dimensiones ISO</h2>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              Crear Dimensión
            </button>
          </div>

          {loading && <p style={{ color: 'var(--muted)' }}>Cargando dimensiones...</p>}
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

          {!loading && !error && (
            <div className="table-responsive-container">
              <table className="table-responsive">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map((dim) => (
                    <tr key={dim.id_dimension}>
                      <td style={{ fontWeight: 600 }}>{dim.categoria}</td>
                      <td>{dim.nombre}</td>
                      <td>{dim.descripcion || '-'}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleOpenModal(dim)}
                          className="btn"
                          style={{ marginRight: 8 }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(dim.id_dimension)}
                          className="btn"
                          style={{ color: 'var(--danger)' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dimensions.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        No hay dimensiones registradas.
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
              style={{ width: '100%', maxWidth: 480, background: 'var(--surface, #fff)', padding: 24, borderRadius: 12 }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                {editingId ? 'Editar Dimensión' : 'Nueva Dimensión'}
              </h3>
              <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Categoría *</label>
                  <input
                    type="text"
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                    placeholder="Ej: Propiedad de Seguridad"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                    placeholder="Ej: Confidencialidad"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Descripción (Opcional)</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                    rows={3}
                  />
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
