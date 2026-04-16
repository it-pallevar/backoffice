import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Detalle de negocio — Pallevar Admin" }];
}

interface NegocioDetalle {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  lat: string | null;
  long: string | null;
  is_activo: boolean;
  logo_url: string | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  rating_promedio: number | null;
  propietario: { id: string; nombre: string; email: string; telefono: string };
  stats: {
    total_pedidos: number;
    pedidos_entregados: number;
    ingresos_total: number;
    total_productos: number;
    total_reviews: number;
  };
  productos: { id: string; nombre: string; precio: number; activo: boolean }[];
  created_at: string;
}

export default function NegocioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [negocio, setNegocio] = useState<NegocioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ success: boolean; data: NegocioDetalle }>(`/admin/negocios/${id}`)
      .then((res) => setNegocio(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggle() {
    if (!negocio) return;
    setToggling(true);
    try {
      await api.patch(`/admin/negocios/${negocio.id}/toggle`);
      setNegocio((prev) => prev ? { ...prev, is_activo: !prev.is_activo } : prev);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle de negocio" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !negocio) {
    return (
      <>
        <Header title="Detalle de negocio" />
        <div className="p-6 text-red-500">{error ?? "No encontrado"}</div>
      </>
    );
  }

  return (
    <>
      <Header title={negocio.nombre} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/negocios" className="hover:text-indigo-600">Negocios</Link>
          <span>/</span>
          <span className="text-gray-700">{negocio.nombre}</span>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-5 flex-wrap">
            {negocio.logo_url ? (
              <img src={negocio.logo_url} alt={negocio.nombre} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-3xl font-bold shrink-0">
                {negocio.nombre[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{negocio.nombre}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${negocio.is_activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {negocio.is_activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{negocio.direccion}</p>
              <p className="text-gray-500 text-sm">{negocio.telefono}</p>
              {(negocio.hora_apertura || negocio.hora_cierre) && (
                <p className="text-gray-400 text-xs mt-1">
                  {negocio.hora_apertura} – {negocio.hora_cierre}
                </p>
              )}
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${negocio.is_activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
            >
              {toggling ? "..." : negocio.is_activo ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total pedidos", value: negocio.stats.total_pedidos },
            { label: "Entregados", value: negocio.stats.pedidos_entregados },
            { label: "Ingresos", value: `$${negocio.stats.ingresos_total.toFixed(2)}` },
            { label: "Productos", value: negocio.stats.total_productos },
            { label: "Reseñas", value: negocio.stats.total_reviews },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Propietario */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Propietario</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                {negocio.propietario.nombre?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{negocio.propietario.nombre}</p>
                <p className="text-gray-400 text-xs">{negocio.propietario.email}</p>
                <p className="text-gray-400 text-xs">{negocio.propietario.telefono}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Calificación promedio</h3>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {negocio.rating_promedio ?? "—"}
              </span>
              <span className="text-2xl">⭐</span>
              <span className="text-gray-400 text-sm">/ 5.0</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">{negocio.stats.total_reviews} reseñas</p>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            Productos ({negocio.productos.length})
          </h3>
          {negocio.productos.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin productos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <tr>
                    <th className="pb-2 text-left">Nombre</th>
                    <th className="pb-2 text-right">Precio</th>
                    <th className="pb-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {negocio.productos.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 text-gray-700">{p.nombre}</td>
                      <td className="py-2.5 text-right text-gray-600">${p.precio.toFixed(2)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
