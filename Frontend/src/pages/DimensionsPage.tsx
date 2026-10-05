import React, { useEffect, useState } from 'react';
import { getDimensions, createDimension, updateDimension, deleteDimension, Dimension } from '../services/dataService';

export const DimensionsPage: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoria, setCategoria] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const fetchDimensions = async () => {
    setLoading(true);
    try {
      const data = await getDimensions();
      setDimensions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar dimensiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDimensions();
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
      fetchDimensions();
    } catch (err: any) {
      alert('Error al guardar dimensión: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta dimensión?')) return;
    try {
      await deleteDimension(id);
      fetchDimensions();
    } catch (err: any) {
      alert('Error al eliminar dimensión: ' + err.message);
    }
  };

  if (loading) return <div className="p-4">Cargando dimensiones...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Dimensiones</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
        >
          Crear Dimensión
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim) => (
              <tr key={dim.id_dimension} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{dim.categoria}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{dim.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dim.descripcion || '-'}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <button
                    onClick={() => handleOpenModal(dim)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(dim.id_dimension)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {dimensions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay dimensiones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Dimensión' : 'Nueva Dimensión'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Propiedad de Seguridad"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Confidencialidad"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
