// Helpers y configuración compartida para la gestión de reportes de pedidos.

export const estadoConfig: Record<string, { label: string; color: string }> = {
  abierto:     { label: "Abierto",     color: "bg-yellow-100 text-yellow-800" },
  en_revision: { label: "En revisión", color: "bg-blue-100 text-blue-800" },
  resuelto:    { label: "Resuelto",    color: "bg-green-100 text-green-800" },
  rechazado:   { label: "Rechazado",   color: "bg-red-100 text-red-800" },
};

export const ESTADOS = ["abierto", "en_revision", "resuelto", "rechazado"];

export const rolConfig: Record<string, { label: string; color: string }> = {
  cliente: { label: "Cliente",    color: "bg-indigo-100 text-indigo-700" },
  rider:   { label: "Repartidor", color: "bg-teal-100 text-teal-700" },
  negocio: { label: "Negocio",    color: "bg-amber-100 text-amber-700" },
};

// Categorías agrupadas por rol del autor (fuente: Reporte.php / ReporteAdminController.php).
export const categoriasPorRol: Record<string, { value: string; label: string }[]> = {
  cliente: [
    { value: "producto_mal_estado", label: "Producto en mal estado" },
    { value: "pedido_incompleto", label: "Pedido incompleto" },
    { value: "problema_repartidor", label: "Problema con el repartidor" },
    { value: "no_llego", label: "No llegó" },
    { value: "cobro_incorrecto", label: "Cobro incorrecto" },
    { value: "otro", label: "Otro" },
  ],
  rider: [
    { value: "cliente_no_responde", label: "El cliente no responde" },
    { value: "direccion_incorrecta", label: "Dirección incorrecta" },
    { value: "demora_negocio", label: "Demora del negocio" },
    { value: "problema_pago", label: "Problema con el pago" },
    { value: "otro", label: "Otro" },
  ],
  negocio: [
    { value: "problema_repartidor", label: "Problema con el repartidor" },
    { value: "cliente_cancelo", label: "Cliente canceló" },
    { value: "otro", label: "Otro" },
  ],
};

// Mapa plano value -> label. Los valores compartidos entre roles tienen la misma etiqueta.
const categoriaLabels: Record<string, string> = Object.values(categoriasPorRol)
  .flat()
  .reduce<Record<string, string>>((acc, c) => {
    acc[c.value] = c.label;
    return acc;
  }, {});

export function categoriaLabel(value: string): string {
  return categoriaLabels[value] ?? value;
}

export function BadgeEstado({ estado }: { estado: string }) {
  const cfg = estadoConfig[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function BadgeRol({ rol }: { rol?: string | null }) {
  if (!rol) return null;
  const cfg = rolConfig[rol] ?? { label: rol, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
