import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Detalle de pedido — Pallevar Admin" }];
}

interface PedidoDetalle {
  id: string;
  estado: string;
  total: number;
  contenido: {
    items: { producto: { nombre: string }; cantidad: number; precio_unitario?: number }[];
    pago: string;
    tipoFactura: string;
    fecha_hora: string;
  };
  negocio: { id: string; nombre: string; direccion: string; telefono: string };
  cliente: { id: string; nombre: string; email: string; telefono: string };
  rider: { id: string; nombre: string; telefono: string } | null;
  ubicacion_entrega: { direccion: string; referencia: string; lat: string; lng: string } | null;
  created_at: string;
  updated_at: string;
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

const ESTADOS = ["pendiente", "aceptado", "preparando", "en_camino", "entregado", "cancelado", "sin_rider"];

function BadgeEstado({ estado }: { estado: string }) {
  const cfg = estadoConfig[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span className="text-gray-800 text-sm text-right">{value}</span>
    </div>
  );
}

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ success: boolean; data: PedidoDetalle }>(`/admin/pedidos/${id}`)
      .then((res) => setPedido(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEstadoChange(nuevoEstado: string) {
    if (!pedido || nuevoEstado === pedido.estado) return;
    setUpdatingEstado(true);
    try {
      await api.put(`/admin/pedidos/${pedido.id}/status`, { estado: nuevoEstado });
      setPedido((prev) => prev ? { ...prev, estado: nuevoEstado } : prev);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setUpdatingEstado(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle de pedido" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !pedido) {
    return (
      <>
        <Header title="Detalle de pedido" />
        <div className="p-6 text-red-500">{error ?? "No encontrado"}</div>
      </>
    );
  }

  const items = pedido.contenido?.items ?? [];

  return (
    <>
      <Header title={`Pedido #${pedido.id.slice(0, 8)}`} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/pedidos" className="hover:text-indigo-600">Pedidos</Link>
          <span>/</span>
          <span className="text-gray-700 font-mono text-xs">{pedido.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Estado y cambio */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Estado actual</p>
                  <BadgeEstado estado={pedido.estado} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Cambiar a:</span>
                  <select
                    disabled={updatingEstado}
                    value={pedido.estado}
                    onChange={(e) => handleEstadoChange(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>{estadoConfig[e]?.label ?? e}</option>
                    ))}
                  </select>
                  {updatingEstado && (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            </div>

            {/* Items del pedido */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">
                Productos del pedido
              </h3>
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin items</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                    <tr>
                      <th className="pb-2 text-left">Producto</th>
                      <th className="pb-2 text-center">Cant.</th>
                      <th className="pb-2 text-right">Precio unit.</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, i) => {
                      const nombre = item.producto?.nombre ?? "Producto";
                      const precio = item.precio_unitario ?? 0;
                      return (
                        <tr key={i}>
                          <td className="py-2.5 text-gray-700">{nombre}</td>
                          <td className="py-2.5 text-center text-gray-600">{item.cantidad}</td>
                          <td className="py-2.5 text-right text-gray-600">${precio.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-medium text-gray-800">
                            ${(precio * item.cantidad).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700 text-sm">Total</td>
                      <td className="pt-3 text-right font-bold text-gray-900">${pedido.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Ubicación de entrega */}
            {pedido.ubicacion_entrega && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Dirección de entrega</h3>
                <p className="text-gray-700 text-sm">{pedido.ubicacion_entrega.direccion}</p>
                {pedido.ubicacion_entrega.referencia && (
                  <p className="text-gray-400 text-xs mt-1">Ref: {pedido.ubicacion_entrega.referencia}</p>
                )}
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-5">
            {/* Info del pedido */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Detalles</h3>
              <InfoRow label="Pago" value={pedido.contenido?.pago ?? "—"} />
              <InfoRow label="Factura" value={pedido.contenido?.tipoFactura ?? "—"} />
              <InfoRow label="Fecha" value={new Date(pedido.created_at).toLocaleString("es-SV")} />
              <InfoRow label="Total" value={<span className="font-bold">${pedido.total?.toFixed(2)}</span>} />
            </div>

            {/* Negocio */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Negocio</h3>
              <Link to={`/negocios/${pedido.negocio?.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                {pedido.negocio?.nombre}
              </Link>
              <p className="text-gray-400 text-xs mt-1">{pedido.negocio?.direccion}</p>
              <p className="text-gray-400 text-xs">{pedido.negocio?.telefono}</p>
            </div>

            {/* Cliente */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Cliente</h3>
              <Link to={`/users/${pedido.cliente?.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                {pedido.cliente?.nombre}
              </Link>
              <p className="text-gray-400 text-xs mt-1">{pedido.cliente?.email}</p>
              <p className="text-gray-400 text-xs">{pedido.cliente?.telefono}</p>
            </div>

            {/* Rider */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Rider</h3>
              {pedido.rider ? (
                <>
                  <Link to={`/riders/${pedido.rider.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                    {pedido.rider.nombre}
                  </Link>
                  <p className="text-gray-400 text-xs mt-1">{pedido.rider.telefono}</p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sin asignar</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
