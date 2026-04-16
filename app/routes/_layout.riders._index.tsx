import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Riders — Pallevar Admin" }];
}

interface RiderDocumento {
  estado: "pendiente" | "aprobado" | "rechazado";
}

interface Rider {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  avatar_url: string | null;
  riderDocumentos: RiderDocumento | null;
  created_at: string;
}

interface PaginatedResponse {
  status: string;
  data: {
    data: Rider[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

const docEstadoConfig: Record<string, { label: string; color: string }> = {
  pendiente:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  aprobado:   { label: "Aprobado",   color: "bg-green-100 text-green-700" },
  rechazado:  { label: "Rechazado",  color: "bg-red-100 text-red-600" },
};

function BadgeDocEstado({ estado }: { estado?: string }) {
  if (!estado) return <span className="text-gray-300 text-xs">Sin docs</span>;
  const cfg = docEstadoConfig[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse>(`/admin/riders?page=${page}`)
      .then((res) => {
        setRiders(res.data.data);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleEstado(id: string, estado: string) {
    try {
      await api.put(`/admin/riders/${id}/estado`, { estado });
      setRiders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, riderDocumentos: r.riderDocumentos ? { ...r.riderDocumentos, estado: estado as "aprobado" | "rechazado" | "pendiente" } : r.riderDocumentos }
            : r
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    }
  }

  return (
    <>
      <Header title="Riders" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{pagination.total} riders registrados</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : riders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No hay riders registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Rider</th>
                    <th className="px-5 py-3 text-left">Contacto</th>
                    <th className="px-5 py-3 text-center">Documentos</th>
                    <th className="px-5 py-3 text-left">Registro</th>
                    <th className="px-5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {riders.map((r) => {
                    const docEstado = r.riderDocumentos?.estado;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-semibold text-xs">
                                {r.nombres?.[0]}
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{r.nombres} {r.apellidos}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          <p>{r.email}</p>
                          <p className="text-xs text-gray-400">{r.telefono}</p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <BadgeDocEstado estado={docEstado} />
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(r.created_at).toLocaleDateString("es-SV")}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Link to={`/riders/${r.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                              Ver
                            </Link>
                            {docEstado === "pendiente" && (
                              <>
                                <button onClick={() => handleEstado(r.id, "aprobado")} className="text-green-600 hover:text-green-800 text-xs font-medium">
                                  Aprobar
                                </button>
                                <button onClick={() => handleEstado(r.id, "rechazado")} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                  Rechazar
                                </button>
                              </>
                            )}
                            {docEstado === "aprobado" && (
                              <button onClick={() => handleEstado(r.id, "rechazado")} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                Revocar
                              </button>
                            )}
                            {docEstado === "rechazado" && (
                              <button onClick={() => handleEstado(r.id, "aprobado")} className="text-green-600 hover:text-green-800 text-xs font-medium">
                                Aprobar
                              </button>
                            )}
                          </div>
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
