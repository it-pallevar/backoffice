import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";
import {
  categoriaLabel,
  categoriasPorRol,
  estadoConfig,
  rolConfig,
  BadgeEstado,
  BadgeRol,
} from "~/lib/reportes";

export function meta() {
  return [{ title: "Reportes — Pallevar Admin" }];
}

interface ReporteItem {
  id: string;
  pedido_id: string | null;
  autor: { id: string; nombre: string; rol: string };
  categoria: string;
  descripcion: string;
  foto_url: string | null;
  estado: string;
  respuesta_admin: string | null;
  created_at: string;
}

interface PaginatedResponse {
  success: boolean;
  data: ReporteItem[];
  pagination: { current_page: number; last_page: number; total: number };
}

export default function ReportesPage() {
  const [reportes, setReportes] = useState<ReporteItem[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estado, setEstado] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("estado") ?? ""
      : ""
  );
  const [categoria, setCategoria] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("categoria") ?? ""
      : ""
  );
  const [rol, setRol] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("rol") ?? ""
      : ""
  );
  const [page, setPage] = useState(1);

  async function fetchReportes() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (categoria) params.set("categoria", categoria);
    if (rol) params.set("rol", rol);
    params.set("page", String(page));
    try {
      const res = await api.get<PaginatedResponse>(`/admin/reportes?${params}`);
      setReportes(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReportes(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchReportes();
  }

  return (
    <>
      <Header title="Reportes" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filtros */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todos</option>
              {Object.entries(estadoConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Rol del autor</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todos</option>
              {Object.entries(rolConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="w-52">
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todas</option>
              {Object.entries(categoriasPorRol).map(([rolKey, cats]) => (
                <optgroup key={rolKey} label={rolConfig[rolKey]?.label ?? rolKey}>
                  {cats.map((c) => (
                    <option key={`${rolKey}-${c.value}`} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Buscar
          </button>
          {(estado || categoria || rol) && (
            <button
              type="button"
              onClick={() => { setEstado(""); setCategoria(""); setRol(""); setPage(1); setTimeout(fetchReportes, 0); }}
              className="text-gray-400 hover:text-gray-700 text-sm px-3 py-2"
            >
              Limpiar
            </button>
          )}
        </form>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{pagination.total} reportes encontrados</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : reportes.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No se encontraron reportes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-left">Autor</th>
                    <th className="px-5 py-3 text-left">Categoría</th>
                    <th className="px-5 py-3 text-left">Pedido</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                    <th className="px-5 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        <p className="font-medium text-gray-800">{r.autor?.nombre || "—"}</p>
                        <div className="mt-0.5"><BadgeRol rol={r.autor?.rol} /></div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{categoriaLabel(r.categoria)}</td>
                      <td className="px-5 py-3.5">
                        {r.pedido_id ? (
                          <Link to={`/pedidos/${r.pedido_id}`} className="text-indigo-600 hover:text-indigo-800 font-mono text-xs">
                            {r.pedido_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <BadgeEstado estado={r.estado} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link to={`/reportes/${r.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
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
