// Alerta global en tiempo real de pedidos SIN RIDER esperando recolocación.
// - Al montar, siembra el estado con los pedidos sin_rider actuales (API admin).
// - Escucha por WebSocket: 'pedido.sin_rider' (agrega/actualiza) y
//   'pedido_rider_asignado' (quita, porque ya se recolocó).
// Se renderiza en el layout, así "salta" en cualquier pantalla del backoffice.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/services/api";
import { getSocket } from "~/services/socket";

interface SinRiderItem {
  pedido_id: string;
  negocio_id?: string;
  intento?: number;
  proximo_intento_en?: number;
}

interface PedidosResp {
  data: Array<{ id: string; negocio?: { id: string } }>;
}

export function SinRiderAlert() {
  const [items, setItems] = useState<Record<string, SinRiderItem>>({});

  useEffect(() => {
    let activo = true;

    // 1) Estado inicial desde la API (pedidos ya en sin_rider).
    api
      .get<PedidosResp>("/admin/pedidos?estado=sin_rider")
      .then((res) => {
        if (!activo) return;
        const init: Record<string, SinRiderItem> = {};
        for (const p of res.data ?? []) {
          init[p.id] = { pedido_id: p.id, negocio_id: p.negocio?.id };
        }
        setItems((prev) => ({ ...init, ...prev }));
      })
      .catch(() => {/* silencioso: la alerta también llega por socket */});

    // 2) Tiempo real.
    const socket = getSocket();
    if (!socket) return () => { activo = false; };

    const onSinRider = (d: SinRiderItem) =>
      setItems((prev) => ({ ...prev, [d.pedido_id]: { ...prev[d.pedido_id], ...d } }));

    const onAsignado = (d: { pedido_id: string }) =>
      setItems((prev) => {
        if (!prev[d.pedido_id]) return prev;
        const copy = { ...prev };
        delete copy[d.pedido_id];
        return copy;
      });

    socket.on("pedido.sin_rider", onSinRider);
    socket.on("pedido_rider_asignado", onAsignado);

    return () => {
      activo = false;
      socket.off("pedido.sin_rider", onSinRider);
      socket.off("pedido_rider_asignado", onAsignado);
    };
  }, []);

  const list = Object.values(items);
  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-red-300 bg-white shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-red-600 px-4 py-2 text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="font-semibold text-sm">
          {list.length} pedido{list.length > 1 ? "s" : ""} sin rider
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
        {list.map((it) => (
          <Link
            key={it.pedido_id}
            to={`/pedidos/${it.pedido_id}`}
            className="block px-4 py-2 text-sm hover:bg-red-50"
          >
            <div className="font-medium text-gray-800">#{String(it.pedido_id).slice(0, 8)}</div>
            <div className="text-xs text-gray-500">
              {it.intento ? `Reintento #${it.intento}` : "Esperando recolocación"}
              {it.proximo_intento_en ? ` · próx. ${it.proximo_intento_en}s` : ""}
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/pedidos?estado=sin_rider"
        className="block bg-gray-50 px-4 py-2 text-center text-xs font-medium text-red-700 hover:bg-gray-100"
      >
        Ver todos →
      </Link>
    </div>
  );
}
