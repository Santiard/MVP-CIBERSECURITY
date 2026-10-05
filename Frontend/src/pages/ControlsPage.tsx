import React, { useEffect, useState } from 'react';
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

  // Form states
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
      setControls(ctrlsData);
      setDimensions(dimsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      setSelectedDims(ctrl.dimensiones.map((d) => d.id_dimension));
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
      fetchData();
    } catch (err: any) {
      alert('Error al guardar control: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este control?')) return;
    try {
      await deleteControl(id);
      fetchData();
    } catch (err: any) {
      alert('Error al eliminar control: ' + err.message);
    }
  };

  if (loading) return <div className="p-4">Cargando controles...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  // Group dimensions by Category for the UI
  const groupedDimensions = dimensions.reduce((acc, dim) => {
    if (!acc[dim.categoria]) acc[dim.categoria] = [];
    acc[dim.categoria].push(dim);
    return acc;
  }, {} as Record<string, Dimension[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Controles</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
        >
          Crear Control
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">Control</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dimensiones</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((ctrl) => (
              <tr key={ctrl.id_control} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {ctrl.nombre}
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ctrl.descripcion}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ctrl.dimensiones.map((d) => (
                      <span
                        key={d.id_dimension}
                        className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full"
                        title={d.categoria}
                      >
                        {d.nombre}
                      </span>
                    ))}
                    {ctrl.dimensiones.length === 0 && <span className="text-gray-400 text-xs">Sin dimensiones</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${ctrl.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ctrl.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleOpenModal(ctrl)} className="text-blue-600 hover:text-blue-800 mr-3">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(ctrl.id_control)} className="text-red-600 hover:text-red-800">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl max-h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Control' : 'Nuevo Control'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Control</label>
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border p-2 rounded" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recomendación Alta</label>
                  <textarea value={recAlta} onChange={(e) => setRecAlta(e.target.value)} className="w-full border p-2 rounded" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recomendación Media</label>
                  <textarea value={recMedia} onChange={(e) => setRecMedia(e.target.value)} className="w-full border p-2 rounded" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recomendación Baja</label>
                  <textarea value={recBaja} onChange={(e) => setRecBaja(e.target.value)} className="w-full border p-2 rounded" rows={2} />
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" id="activo" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="mr-2" />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">Control Activo</label>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="text-lg font-semibold mb-3">Dimensiones Asignadas</h3>
                {Object.entries(groupedDimensions).map(([cat, dims]) => (
                  <div key={cat} className="mb-3">
                    <div className="text-sm font-bold text-gray-600 mb-1 border-b pb-1">{cat}</div>
                    <div className="flex flex-wrap gap-2">
                      {dims.map((d) => (
                        <label key={d.id_dimension} className="inline-flex items-center bg-gray-50 border px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={selectedDims.includes(d.id_dimension)}
                            onChange={() => toggleDimension(d.id_dimension)}
                          />
                          <span className="text-xs">{d.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border rounded hover:bg-gray-100">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700">
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
