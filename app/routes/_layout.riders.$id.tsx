import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Detalle de rider — Pallevar Admin" }];
}

interface RiderDetalle {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  avatar_url: string | null;
  created_at: string;
  riderDocumentos: {
    estado: string;
    licencia: string | null;
    dui: string | null;
    antecedentes_penales: string | null;
    constancia_policia: string | null;
  } | null;
  riderWallet: {
    cash_collected_today: number;
    earnings_available: number;
  } | null;
}

const docEstadoConfig: Record<string, { label: string; color: string }> = {
  pendiente:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  aprobado:   { label: "Aprobado",   color: "bg-green-100 text-green-700" },
  rechazado:  { label: "Rechazado",  color: "bg-red-100 text-red-600" },
};

function DocImage({ url, label }: { url: string | null; label: string }) {
  if (!url) return (
    <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-300 text-xs">
      Sin {label}
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={label} className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition" />
      <p className="text-xs text-indigo-600 text-center mt-1 hover:underline">{label}</p>
    </a>
  );
}

export default function RiderDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<RiderDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ status: string; data: RiderDetalle }>(`/admin/riders/${id}`)
      .then((res) => setRider(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEstado(estado: string) {
    if (!rider) return;
    setUpdatingEstado(true);
    try {
      await api.put(`/admin/riders/${rider.id}/estado`, { estado });
      setRider((prev) =>
        prev
          ? {
              ...prev,
              riderDocumentos: prev.riderDocumentos
                ? { ...prev.riderDocumentos, estado }
                : prev.riderDocumentos,
            }
          : prev
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setUpdatingEstado(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle de rider" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !rider) {
    return (
      <>
        <Header title="Detalle de rider" />
        <div className="p-6 text-red-500">{error ?? "No encontrado"}</div>
      </>
    );
  }

  const docEstado = rider.riderDocumentos?.estado;
  const docCfg = docEstado ? (docEstadoConfig[docEstado] ?? { label: docEstado, color: "bg-gray-100 text-gray-600" }) : null;

  return (
    <>
      <Header title={`${rider.nombres} ${rider.apellidos}`} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/riders" className="hover:text-indigo-600">Riders</Link>
          <span>/</span>
          <span className="text-gray-700">{rider.nombres} {rider.apellidos}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col items-center text-center gap-3">
                {rider.avatar_url ? (
                  <img src={rider.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-3xl font-bold">
                    {rider.nombres?.[0]}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{rider.nombres} {rider.apellidos}</h2>
                  <p className="text-gray-400 text-sm">{rider.email}</p>
                  <p className="text-gray-400 text-sm">{rider.telefono}</p>
                  {rider.direccion && <p className="text-gray-400 text-xs mt-1">{rider.direccion}</p>}
                </div>
                {docCfg && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${docCfg.color}`}>
                    {docCfg.label}
                  </span>
                )}
              </div>

              {/* Acciones */}
              {rider.riderDocumentos && (
                <div className="mt-4 flex flex-col gap-2">
                  {docEstado !== "aprobado" && (
                    <button
                      onClick={() => handleEstado("aprobado")}
                      disabled={updatingEstado}
                      className="w-full bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium py-2 rounded-lg transition disabled:opacity-60"
                    >
                      Aprobar rider
                    </button>
                  )}
                  {docEstado !== "rechazado" && (
                    <button
                      onClick={() => handleEstado("rechazado")}
                      disabled={updatingEstado}
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium py-2 rounded-lg transition disabled:opacity-60"
                    >
                      Rechazar rider
                    </button>
                  )}
                  {docEstado !== "pendiente" && (
                    <button
                      onClick={() => handleEstado("pendiente")}
                      disabled={updatingEstado}
                      className="w-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-sm font-medium py-2 rounded-lg transition disabled:opacity-60"
                    >
                      Marcar pendiente
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Wallet */}
            {rider.riderWallet && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Billetera</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Efectivo cobrado hoy</span>
                    <span className="font-semibold text-gray-800">${rider.riderWallet.cash_collected_today?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Ganancias disponibles</span>
                    <span className="font-semibold text-green-700">${rider.riderWallet.earnings_available?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Documentos</h3>
              {!rider.riderDocumentos ? (
                <p className="text-gray-400 text-sm">No ha subido documentos aún</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <DocImage url={rider.riderDocumentos.licencia} label="Licencia" />
                  <DocImage url={rider.riderDocumentos.dui} label="DUI" />
                  <DocImage url={rider.riderDocumentos.antecedentes_penales} label="Antecedentes penales" />
                  <DocImage url={rider.riderDocumentos.constancia_policia} label="Constancia policía" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
