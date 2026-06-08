import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Detalle de usuario — Pallevar Admin" }];
}

interface PedidoReciente {
  id: string;
  estado: string;
  total: number;
  negocio: string | null;
}

interface UserDetalle {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string | null;
  rol: string;
  is_activo: boolean;
  avatar_url: string | null;
  created_at: string;
  // cliente
  total_pedidos?: number;
  pedidos_recientes?: PedidoReciente[];
  // rider
  total_entregas?: number;
  documentos?: {
    estado: string;
    licencia: string | null;
    dui: string | null;
    antecedentes_penales: string | null;
    constancia_policia: string | null;
  } | null;
  wallet?: {
    cash_collected_today: number;
    earnings_available: number;
  } | null;
  // negocio
  negocio?: { id: string; nombre: string; is_activo: boolean } | null;
}

const rolConfig: Record<string, { label: string; color: string }> = {
  admin:   { label: "Admin",   color: "bg-purple-100 text-purple-700" },
  negocio: { label: "Negocio", color: "bg-indigo-100 text-indigo-700" },
  rider:   { label: "Rider",   color: "bg-blue-100 text-blue-700" },
  cliente: { label: "Cliente", color: "bg-gray-100 text-gray-600" },
};

const estadoPedidoColor: Record<string, string> = {
  pendiente:  "bg-yellow-100 text-yellow-700",
  aceptado:   "bg-blue-100 text-blue-700",
  en_camino:  "bg-indigo-100 text-indigo-700",
  entregado:  "bg-green-100 text-green-700",
  cancelado:  "bg-red-100 text-red-600",
};

export default function UserDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ success: boolean; data: UserDetalle }>(`/admin/users/${id}`)
      .then((res) => setUser(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggle() {
    if (!user) return;
    setToggling(true);
    setConfirmToggle(false);
    try {
      const res = await api.patch<{ success: boolean; is_activo: boolean }>(`/admin/users/${user.id}/toggle`);
      setUser((prev) => prev ? { ...prev, is_activo: res.is_activo } : prev);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle de usuario" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Header title="Detalle de usuario" />
        <div className="p-6 text-red-500">{error ?? "No encontrado"}</div>
      </>
    );
  }

  const rolCfg = rolConfig[user.rol] ?? { label: user.rol, color: "bg-gray-100 text-gray-600" };

  return (
    <>
      <Header title={`${user.nombres} ${user.apellidos}`} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/users" className="hover:text-indigo-600">Usuarios</Link>
          <span>/</span>
          <span className="text-gray-700">{user.nombres} {user.apellidos}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna izquierda: perfil + acciones */}
          <div className="space-y-5">

            {/* Tarjeta de perfil */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col items-center text-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-3xl font-bold">
                    {user.nombres?.[0]}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{user.nombres} {user.apellidos}</h2>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  {user.telefono && <p className="text-gray-400 text-sm">{user.telefono}</p>}
                  {user.direccion && <p className="text-gray-400 text-xs mt-1">{user.direccion}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rolCfg.color}`}>
                    {rolCfg.label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {user.is_activo ? "Activo" : "Bloqueado"}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">
                  Registrado el {new Date(user.created_at).toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Acciones */}
              <div className="mt-5 space-y-2">
                {/* Bloquear / Activar */}
                {!confirmToggle ? (
                  <button
                    onClick={() => setConfirmToggle(true)}
                    disabled={toggling}
                    className={`w-full text-sm font-medium py-2 rounded-lg transition disabled:opacity-60 ${user.is_activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                  >
                    {user.is_activo ? "Bloquear usuario" : "Activar usuario"}
                  </button>
                ) : (
                  <div className="border border-red-200 rounded-lg p-3 space-y-2 bg-red-50">
                    <p className="text-xs text-red-700 text-center font-medium">
                      ¿Confirmás {user.is_activo ? "bloquear" : "activar"} a {user.nombres}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className="flex-1 bg-red-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {toggling ? "..." : "Confirmar"}
                      </button>
                      <button
                        onClick={() => setConfirmToggle(false)}
                        className="flex-1 bg-white text-gray-600 text-xs font-medium py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Si es rider, link a su perfil de rider */}
                {user.rol === "rider" && (
                  <Link
                    to={`/riders/${user.id}`}
                    className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    Ver perfil de rider
                  </Link>
                )}

                {/* Si tiene negocio, link al negocio */}
                {user.rol === "negocio" && user.negocio && (
                  <Link
                    to={`/negocios/${user.negocio.id}`}
                    className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Ver negocio
                  </Link>
                )}
              </div>
            </div>

            {/* Wallet (rider) */}
            {user.wallet && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Billetera</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Efectivo cobrado hoy</span>
                    <span className="font-semibold text-gray-800">${user.wallet.cash_collected_today?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Ganancias disponibles</span>
                    <span className="font-semibold text-green-700">${user.wallet.earnings_available?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Negocio asociado */}
            {user.negocio && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Negocio asociado</h3>
                <div className="flex items-center justify-between">
                  <p className="text-gray-800 font-medium text-sm">{user.negocio.nombre}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.negocio.is_activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {user.negocio.is_activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats de cliente */}
            {user.rol === "cliente" && typeof user.total_pedidos === "number" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Actividad</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-gray-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-gray-900">{user.total_pedidos}</p>
                    <p className="text-xs text-gray-400 mt-1">Pedidos totales</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-gray-900">
                      {user.pedidos_recientes?.filter((p) => p.estado === "entregado").length ?? 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Entregados (últimos 5)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats de rider */}
            {user.rol === "rider" && typeof user.total_entregas === "number" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Actividad</h3>
                <div className="text-center bg-gray-50 rounded-lg p-4 max-w-xs">
                  <p className="text-3xl font-bold text-gray-900">{user.total_entregas}</p>
                  <p className="text-xs text-gray-400 mt-1">Entregas completadas</p>
                </div>
              </div>
            )}

            {/* Pedidos recientes (cliente) */}
            {user.pedidos_recientes && user.pedidos_recientes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Pedidos recientes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <tr>
                        <th className="pb-2 text-left">Negocio</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2 text-center">Estado</th>
                        <th className="pb-2 text-center">Ver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {user.pedidos_recientes.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 text-gray-700">{p.negocio ?? "—"}</td>
                          <td className="py-2.5 text-right text-gray-600">${p.total?.toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoPedidoColor[p.estado] ?? "bg-gray-100 text-gray-500"}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <Link to={`/pedidos/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                              Ver
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Documentos (rider) */}
            {user.documentos !== undefined && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Documentos</h3>
                {!user.documentos ? (
                  <p className="text-gray-400 text-sm">No ha subido documentos aún</p>
                ) : (
                  <>
                    <div className="mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.documentos.estado === "aprobado" ? "bg-green-100 text-green-700" : user.documentos.estado === "rechazado" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                        {user.documentos.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { url: user.documentos.licencia, label: "Licencia" },
                        { url: user.documentos.dui, label: "DUI" },
                        { url: user.documentos.antecedentes_penales, label: "Antecedentes penales" },
                        { url: user.documentos.constancia_policia, label: "Constancia policía" },
                      ].map(({ url, label }) =>
                        url ? (
                          <a key={label} href={url} target="_blank" rel="noreferrer" className="block">
                            <img src={url} alt={label} className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition" />
                            <p className="text-xs text-indigo-600 text-center mt-1 hover:underline">{label}</p>
                          </a>
                        ) : (
                          <div key={label} className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-300 text-xs">
                            Sin {label}
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mensaje para admin */}
            {user.rol === "admin" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center text-gray-400 text-sm">
                Usuario administrador — sin información adicional
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
