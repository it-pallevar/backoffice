import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Registrar negocio — Pallevar Admin" }];
}

const TIPOS = ["restaurante", "farmacia", "ferreteria", "ropa", "servicios", "otros"];

export default function NuevoNegocioPage() {
  const navigate = useNavigate();
  // Si viene de "Convertir en negocio" (Prospectos), precarga lo que ya se sabe.
  const [searchParams] = useSearchParams();
  const prospectoId = searchParams.get("prospecto");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Negocio
    nombre: searchParams.get("nombre") ?? "",
    telefono: searchParams.get("telefono") ?? "",
    direccion: "",
    tipo_negocio: "restaurante",
    is_activo: true,
    latitud: "",
    longitud: "",
    // Fiscal / financiero
    nit: "",
    nrc: "",
    banco: "",
    cuenta: "",
    titular: "",
    // Dueño
    nombres: "",
    apellidos: "",
    correo: "",
    telefono_admin: "",
    password: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        tipo_negocio: form.tipo_negocio,
        is_activo: form.is_activo,
        nit: form.nit || undefined,
        nrc: form.nrc || undefined,
        banco: form.banco || undefined,
        cuenta: form.cuenta || undefined,
        titular: form.titular || undefined,
        nombres: form.nombres,
        apellidos: form.apellidos,
        correo: form.correo,
        telefono_admin: form.telefono_admin || undefined,
        password: form.password,
      };
      if (form.latitud) payload.latitud = parseFloat(form.latitud);
      if (form.longitud) payload.longitud = parseFloat(form.longitud);

      await api.post("/admin/negocios", payload);
      // Cierra el prospecto de origen; si falla no debe tumbar el registro ya hecho.
      if (prospectoId) {
        await api.put(`/admin/prospectos/${prospectoId}`, { estado: "registrado" }).catch(() => {});
      }
      navigate("/negocios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el negocio");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const label = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <>
      <Header title="Registrar negocio" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <Link to="/negocios" className="text-sm text-indigo-600 hover:underline">
            ← Volver a negocios
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
          {/* Datos del negocio */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Datos del negocio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Nombre *</label>
                <input className={input} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Teléfono *</label>
                <input className={input} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Tipo de negocio</label>
                <select className={input} value={form.tipo_negocio} onChange={(e) => set("tipo_negocio", e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Dirección *</label>
                <input className={input} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Latitud (opcional)</label>
                <input className={input} value={form.latitud} onChange={(e) => set("latitud", e.target.value)} placeholder="13.9942" />
              </div>
              <div>
                <label className={label}>Longitud (opcional)</label>
                <input className={input} value={form.longitud} onChange={(e) => set("longitud", e.target.value)} placeholder="-89.5597" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                <input
                  id="is_activo"
                  type="checkbox"
                  checked={form.is_activo}
                  onChange={(e) => set("is_activo", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                />
                <label htmlFor="is_activo" className="text-sm text-gray-700">Activar el negocio al crearlo</label>
              </div>
            </div>
          </section>

          {/* Datos fiscales / financieros */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Datos fiscales y financieros</h2>
            <p className="text-xs text-gray-400 mb-4">Opcionales — para facturación y pagos al negocio.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>NIT</label>
                <input className={input} value={form.nit} onChange={(e) => set("nit", e.target.value)} />
              </div>
              <div>
                <label className={label}>NRC</label>
                <input className={input} value={form.nrc} onChange={(e) => set("nrc", e.target.value)} />
              </div>
              <div>
                <label className={label}>Banco</label>
                <input className={input} value={form.banco} onChange={(e) => set("banco", e.target.value)} />
              </div>
              <div>
                <label className={label}>N° de cuenta</label>
                <input className={input} value={form.cuenta} onChange={(e) => set("cuenta", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Titular de la cuenta</label>
                <input className={input} value={form.titular} onChange={(e) => set("titular", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Datos del dueño */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Usuario dueño (acceso al panel de restaurante)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Nombres *</label>
                <input className={input} value={form.nombres} onChange={(e) => set("nombres", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Apellidos *</label>
                <input className={input} value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Correo *</label>
                <input type="email" className={input} value={form.correo} onChange={(e) => set("correo", e.target.value)} required />
              </div>
              <div>
                <label className={label}>Teléfono (opcional)</label>
                <input className={input} value={form.telefono_admin} onChange={(e) => set("telefono_admin", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Contraseña * (mín. 6)</label>
                <input type="password" className={input} value={form.password} onChange={(e) => set("password", e.target.value)} minLength={6} required />
              </div>
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2.5"
            >
              {saving ? "Registrando…" : "Registrar negocio"}
            </button>
            <Link to="/negocios" className="text-sm text-gray-500 hover:text-gray-700 px-5 py-2.5">
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
