import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Pedidos — Pallevar Admin" }];
}

interface PedidoItem {
  id: string;
  estado: string;
  total: number;
  negocio: { id: string; nombre: string };
  cliente: { id: string; nombre: string; email: string };
  rider: { id: string; nombre: string } | null;
  created_at: string;
}

interface PaginatedResponse {
  success: boolean;
  data: PedidoItem[];
  pagination: { current_page: number; last_page: number; total: number };
}

const estadoConfig: Record<string, { label: string; color: string }> = {
  pendiente:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  aceptado:   { label: "Aceptado",   color: "bg-blue-100 text-blue-800" },
  preparando: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  en_camino:  { label: "En camino",  color: "bg-indigo-100 text-indigo-800" },
  entregado:  { label: "Entregado",  color: "bg-green-100 text-green-800" },
  cancelado:  { label: "Cancelado",  color: "bg-red-100 text-red-800" },
  sin_rider:  { label: "Sin rider",  color: "bg-gray-100 text-gray-600" },
};

function BadgeEstado({ estado }: { estado: string }) {
  const cfg = estadoConfig[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estado, setEstado] = useState("");
  const [cliente, setCliente] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  async function fetchPedidos() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (cliente) params.set("cliente", cliente);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    params.set("page", String(page));
    try {
      const res = await api.get<PaginatedResponse>(`/admin/pedidos?${params}`);
      setPedidos(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPedidos(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPedidos();
  }

  return (
    <>
      <Header title="Pedidos" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filtros */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="w-36">
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
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre o email..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Buscar
          </button>
          {(estado || cliente || desde || hasta) && (
            <button
              type="button"
              onClick={() => { setEstado(""); setCliente(""); setDesde(""); setHasta(""); setPage(1); setTimeout(fetchPedidos, 0); }}
              className="text-gray-400 hover:text-gray-700 text-sm px-3 py-2"
            >
              Limpiar
            </button>
          )}
        </form>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{pagination.total} pedidos encontrados</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : pedidos.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No se encontraron pedidos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Negocio</th>
                    <th className="px-5 py-3 text-left">Cliente</th>
                    <th className="px-5 py-3 text-left">Rider</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pedidos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">
                        {p.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{p.negocio?.nombre}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <p>{p.cliente?.nombre}</p>
                        <p className="text-xs text-gray-400">{p.cliente?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {p.rider ? p.rider.nombre : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <BadgeEstado estado={p.estado} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                        ${p.total?.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link to={`/pedidos/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
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
