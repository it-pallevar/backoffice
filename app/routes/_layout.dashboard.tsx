import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Dashboard — Pallevar Admin" }];
}

interface DashboardStats {
  pedidos_hoy: number;
  pedidos_semana: number;
  pedidos_mes: number;
  ingresos_hoy: number;
  ingresos_semana: number;
  ingresos_mes: number;
  total_negocios: number;
  negocios_activos: number;
  total_riders: number;
  riders_aprobados: number;
  total_clientes: number;
  nuevos_clientes_hoy: number;
  estados_hoy: Record<string, number>;
  top_negocios: { negocio_id: string; nombre: string; pedidos: number; ingresos: number }[];
  pedidos_recientes: {
    id: string;
    estado: string;
    total: number;
    negocio: string;
    cliente: string;
    created_at: string;
  }[];
}

const estadoConfig: Record<string, { label: string; color: string }> = {
  pendiente:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  aceptado:   { label: "Aceptado",   color: "bg-blue-100 text-blue-800" },
  preparando: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  en_camino:  { label: "En camino",  color: "bg-indigo-100 text-indigo-800" },
  entregado:  { label: "Entregado",  color: "bg-green-100 text-green-800" },
  cancelado:  { label: "Cancelado",  color: "bg-red-100 text-red-800" },
  sin_rider:  { label: "Sin rider",  color: "bg-gray-100 text-gray-700" },
};

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "indigo",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "indigo" | "green" | "blue" | "orange";
}) {
  const bg = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  }[color];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: string }) {
  const cfg = estadoConfig[estado] ?? { label: estado, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; data: DashboardStats }>("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* KPI Cards — Pedidos */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Pedidos
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="Hoy"
                  value={stats.pedidos_hoy}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <StatCard
                  label="Esta semana"
                  value={stats.pedidos_semana}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  color="blue"
                />
                <StatCard
                  label="Este mes"
                  value={stats.pedidos_mes}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  color="green"
                />
              </div>
            </section>

            {/* KPI Cards — Ingresos */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Ingresos (pedidos entregados)
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="Hoy"
                  value={`$${stats.ingresos_hoy.toFixed(2)}`}
                  color="green"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Esta semana"
                  value={`$${stats.ingresos_semana.toFixed(2)}`}
                  color="green"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Este mes"
                  value={`$${stats.ingresos_mes.toFixed(2)}`}
                  color="green"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
              </div>
            </section>

            {/* Entidades */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Plataforma
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Negocios activos"
                  value={stats.negocios_activos}
                  sub={`de ${stats.total_negocios} totales`}
                  color="orange"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard
                  label="Riders aprobados"
                  value={stats.riders_aprobados}
                  sub={`de ${stats.total_riders} registrados`}
                  color="blue"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <StatCard
                  label="Clientes totales"
                  value={stats.total_clientes}
                  sub={`+${stats.nuevos_clientes_hoy} hoy`}
                  color="indigo"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <StatCard
                  label="Estados hoy"
                  value={Object.values(stats.estados_hoy).reduce((a, b) => a + b, 0)}
                  sub="pedidos con movimiento"
                  color="green"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
              </div>
            </section>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top negocios */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Top negocios del mes</h3>
                  <Link to="/negocios" className="text-indigo-600 text-xs hover:underline">
                    Ver todos
                  </Link>
                </div>
                {stats.top_negocios.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin datos aún</p>
                ) : (
                  <div className="space-y-3">
                    {stats.top_negocios.map((n, i) => (
                      <Link
                        key={n.negocio_id}
                        to={`/negocios/${n.negocio_id}`}
                        className="flex items-center gap-3 group"
                      >
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 truncate">
                            {n.nombre}
                          </p>
                          <p className="text-xs text-gray-400">{n.pedidos} pedidos</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          ${n.ingresos.toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Pedidos recientes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Pedidos recientes</h3>
                  <Link to="/pedidos" className="text-indigo-600 text-xs hover:underline">
                    Ver todos
                  </Link>
                </div>
                {stats.pedidos_recientes.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin pedidos aún</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.pedidos_recientes.map((p) => (
                      <Link
                        key={p.id}
                        to={`/pedidos/${p.id}`}
                        className="flex items-center justify-between gap-3 group py-1"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 truncate">
                            {p.negocio}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{p.cliente}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <BadgeEstado estado={p.estado} />
                          <p className="text-xs text-gray-500 mt-0.5">${p.total?.toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
