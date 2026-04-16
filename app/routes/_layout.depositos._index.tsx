import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

const POLL_INTERVAL = 15_000; // 15 segundos

export function meta() {
  return [{ title: "Depósitos — Pallevar Admin" }];
}

type EstadoDeposito = "pendiente" | "aprobado" | "rechazado";

interface Deposito {
  id: string;
  monto: number;
  estado: EstadoDeposito;
  nota: string | null;
  rider: { id: string; nombre: string; email: string } | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Deposito[];
  pagination: { current_page: number; last_page: number; total: number };
}

const estadoConfig: Record<EstadoDeposito, { label: string; color: string }> = {
  pendiente: { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  aprobado:  { label: "Aprobado",   color: "bg-green-100 text-green-700"   },
  rechazado: { label: "Rechazado",  color: "bg-red-100 text-red-600"       },
};

export default function DepositosPage() {
  const [depositos, setDepositos]   = useState<Deposito[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [notaRechazar, setNotaRechazar]   = useState("");
  const [modalRechazar, setModalRechazar] = useState<Deposito | null>(null);
  const [nuevos, setNuevos]         = useState(0);   // badge de nuevos pendientes
  const [lastCheck, setLastCheck]   = useState<string | null>(null); // ISO del último fetch

  const pageRef        = useRef(page);
  const filtroRef      = useRef(filtroEstado);
  const lastCheckRef   = useRef<string | null>(null);
  pageRef.current      = page;
  filtroRef.current    = filtroEstado;

  // ── Carga inicial + polling ───────────────────────────────────────────────
  useEffect(() => { fetchDepositos(1); }, [filtroEstado]);

  useEffect(() => {
    const timer = setInterval(() => {
      pollNuevos();
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const fetchDepositos = async (p: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), per_page: "20" });
      if (filtroRef.current) qs.set("estado", filtroRef.current);

      const res = await api.get<ApiResponse>(`/admin/depositos?${qs.toString()}`);
      setDepositos(res.data);
      setPage(res.pagination.current_page);
      setLastPage(res.pagination.last_page);
      setTotal(res.pagination.total);
      setNuevos(0);
      lastCheckRef.current = new Date().toISOString();
      setLastCheck(lastCheckRef.current);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Sondeo silencioso: sólo cuenta pendientes nuevos desde el último fetch
  const pollNuevos = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ page: "1", per_page: "20", estado: "pendiente" });
      const res = await api.get<ApiResponse>(`/admin/depositos?${qs.toString()}`);

      // Si hay más pendientes que antes (o es la primera vez), mostrar badge
      if (res.pagination.total > 0) {
        // Comparar cuántos son más nuevos que el último check
        const nuevosCount = lastCheckRef.current
          ? res.data.filter(d => new Date(d.created_at) > new Date(lastCheckRef.current!)).length
          : 0;
        if (nuevosCount > 0) setNuevos(prev => prev + nuevosCount);
      }
    } catch (_) {}
  }, []);

  const aprobar = async (deposito: Deposito) => {
    if (!confirm(`¿Aprobar depósito de $${deposito.monto.toFixed(2)} de ${deposito.rider?.nombre}?`)) return;
    setProcesando(deposito.id);
    try {
      await api.patch(`/admin/depositos/${deposito.id}/aprobar`);
      fetchDepositos(page);
    } catch (e: any) {
      alert(e.message ?? "Error al aprobar");
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async () => {
    if (!modalRechazar) return;
    setProcesando(modalRechazar.id);
    try {
      await api.patch(`/admin/depositos/${modalRechazar.id}/rechazar`, { nota: notaRechazar });
      setModalRechazar(null);
      setNotaRechazar("");
      fetchDepositos(page);
    } catch (e: any) {
      alert(e.message ?? "Error al rechazar");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Depósitos de Riders" />

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
          <div className="flex gap-3 items-center">
            <select
              value={filtroEstado}
              onChange={e => { setFiltroEstado(e.target.value); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
            <span className="text-sm text-slate-500">{total} registros</span>
          </div>
          <button
            onClick={() => fetchDepositos(1)}
            className="relative px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            ↻ Actualizar
            {nuevos > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {nuevos}
              </span>
            )}
          </button>
        </div>

        {/* Banner de nuevos depósitos */}
        {nuevos > 0 && (
          <div
            className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 cursor-pointer hover:bg-indigo-100 transition-colors"
            onClick={() => fetchDepositos(1)}
          >
            <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                {nuevos}
              </span>
              {nuevos === 1
                ? "Hay 1 nuevo depósito pendiente"
                : `Hay ${nuevos} nuevos depósitos pendientes`}
            </div>
            <span className="text-indigo-500 text-xs font-semibold">Ver ahora →</span>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : depositos.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No hay depósitos</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Rider</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Monto</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Nota</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depositos.map(dep => {
                  const cfg = estadoConfig[dep.estado];
                  const isProcesando = procesando === dep.id;
                  return (
                    <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{dep.rider?.nombre ?? "—"}</div>
                        <div className="text-xs text-slate-400">{dep.rider?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        ${dep.monto.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(dep.created_at).toLocaleString("es-SV")}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                        {dep.nota ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dep.estado === "pendiente" ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => aprobar(dep)}
                              disabled={isProcesando}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {isProcesando ? "..." : "Aprobar"}
                            </button>
                            <button
                              onClick={() => { setModalRechazar(dep); setNotaRechazar(""); }}
                              disabled={isProcesando}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {lastPage > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            <button
              onClick={() => fetchDepositos(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-sm text-slate-500">
              Página {page} de {lastPage}
            </span>
            <button
              onClick={() => fetchDepositos(page + 1)}
              disabled={page >= lastPage}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>

      {/* Modal rechazar */}
      {modalRechazar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Rechazar depósito</h3>
            <p className="text-sm text-slate-500 mb-4">
              Depósito de <strong>{modalRechazar.rider?.nombre}</strong> por{" "}
              <strong>${modalRechazar.monto.toFixed(2)}</strong>
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nota (opcional)
            </label>
            <textarea
              value={notaRechazar}
              onChange={e => setNotaRechazar(e.target.value)}
              rows={3}
              placeholder="Motivo del rechazo..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalRechazar(null)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={rechazar}
                disabled={procesando === modalRechazar.id}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {procesando === modalRechazar.id ? "Rechazando..." : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
