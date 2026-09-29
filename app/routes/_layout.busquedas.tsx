import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { api, getToken, BASE_URL } from "~/services/api";

export function meta() {
  return [{ title: "Búsquedas — Pallevar Admin" }];
}

// ── Tipos de la respuesta de /admin/busquedas/resumen ──────────────────────
// (los SUM() de MySQL llegan como string: se pasan por Number() al mostrar)
type Num = number | string;

interface Resumen {
  desde: string;
  hasta: string;
  kpis: {
    total: number;
    usuarios_unicos: number;
    por_texto: number;
    por_chip: number;
    sin_resultados: number;
    pct_sin_resultados: number;
    terminos_unicos: number;
  };
  por_dia: { fecha: string; total: number; sin_resultados: number }[];
  por_hora: { hora: number; total: number }[];
  por_dia_semana: { dia: string; total: number }[];
  top_terminos: {
    termino: string;
    ejemplo: string;
    total: Num;
    usuarios: Num;
    sin_resultados: Num;
    resultados_prom: Num;
    ultima: string;
  }[];
  top_tipos: {
    id: number;
    nombre: string;
    grupo: string;
    total: Num;
    via_chip: Num;
    via_texto: Num;
    usuarios: Num;
    sin_resultados: Num;
    negocios: number;
  }[];
  sin_resultados: { busqueda: string; origen: string; total: Num; usuarios: Num; ultima: string }[];
  por_ciudad: { ciudad: string; total: Num }[];
  zonas: { lat: Num; lng: Num; total: Num; usuarios: Num; sin_resultados: Num }[];
  por_plataforma: { plataforma: string; total: Num }[];
}

const n = (v: Num | null | undefined) => Number(v ?? 0);

const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });
const haceDias = (dias: number) => {
  const d = new Date(`${hoyISO()}T12:00:00`);
  d.setDate(d.getDate() - (dias - 1));
  return d.toISOString().slice(0, 10);
};

const fechaCorta = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-SV", { day: "numeric", month: "short" });

const fechaHora = (s: string) =>
  new Date(s.replace(" ", "T")).toLocaleString("es-SV", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const PRESETS = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
];

// ── Componentes de presentación ────────────────────────────────────────────

function Kpi({ label, value, sub, tono = "indigo" }: { label: string; value: string | number; sub?: string; tono?: "indigo" | "red" | "green" | "blue" }) {
  const barra = { indigo: "bg-indigo-500", red: "bg-red-500", green: "bg-green-500", blue: "bg-blue-500" }[tono];
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      <span className={`absolute left-0 top-0 h-full w-1 ${barra}`} />
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function Tarjeta({ titulo, ayuda, children, accion }: { titulo: string; ayuda?: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{titulo}</h3>
          {ayuda && <p className="text-xs text-gray-400 mt-0.5">{ayuda}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

function SinDatos() {
  return <p className="text-gray-400 text-sm py-6 text-center">Sin datos en este período</p>;
}

/** Barras verticales simples (con tooltip nativo). `rojo` = porción sin resultados. */
function Barras({
  datos,
  alto = 140,
  etiquetaCada = 1,
}: {
  datos: { etiqueta: string; total: number; rojo?: number; titulo: string }[];
  alto?: number;
  etiquetaCada?: number;
}) {
  const max = Math.max(1, ...datos.map((d) => d.total));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height: alto }}>
        {datos.map((d, i) => {
          const h = (d.total / max) * alto;
          const hRojo = d.total ? ((d.rojo ?? 0) / d.total) * h : 0;
          return (
            <div key={i} className="flex-1 min-w-0 flex flex-col justify-end group" title={d.titulo}>
              <div
                className="w-full rounded-t-[3px] bg-indigo-500 group-hover:bg-indigo-600 flex flex-col justify-start overflow-hidden"
                style={{ height: Math.max(h, d.total ? 2 : 0) }}
              >
                {hRojo > 0 && <div className="w-full bg-red-400" style={{ height: hRojo }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px] mt-1.5 border-t border-gray-100 pt-1.5">
        {datos.map((d, i) => (
          <div key={i} className="flex-1 min-w-0 text-center text-[10px] text-gray-400 truncate">
            {i % etiquetaCada === 0 ? d.etiqueta : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barra horizontal proporcional para columnas de tablas. */
function Proporcion({ valor, max, tono = "bg-indigo-500" }: { valor: number; max: number; tono?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${tono} rounded-full`} style={{ width: `${max ? (valor / max) * 100 : 0}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 tabular-nums w-10 text-right">{valor}</span>
    </div>
  );
}

const th = "text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-4";
const td = "py-2 pr-4 text-sm text-gray-700 border-t border-gray-50";

// ── Página ──────────────────────────────────────────────────────────────────

export default function BusquedasPage() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(hoyISO());
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ success: boolean; data: Resumen }>(`/admin/busquedas/resumen?desde=${desde}&hasta=${hasta}`)
      .then((res) => setDatos(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  const aplicarPreset = (dias: number) => {
    setDesde(haceDias(dias));
    setHasta(hoyISO());
  };
  const presetActivo = PRESETS.find((p) => desde === haceDias(p.dias) && hasta === hoyISO())?.dias;

  // El CSV necesita el token → fetch + blob (un <a href> no manda el header)
  async function exportarCsv() {
    setExportando(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/busquedas/export?desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `busquedas_${desde}_${hasta}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`No se pudo exportar: ${(e as Error).message}`);
    } finally {
      setExportando(false);
    }
  }

  const k = datos?.kpis;
  const maxTipo = Math.max(0, ...(datos?.top_tipos ?? []).map((t) => n(t.total)));
  const maxTermino = Math.max(0, ...(datos?.top_terminos ?? []).map((t) => n(t.total)));
  const maxSinRes = Math.max(0, ...(datos?.sin_resultados ?? []).map((t) => n(t.total)));
  const horaPico = datos?.por_hora.reduce((a, b) => (b.total > a.total ? b : a), { hora: 0, total: 0 });

  return (
    <>
      <Header title="Búsquedas" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.dias}
                onClick={() => aplicarPreset(p.dias)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  presetActivo === p.dias ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => e.target.value && setDesde(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 bg-white"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              max={hoyISO()}
              onChange={(e) => e.target.value && setHasta(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 bg-white"
            />
          </div>
          <button
            onClick={exportarCsv}
            disabled={exportando}
            className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportando ? "Exportando…" : "Exportar CSV (datos crudos)"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
        )}

        {loading && !datos && (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {datos && k && (
          <div className={`space-y-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Kpi label="Búsquedas" value={k.total} sub={`${fechaCorta(datos.desde)} – ${fechaCorta(datos.hasta)}`} />
              <Kpi label="Usuarios que buscaron" value={k.usuarios_unicos} tono="blue" />
              <Kpi
                label="Sin resultados"
                value={`${k.pct_sin_resultados}%`}
                sub={`${k.sin_resultados} búsquedas no encontraron nada`}
                tono="red"
              />
              <Kpi label="Términos distintos" value={k.terminos_unicos} sub="escritos en el buscador" tono="green" />
              <Kpi
                label="Buscador / Chips"
                value={`${k.por_texto} / ${k.por_chip}`}
                sub={k.total ? `${Math.round((k.por_chip * 100) / k.total)}% usa los chips` : undefined}
              />
            </div>

            {/* Tendencia */}
            <Tarjeta
              titulo="Búsquedas por día"
              ayuda="En rojo, la parte que no encontró ningún restaurante."
              accion={
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />Con resultados</span>
                  <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-red-400" />Sin resultados</span>
                </div>
              }
            >
              {k.total === 0 ? (
                <SinDatos />
              ) : (
                <Barras
                  datos={datos.por_dia.map((d) => ({
                    etiqueta: fechaCorta(d.fecha),
                    total: d.total,
                    rojo: d.sin_resultados,
                    titulo: `${fechaCorta(d.fecha)}: ${d.total} búsquedas, ${d.sin_resultados} sin resultados`,
                  }))}
                  etiquetaCada={Math.ceil(datos.por_dia.length / 10)}
                />
              )}
            </Tarjeta>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tarjeta
                  titulo="¿A qué hora buscan?"
                  ayuda={horaPico && horaPico.total ? `Hora pico: ${horaPico.hora}:00 – ${horaPico.hora + 1}:00` : "Hora de El Salvador"}
                >
                  {k.total === 0 ? (
                    <SinDatos />
                  ) : (
                    <Barras
                      alto={110}
                      etiquetaCada={3}
                      datos={datos.por_hora.map((h) => ({
                        etiqueta: `${h.hora}h`,
                        total: h.total,
                        titulo: `${h.hora}:00 – ${h.hora + 1}:00 → ${h.total} búsquedas`,
                      }))}
                    />
                  )}
                </Tarjeta>
              </div>
              <Tarjeta titulo="Por día de la semana">
                {k.total === 0 ? (
                  <SinDatos />
                ) : (
                  <Barras
                    alto={110}
                    datos={datos.por_dia_semana.map((d) => ({
                      etiqueta: d.dia,
                      total: d.total,
                      titulo: `${d.dia}: ${d.total} búsquedas`,
                    }))}
                  />
                )}
              </Tarjeta>
            </div>

            {/* Demanda vs oferta */}
            <Tarjeta
              titulo="Tipos de comida: demanda vs. oferta"
              ayuda="Lo que piden (chips + texto que coincide con un tipo) frente a cuántos negocios activos lo ofrecen. Sin oferta = oportunidad para sumar restaurantes."
            >
              {datos.top_tipos.length === 0 ? (
                <SinDatos />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className={th}>Tipo de comida</th>
                        <th className={th}>Búsquedas</th>
                        <th className={th}>Chip / Texto</th>
                        <th className={th}>Usuarios</th>
                        <th className={th}>Sin resultados</th>
                        <th className={th}>Negocios que lo ofrecen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.top_tipos.map((t) => (
                        <tr key={t.id}>
                          <td className={td}>
                            <p className="font-medium text-gray-900">{t.nombre}</p>
                            <p className="text-xs text-gray-400">{t.grupo}</p>
                          </td>
                          <td className={td}><Proporcion valor={n(t.total)} max={maxTipo} /></td>
                          <td className={`${td} tabular-nums text-gray-500`}>{n(t.via_chip)} / {n(t.via_texto)}</td>
                          <td className={`${td} tabular-nums`}>{n(t.usuarios)}</td>
                          <td className={`${td} tabular-nums`}>
                            {n(t.sin_resultados) > 0 ? <span className="text-red-600 font-medium">{n(t.sin_resultados)}</span> : "0"}
                          </td>
                          <td className={td}>
                            {t.negocios === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Ninguno · oportunidad
                              </span>
                            ) : (
                              <span className="tabular-nums">{t.negocios}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Tarjeta>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Términos */}
              <Tarjeta titulo="Lo más escrito en el buscador" ayuda="Agrupado sin tildes ni mayúsculas.">
                {datos.top_terminos.length === 0 ? (
                  <SinDatos />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className={th}>Término</th>
                          <th className={th}>Búsquedas</th>
                          <th className={th}>Usuarios</th>
                          <th className={th}>Sin resultados</th>
                          <th className={th}>Última</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.top_terminos.map((t) => {
                          const pct = n(t.total) ? Math.round((n(t.sin_resultados) * 100) / n(t.total)) : 0;
                          return (
                            <tr key={t.termino}>
                              <td className={`${td} font-medium text-gray-900`}>{t.ejemplo || t.termino}</td>
                              <td className={td}><Proporcion valor={n(t.total)} max={maxTermino} /></td>
                              <td className={`${td} tabular-nums`}>{n(t.usuarios)}</td>
                              <td className={`${td} tabular-nums ${pct > 0 ? "text-red-600 font-medium" : "text-gray-400"}`}>{pct}%</td>
                              <td className={`${td} text-xs text-gray-400 whitespace-nowrap`}>{fechaHora(t.ultima)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tarjeta>

              {/* Demanda no cubierta */}
              <Tarjeta titulo="Buscan y no encuentran" ayuda="Búsquedas con 0 resultados: qué restaurantes o comidas faltan.">
                {datos.sin_resultados.length === 0 ? (
                  <SinDatos />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className={th}>Búsqueda</th>
                          <th className={th}>Veces</th>
                          <th className={th}>Usuarios</th>
                          <th className={th}>Última</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.sin_resultados.map((s) => (
                          <tr key={`${s.origen}-${s.busqueda}`}>
                            <td className={td}>
                              <span className="font-medium text-gray-900">{s.busqueda}</span>
                              <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">
                                {s.origen === "chip" ? "chip" : "texto"}
                              </span>
                            </td>
                            <td className={td}><Proporcion valor={n(s.total)} max={maxSinRes} tono="bg-red-400" /></td>
                            <td className={`${td} tabular-nums`}>{n(s.usuarios)}</td>
                            <td className={`${td} text-xs text-gray-400 whitespace-nowrap`}>{fechaHora(s.ultima)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tarjeta>
            </div>

            {/* Dónde y desde qué */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Tarjeta titulo="Por ciudad">
                {datos.por_ciudad.length === 0 ? (
                  <SinDatos />
                ) : (
                  <ul className="space-y-2.5">
                    {datos.por_ciudad.map((c) => (
                      <li key={c.ciudad} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-700 truncate">{c.ciudad}</span>
                        <Proporcion valor={n(c.total)} max={n(datos.por_ciudad[0].total)} />
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
              <Tarjeta titulo="Zonas con más búsquedas" ayuda="Cuadrantes de ~1 km. Clic para ver en el mapa.">
                {datos.zonas.length === 0 ? (
                  <SinDatos />
                ) : (
                  <ul className="space-y-2">
                    {datos.zonas.slice(0, 10).map((z) => (
                      <li key={`${z.lat},${z.lng}`} className="flex items-center justify-between gap-3 text-sm">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${z.lat},${z.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline tabular-nums text-xs"
                        >
                          {n(z.lat).toFixed(2)}, {n(z.lng).toFixed(2)}
                        </a>
                        <span className="text-xs text-gray-500 tabular-nums">
                          {n(z.total)} búsq. · {n(z.usuarios)} usu.
                          {n(z.sin_resultados) > 0 && <span className="text-red-600"> · {n(z.sin_resultados)} sin res.</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
              <Tarjeta titulo="Por plataforma">
                {datos.por_plataforma.length === 0 ? (
                  <SinDatos />
                ) : (
                  <ul className="space-y-2.5">
                    {datos.por_plataforma.map((p) => (
                      <li key={p.plataforma} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-700 capitalize">{p.plataforma}</span>
                        <Proporcion valor={n(p.total)} max={Math.max(...datos.por_plataforma.map((x) => n(x.total)))} />
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
