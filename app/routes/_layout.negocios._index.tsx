import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Negocios — Pallevar Admin" }];
}

interface Negocio {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  is_activo: boolean;
  logo_url: string | null;
  total_productos: number;
  rating_promedio: number | null;
  propietario: { id: string; nombre: string; email: string };
  created_at: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Negocio[];
  pagination: { current_page: number; last_page: number; total: number };
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState("");
  const [page, setPage] = useState(1);

  async function fetchNegocios() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (nombre) params.set("nombre", nombre);
    if (activo !== "") params.set("activo", activo);
    params.set("page", String(page));
    try {
      const res = await api.get<PaginatedResponse>(`/admin/negocios?${params}`);
      setNegocios(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar negocios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNegocios(); }, [page]);

  async function toggleActivo(id: string, current: boolean) {
    try {
      await api.patch(`/admin/negocios/${id}/toggle`);
      setNegocios((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_activo: !current } : n))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchNegocios();
  }

  return (
    <>
      <Header title="Negocios" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filtros */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Buscar negocio..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={activo}
              onChange={(e) => setActivo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todos</option>
              <option value="1">Activos</option>
              <option value="0">Inactivos</option>
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Buscar
          </button>
        </form>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {pagination.total} negocios encontrados
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : negocios.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No se encontraron negocios</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Negocio</th>
                    <th className="px-5 py-3 text-left">Propietario</th>
                    <th className="px-5 py-3 text-left">Dirección</th>
                    <th className="px-5 py-3 text-center">Productos</th>
                    <th className="px-5 py-3 text-center">Rating</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                    <th className="px-5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {negocios.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {n.logo_url ? (
                            <img src={n.logo_url} alt={n.nombre} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                              {n.nombre[0]}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{n.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <p>{n.propietario.nombre}</p>
                        <p className="text-xs text-gray-400">{n.propietario.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-48 truncate">{n.direccion}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{n.total_productos}</td>
                      <td className="px-5 py-3.5 text-center">
                        {n.rating_promedio ? (
                          <span className="text-yellow-600 font-medium">⭐ {n.rating_promedio}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${n.is_activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {n.is_activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/negocios/${n.id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => toggleActivo(n.id, n.is_activo)}
                            className={`text-xs font-medium ${n.is_activo ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}
                          >
                            {n.is_activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {pagination.last_page > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <p className="text-gray-500">
                Página {pagination.current_page} de {pagination.last_page}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition text-xs"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={page === pagination.last_page}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition text-xs"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
