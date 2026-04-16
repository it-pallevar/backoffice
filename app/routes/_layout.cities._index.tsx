import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Ciudades — Pallevar Admin" }];
}

interface City {
  id: string;
  pais: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  radio_km: number;
  activo: boolean;
}

interface DeliveryConfig {
  id: string;
  city_id: string;
  tarifa_base: number;
  costo_km_base: number;
  activo: boolean;
}

const emptyCity = { pais: "", ciudad: "", latitud: "", longitud: "", radio_km: "" };

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal nueva ciudad
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCity);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Config delivery
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ tarifa_base: "", costo_km_base: "" });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => { fetchCities(); }, []);

  async function fetchCities() {
    setLoading(true);
    try {
      const res = await api.get<{ status: string; data: City[] }>("/admin/cities");
      setCities(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar ciudades");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const res = await api.patch<{ status: string; data: City }>(`/admin/cities/${id}/toggle`);
      setCities((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleCreateCity(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.post<{ status: string; data: City }>("/admin/cities", {
        ...form,
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        radio_km: parseFloat(form.radio_km),
      });
      setCities((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm(emptyCity);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al crear ciudad");
    } finally {
      setSaving(false);
    }
  }

  async function openDeliveryConfig(city: City) {
    setSelectedCity(city);
    setDeliveryConfig(null);
    setLoadingConfig(true);
    try {
      const res = await api.get<{ status: string; data: DeliveryConfig }>(`/admin/delivery-config/city/${city.id}`);
      setDeliveryConfig(res.data);
      setConfigForm({
        tarifa_base: String(res.data.tarifa_base),
        costo_km_base: String(res.data.costo_km_base),
      });
    } catch {
      setConfigForm({ tarifa_base: "", costo_km_base: "" });
    } finally {
      setLoadingConfig(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCity) return;
    setSavingConfig(true);
    try {
      if (deliveryConfig) {
        await api.put(`/admin/delivery-config/${deliveryConfig.id}`, {
          tarifa_base: parseFloat(configForm.tarifa_base),
          costo_km_base: parseFloat(configForm.costo_km_base),
        });
      } else {
        await api.post("/admin/delivery-config", {
          city_id: selectedCity.id,
          tarifa_base: parseFloat(configForm.tarifa_base),
          costo_km_base: parseFloat(configForm.costo_km_base),
        });
      }
      setSelectedCity(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <>
      <Header title="Ciudades y Delivery" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{cities.length} ciudades configuradas</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nueva ciudad
          </button>
        </div>

        {/* Lista de ciudades */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-500 text-sm">{error}</div>
          ) : cities.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Sin ciudades configuradas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Ciudad</th>
                    <th className="px-5 py-3 text-left">País</th>
                    <th className="px-5 py-3 text-center">Radio (km)</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                    <th className="px-5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cities.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{c.ciudad}</td>
                      <td className="px-5 py-3.5 text-gray-500">{c.pais}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{c.radio_km} km</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {c.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openDeliveryConfig(c)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Config. delivery
                          </button>
                          <button
                            onClick={() => handleToggle(c.id)}
                            className={`text-xs font-medium ${c.activo ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}
                          >
                            {c.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal nueva ciudad */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="font-bold text-gray-900 mb-5">Nueva ciudad</h2>
              <form onSubmit={handleCreateCity} className="space-y-4">
                {[
                  { name: "pais", label: "País", placeholder: "El Salvador" },
                  { name: "ciudad", label: "Ciudad", placeholder: "San Salvador" },
                  { name: "latitud", label: "Latitud", placeholder: "13.6929" },
                  { name: "longitud", label: "Longitud", placeholder: "-89.2182" },
                  { name: "radio_km", label: "Radio (km)", placeholder: "10" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <input
                      type="text"
                      required
                      placeholder={f.placeholder}
                      value={form[f.name as keyof typeof form]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60">
                    {saving ? "Guardando..." : "Crear ciudad"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal config delivery */}
        {selectedCity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Config. de delivery</h2>
              <p className="text-gray-400 text-sm mb-5">{selectedCity.ciudad}, {selectedCity.pais}</p>
              {loadingConfig ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tarifa base ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={configForm.tarifa_base}
                      onChange={(e) => setConfigForm((p) => ({ ...p, tarifa_base: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="1.50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Costo por km ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={configForm.costo_km_base}
                      onChange={(e) => setConfigForm((p) => ({ ...p, costo_km_base: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="0.50"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setSelectedCity(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                    <button type="submit" disabled={savingConfig} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60">
                      {savingConfig ? "Guardando..." : deliveryConfig ? "Actualizar" : "Crear config"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
