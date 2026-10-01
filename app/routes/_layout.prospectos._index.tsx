import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Prospectos — Pallevar Admin" }];
}

const ESTADOS = [
  { k: "nuevo", t: "Por contactar", c: "bg-gray-100 text-gray-700" },
  { k: "contactado", t: "Contactado", c: "bg-sky-100 text-sky-700" },
  { k: "interesado", t: "Interesado", c: "bg-indigo-100 text-indigo-700" },
  { k: "negociando", t: "Negociando", c: "bg-amber-100 text-amber-700" },
  { k: "registrado", t: "Registrado ✓", c: "bg-emerald-100 text-emerald-700" },
  { k: "perdido", t: "Perdido", c: "bg-red-100 text-red-700" },
];
const RESULTADOS = [
  "Contestó — interesado",
  "Contestó — pidió pensarlo",
  "Contestó — no interesado",
  "No contestó",
  "Número equivocado",
  "Pidió que llamemos después",
];
const FUENTES = ["Visita en persona", "Instagram", "Referido", "Google Maps", "Otro"];
// Sugerencias; el campo acepta cualquier zona nueva.
const ZONAS = ["Centro", "Colonia Santa Lucía", "Final 25 Av. Sur", "Metrocentro", "Carretera a Metapán"];

interface Llamada {
  id: number;
  resultado: string;
  nota: string | null;
  created_at: string;
}
interface Prospecto {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string;
  zona: string | null;
  tipo_comida: string | null;
  fuente: string | null;
  responsable: string | null;
  estado: string;
  proxima_llamada: string | null;
  notas: string | null;
  ultima_llamada?: Llamada | null;
  llamadas?: Llamada[];
}
interface Resumen {
  activos: number;
  pendientes: number;
  en_proceso: number;
  registrados: number;
  conversion: number;
}

// Fecha local (El Salvador no usa horario de verano; el navegador del equipo está en SV)
const isoHoy = () => new Date().toLocaleDateString("en-CA");
const sumarDias = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
};
const fmtDia = (iso: string | null) =>
  iso
    ? new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("es-SV", { day: "2-digit", month: "short" })
    : "—";
const estado = (k: string) => ESTADOS.find((e) => e.k === k) ?? ESTADOS[0];
const pendiente = (p: Prospecto) =>
  !!p.proxima_llamada && p.proxima_llamada <= isoHoy() && !["registrado", "perdido"].includes(p.estado);

function Badge({ k }: { k: string }) {
  const e = estado(k);
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${e.c}`}>{e.t}</span>;
}

function Proxima({ p }: { p: Prospecto }) {
  if (!p.proxima_llamada) return <>—</>;
  return (
    <span className={pendiente(p) ? "text-red-600 font-semibold" : ""}>
      {p.proxima_llamada === isoHoy() ? "Hoy" : fmtDia(p.proxima_llamada)}
    </span>
  );
}

const inputCls =
  "w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

export default function ProspectosPage() {
  const navigate = useNavigate();
  const [lista, setLista] = useState<Prospecto[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<"lista" | "tablero">("lista");

  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fZona, setFZona] = useState("");
  const [fResp, setFResp] = useState("");
  const [soloPend, setSoloPend] = useState(false);

  const [abierto, setAbierto] = useState<Prospecto | null>(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (fEstado) params.set("estado", fEstado);
    if (fZona) params.set("zona", fZona);
    if (fResp) params.set("responsable", fResp);
    if (soloPend) params.set("pendientes", "1");
    try {
      const res = await api.get<{ data: Prospecto[]; resumen: Resumen }>(`/admin/prospectos?${params}`);
      setLista(res.data);
      setResumen(res.resumen);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar prospectos");
    } finally {
      setLoading(false);
    }
  }, [q, fEstado, fZona, fResp, soloPend]);

  // Búsqueda con pequeña espera para no pedir en cada tecla
  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  async function abrir(id: number) {
    try {
      const res = await api.get<{ data: Prospecto }>(`/admin/prospectos/${id}`);
      setAbierto(res.data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo abrir el prospecto");
    }
  }

  const hoy = lista.filter(pendiente);
  const zonasUsadas = Array.from(new Set([...ZONAS, ...lista.map((p) => p.zona).filter(Boolean)] as string[]));
  const respsUsados = Array.from(new Set(lista.map((p) => p.responsable).filter(Boolean) as string[]));

  return (
    <>
      <Header title="Prospectos" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5 text-gray-900">
        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ["Prospectos activos", resumen.activos, "text-gray-900"],
              ["Llamadas pendientes", resumen.pendientes, "text-red-600"],
              ["Interesados / negociando", resumen.en_proceso, "text-indigo-600"],
              ["Registrados", resumen.registrados, "text-emerald-600"],
              ["Conversión", `${resumen.conversion}%`, "text-gray-900"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500">{l}</p>
                <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Para llamar hoy */}
        {hoy.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              📞 Para llamar hoy o atrasados <span className="text-amber-700">({hoy.length})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {hoy.map((p) => (
                <button
                  key={p.id}
                  onClick={() => abrir(p.id)}
                  className="bg-white text-gray-900 border border-amber-200 hover:border-amber-400 rounded-lg px-3 py-1.5 text-sm text-left"
                >
                  <span className="font-medium">{p.nombre}</span>
                  <span className="text-gray-500"> · {p.telefono}</span>
                  {p.proxima_llamada! < isoHoy() && <span className="text-red-600 text-xs font-semibold"> atrasada</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restaurante, contacto, teléfono…" className={inputCls} />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => <option key={e.k} value={e.k}>{e.t}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Zona</label>
            <select value={fZona} onChange={(e) => setFZona(e.target.value)} className={inputCls}>
              <option value="">Todas</option>
              {zonasUsadas.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
            <select value={fResp} onChange={(e) => setFResp(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {respsUsados.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
            <input type="checkbox" checked={soloPend} onChange={(e) => setSoloPend(e.target.checked)} className="rounded" />
            Solo con llamada pendiente
          </label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
            {(["lista", "tablero"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-3 py-2 text-sm font-medium capitalize ${vista === v ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setNuevoAbierto(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            + Nuevo prospecto
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {vista === "lista" ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {["Restaurante", "Contacto", "Estado", "Última llamada", "Próxima llamada", "Resp.", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => abrir(p.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{[p.tipo_comida, p.zona].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{p.contacto || "—"}</p>
                      <p className="text-xs text-gray-500">{p.telefono}</p>
                    </td>
                    <td className="px-4 py-3"><Badge k={p.estado} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.ultima_llamada ? (
                        <>
                          <p>{fmtDia(p.ultima_llamada.created_at)}</p>
                          <p className="text-xs text-gray-400 truncate max-w-48">{p.ultima_llamada.resultado}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">Sin llamadas</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Proxima p={p} /></td>
                    <td className="px-4 py-3 text-gray-600">{p.responsable || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={`tel:${p.telefono}`} onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Llamar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && lista.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No hay prospectos con esos filtros.</p>
            )}
            {loading && lista.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Cargando…</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {ESTADOS.map((s) => {
              const items = lista.filter((p) => p.estado === s.k);
              return (
                <div key={s.k} className="bg-gray-100/70 rounded-xl p-2">
                  <p className="text-xs font-semibold text-gray-600 px-2 py-1.5">
                    {s.t} <span className="text-gray-400">{items.length}</span>
                  </p>
                  <div className="space-y-2 max-h-[calc(100vh-330px)] overflow-y-auto">
                    {items.map((p) => (
                      <div key={p.id} onClick={() => abrir(p.id)} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 cursor-pointer hover:border-indigo-300">
                        <p className="text-sm font-medium">{p.nombre}</p>
                        <p className="text-xs text-gray-500">{[p.tipo_comida, p.zona].filter(Boolean).join(" · ")}</p>
                        <p className="text-xs mt-2">
                          📞 <Proxima p={p} /> <span className="text-gray-400">· {p.responsable || "—"}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {abierto && (
        <DetalleDrawer
          prospecto={abierto}
          onClose={() => setAbierto(null)}
          onChange={(p) => { setAbierto(p); cargar(); }}
          onConvertir={(p) => {
            const params = new URLSearchParams({ prospecto: String(p.id), nombre: p.nombre, telefono: p.telefono });
            navigate(`/negocios/nuevo?${params}`);
          }}
        />
      )}
      {nuevoAbierto && (
        <NuevoModal
          zonas={zonasUsadas}
          onClose={() => setNuevoAbierto(false)}
          onCreado={() => { setNuevoAbierto(false); cargar(); }}
        />
      )}
      <datalist id="zonas-sugeridas">{zonasUsadas.map((z) => <option key={z} value={z} />)}</datalist>
    </>
  );
}

function DetalleDrawer({
  prospecto,
  onClose,
  onChange,
  onConvertir,
}: {
  prospecto: Prospecto;
  onClose: () => void;
  onChange: (p: Prospecto) => void;
  onConvertir: (p: Prospecto) => void;
}) {
  const p = prospecto;
  const [resultado, setResultado] = useState(RESULTADOS[0]);
  const [nota, setNota] = useState("");
  const [prox, setProx] = useState(sumarDias(2));
  const [saving, setSaving] = useState(false);

  async function guardarLlamada() {
    setSaving(true);
    try {
      const res = await api.post<{ data: Prospecto }>(`/admin/prospectos/${p.id}/llamadas`, {
        resultado,
        nota: nota.trim() || undefined,
        proxima_llamada: prox || undefined,
      });
      setNota("");
      onChange(res.data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo guardar la llamada");
    } finally {
      setSaving(false);
    }
  }

  async function actualizar(cambios: Partial<Prospecto>) {
    try {
      await api.put(`/admin/prospectos/${p.id}`, cambios);
      const res = await api.get<{ data: Prospecto }>(`/admin/prospectos/${p.id}`);
      onChange(res.data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  }

  const wa = "https://wa.me/503" + p.telefono.replace(/\D/g, "");

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-white text-gray-900 shadow-2xl z-40 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg leading-tight">{p.nombre}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{p.tipo_comida || "Prospecto"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Contacto</p><p className="font-medium">{p.contacto || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Teléfono</p><a href={`tel:${p.telefono}`} className="font-medium text-indigo-600">{p.telefono}</a></div>
            <div><p className="text-xs text-gray-500">Zona</p><p className="font-medium">{p.zona || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Tipo de comida</p><p className="font-medium">{p.tipo_comida || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Fuente</p><p className="font-medium">{p.fuente || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Responsable</p><p className="font-medium">{p.responsable || "—"}</p></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado en el embudo</label>
            <select value={p.estado} onChange={(e) => actualizar({ estado: e.target.value })} className={inputCls}>
              {ESTADOS.map((e) => <option key={e.k} value={e.k}>{e.t}</option>)}
            </select>
          </div>

          <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-900">Registrar llamada</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Resultado</label>
                <select value={resultado} onChange={(e) => setResultado(e.target.value)} className={inputCls + " bg-white"}>
                  {RESULTADOS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Próxima llamada</label>
                <input type="date" value={prox} onChange={(e) => setProx(e.target.value)} className={inputCls + " bg-white"} />
              </div>
            </div>
            <textarea
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="¿Qué se habló? Objeciones, quién decide, comisión que preguntó…"
              className={inputCls + " bg-white"}
            />
            <div className="flex gap-2">
              <button onClick={guardarLlamada} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2">
                {saving ? "Guardando…" : "Guardar llamada"}
              </button>
              <a href={wa} target="_blank" rel="noreferrer" className="border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium rounded-lg px-4 py-2">
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Historial de contacto</p>
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {(p.llamadas ?? []).length === 0 && <li className="ml-4 text-sm text-gray-400">Aún no se ha contactado.</li>}
              {(p.llamadas ?? []).map((h) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                  <p className="text-xs text-gray-400">{fmtDia(h.created_at)} · {h.resultado}</p>
                  <p className="text-sm text-gray-700">{h.nota || <em className="text-gray-400">Sin notas</em>}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => confirm("¿Marcar este prospecto como perdido?") && actualizar({ estado: "perdido" })}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Marcar como perdido
          </button>
          <button onClick={() => onConvertir(p)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            Convertir en negocio →
          </button>
        </div>
      </aside>
    </>
  );
}

function NuevoModal({ zonas, onClose, onCreado }: { zonas: string[]; onClose: () => void; onCreado: () => void }) {
  const [f, setF] = useState({ nombre: "", contacto: "", telefono: "", zona: "", tipo_comida: "", fuente: FUENTES[0], responsable: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function guardar() {
    if (!f.nombre.trim() || !f.telefono.trim()) return setError("Nombre y teléfono son obligatorios");
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(f)) if (v.trim()) body[k] = v.trim();
      await api.post("/admin/prospectos", body);
      onCreado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-lg p-5 space-y-3">
        <h3 className="font-semibold text-base">Nuevo prospecto</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del restaurante *</label>
            <input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contacto</label>
            <input value={f.contacto} onChange={(e) => set("contacto", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono *</label>
            <input value={f.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="7000-0000" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Zona</label>
            <input value={f.zona} onChange={(e) => set("zona", e.target.value)} list="zonas-sugeridas" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de comida</label>
            <input value={f.tipo_comida} onChange={(e) => set("tipo_comida", e.target.value)} placeholder="Pizza, pupusas…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fuente</label>
            <select value={f.fuente} onChange={(e) => set("fuente", e.target.value)} className={inputCls}>
              {FUENTES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
            <input value={f.responsable} onChange={(e) => set("responsable", e.target.value)} placeholder="Elias, Marketing…" className={inputCls} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm text-gray-500 px-4 py-2">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
