// Alerta global de restaurantes recién registrados (formulario de preregistro)
// que esperan activación.
// - Consulta /admin/negocios?activo=0 al montar, cada minuto y al volver a la pestaña.
// - Muestra los inactivos creados en los últimos DIAS_RECIENTES días.
// - "Ocultar" descarta uno solo en este navegador (localStorage); al activarlo
//   desde su detalle deja de ser inactivo y sale solo de la lista.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/services/api";

const INTERVALO_MS = 60_000;
const DIAS_RECIENTES = 30;
const STORAGE_KEY = "alerta_registros_ocultos";

interface NegocioPendiente {
  id: string;
  nombre: string;
  created_at: string;
  propietario?: { nombre?: string; telefono?: string };
}

interface NegociosResp {
  data: NegocioPendiente[];
}

function leerOcultos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function guardarOcultos(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // sin storage: se vuelve a mostrar al recargar, no es crítico
  }
}

function haceCuanto(fecha: string): string {
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d > 1 ? "s" : ""}`;
}

export function NuevosRestaurantesAlert() {
  const [pendientes, setPendientes] = useState<NegocioPendiente[]>([]);
  const [ocultos, setOcultos] = useState<string[]>([]);

  useEffect(() => {
    setOcultos(leerOcultos());

    let activo = true;
    const cargar = () => {
      api
        .get<NegociosResp>("/admin/negocios?activo=0")
        .then((res) => {
          if (!activo) return;
          const limite = Date.now() - DIAS_RECIENTES * 24 * 60 * 60 * 1000;
          setPendientes(
            (res.data ?? []).filter((n) => new Date(n.created_at).getTime() >= limite)
          );
        })
        .catch(() => {/* silencioso: se reintenta en el próximo ciclo */});
    };

    cargar();
    const timer = setInterval(cargar, INTERVALO_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") cargar();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      activo = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const ocultar = (id: string) => {
    const nuevos = [...ocultos, id];
    setOcultos(nuevos);
    guardarOcultos(nuevos);
  };

  const list = pendientes.filter((n) => !ocultos.includes(n.id));
  if (list.length === 0) return null;

  return (
    <div className="w-80 rounded-xl border border-amber-300 bg-white shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="font-semibold text-sm">
          {list.length} restaurante{list.length > 1 ? "s" : ""} nuevo{list.length > 1 ? "s" : ""} por activar
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
        {list.map((n) => (
          <div key={n.id} className="flex items-start gap-2 px-4 py-2 hover:bg-amber-50">
            <Link to={`/negocios/${n.id}`} className="flex-1 min-w-0 text-sm">
              <div className="font-medium text-gray-800 truncate">{n.nombre}</div>
              <div className="text-xs text-gray-500 truncate">
                {n.propietario?.nombre?.trim() || "Sin propietario"}
                {n.propietario?.telefono ? ` · ${n.propietario.telefono}` : ""}
                {` · ${haceCuanto(n.created_at)}`}
              </div>
            </Link>
            <button
              type="button"
              onClick={() => ocultar(n.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Ocultar esta alerta"
            >
              Ocultar
            </button>
          </div>
        ))}
      </div>

      <Link
        to="/negocios?activo=0"
        className="block bg-gray-50 px-4 py-2 text-center text-xs font-medium text-amber-700 hover:bg-gray-100"
      >
        Ver inactivos →
      </Link>
    </div>
  );
}
