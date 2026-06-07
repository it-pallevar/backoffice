import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Riders en línea — Pallevar Admin" }];
}

interface RiderActivo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  avatar_url: string | null;
  doc_estado: "pendiente" | "aprobado" | "rechazado" | null;
  lat: number;
  lng: number;
  status: string;
  updated_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  available:  { label: "Disponible",  color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  busy:       { label: "Ocupado",     color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  en_pedido:  { label: "En pedido",   color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  unknown:    { label: "Desconocido", color: "bg-gray-100 text-gray-500",    dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// Componente del mapa — solo se monta en cliente
function MapaRiders({ riders }: { riders: RiderActivo[] }) {
  const mapRef = useRef<any>(null);
  const instanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let L: any;
    let map: any;

    const init = async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix ícono por defecto de Leaflet (problema común con bundlers)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || instanceRef.current) return;

      map = L.map(mapRef.current).setView([13.6929, -89.2182], 13);
      instanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
    };

    init();

    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores cuando cambian los riders
  useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;

    let L: any;
    import("leaflet").then((mod) => {
      L = mod.default;

      // Limpiar marcadores anteriores
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      riders.forEach((r) => {
        if (!r.lat || !r.lng) return;
        const cfg = statusConfig[r.status] ?? statusConfig.unknown;
        const color = r.status === "available" ? "#22c55e" : r.status === "busy" || r.status === "en_pedido" ? "#3b82f6" : "#9ca3af";

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width:36px; height:36px; border-radius:50%;
              background:${color}; border:3px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex; align-items:center; justify-content:center;
              font-size:16px; color:white; font-weight:700;
            ">${(r.nombres?.[0] ?? "R").toUpperCase()}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([r.lat, r.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px; font-family:sans-serif;">
              <p style="font-weight:700; margin:0 0 4px">${r.nombres} ${r.apellidos}</p>
              <p style="margin:0; font-size:12px; color:#666">${r.telefono}</p>
              <p style="margin:4px 0 0; font-size:11px; color:#999">
                ${cfg.label} · ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}
              </p>
            </div>
          `);

        markersRef.current.push(marker);
      });

      // Auto-centrar si hay riders
      if (riders.length > 0 && riders[0].lat) {
        map.setView([riders[0].lat, riders[0].lng], 13);
      }
    });
  }, [riders]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", minHeight: 400 }} />;
}

export default function RidersMapaPage() {
  const [riders, setRiders] = useState<RiderActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchRiders = async () => {
    try {
      const res = await api.get<{ status: string; data: RiderActivo[] }>("/admin/riders/activos");
      setRiders(res.data ?? []);
      setLastUpdate(new Date());
    } catch {
      // silencioso — no interrumpir UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchRiders();
    const interval = setInterval(fetchRiders, 30_000);
    return () => clearInterval(interval);
  }, []);

  const disponibles = riders.filter((r) => r.status === "available").length;
  const enPedido    = riders.filter((r) => ["busy", "en_pedido"].includes(r.status)).length;

  return (
    <>
      <Header title="Riders en línea" />
      <main className="flex-1 overflow-hidden flex flex-col p-6 gap-4">

        {/* KPIs */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="text-xs text-gray-400">Disponibles</p>
              <p className="text-xl font-bold text-gray-900">{disponibles}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <div>
              <p className="text-xs text-gray-400">En pedido</p>
              <p className="text-xl font-bold text-gray-900">{enPedido}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Total activos</p>
              <p className="text-xl font-bold text-gray-900">{riders.length}</p>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-400 ml-auto">
              Actualizado: {lastUpdate.toLocaleTimeString("es-SV")} · refresca cada 30s
            </p>
          )}
          <button
            onClick={fetchRiders}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ↺ Actualizar
          </button>
        </div>

        {/* Contenido principal: mapa + lista */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Mapa */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !mounted ? null : riders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <p className="text-sm">No hay riders activos en este momento</p>
              </div>
            ) : (
              <MapaRiders riders={riders} />
            )}
          </div>

          {/* Lista lateral */}
          <div className="w-72 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">{riders.length} rider{riders.length !== 1 ? "s" : ""} activo{riders.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {riders.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Sin riders activos</p>
              ) : (
                riders.map((r) => (
                  <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-2.5">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {r.nombres?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/riders/${r.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                        >
                          {r.nombres} {r.apellidos}
                        </Link>
                        <p className="text-xs text-gray-400 truncate">{r.telefono}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={r.status} />
                      {r.lat && r.lng ? (
                        <span className="text-xs text-gray-300 font-mono">
                          {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">Sin ubicación</span>
                      )}
                    </div>
                    {r.updated_at && (
                      <p className="text-xs text-gray-300 mt-1">
                        Última pos: {new Date(r.updated_at).toLocaleTimeString("es-SV")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
