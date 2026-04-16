import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Usuarios — Pallevar Admin" }];
}

interface UserItem {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  rol: string;
  avatar_url: string | null;
  created_at: string;
}

interface PaginatedResponse {
  success: boolean;
  data: UserItem[];
  pagination: { current_page: number; last_page: number; total: number };
}

const rolConfig: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin",    color: "bg-purple-100 text-purple-700" },
  negocio:    { label: "Negocio",  color: "bg-indigo-100 text-indigo-700" },
  rider:      { label: "Rider",    color: "bg-blue-100 text-blue-700" },
  cliente:    { label: "Cliente",  color: "bg-gray-100 text-gray-600" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rol, setRol] = useState("");
  const [buscar, setBuscar] = useState("");
  const [page, setPage] = useState(1);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (rol) params.set("rol", rol);
    if (buscar) params.set("buscar", buscar);
    params.set("page", String(page));
    try {
      const res = await api.get<PaginatedResponse>(`/admin/users?${params}`);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <>
      <Header title="Usuarios" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filtros */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todos</option>
              <option value="cliente">Clientes</option>
              <option value="rider">Riders</option>
              <option value="negocio">Negocios</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Nombre, email o teléfono..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Buscar
          </button>
        </form>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{pagination.total} usuarios encontrados</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No se encontraron usuarios</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Usuario</th>
                    <th className="px-5 py-3 text-left">Contacto</th>
                    <th className="px-5 py-3 text-center">Rol</th>
                    <th className="px-5 py-3 text-left">Registro</th>
                    <th className="px-5 py-3 text-center">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const rolCfg = rolConfig[u.rol] ?? { label: u.rol, color: "bg-gray-100 text-gray-600" };
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-semibold text-xs">
                                {u.nombres?.[0]}
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{u.nombres} {u.apellidos}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          <p>{u.email}</p>
                          <p className="text-xs text-gray-400">{u.telefono}</p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rolCfg.color}`}>
                            {rolCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString("es-SV")}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Link
                            to={u.rol === "rider" ? `/riders/${u.id}` : `/users/${u.id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination.last_page > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <p className="text-gray-500">Página {pagination.current_page} de {pagination.last_page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 text-xs">Anterior</button>
                <button onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={page === pagination.last_page} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 text-xs">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
