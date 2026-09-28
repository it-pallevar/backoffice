import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Header } from "~/components/Header";
import { api } from "~/services/api";
import {
  categoriaLabel,
  estadoConfig,
  ESTADOS,
  BadgeEstado,
  BadgeRol,
} from "~/lib/reportes";

export function meta() {
  return [{ title: "Detalle de reporte — Pallevar Admin" }];
}

interface ReporteDetalle {
  id: string;
  pedido_id: string | null;
  autor: { id: string; nombre: string; rol: string };
  categoria: string;
  descripcion: string;
  foto_url: string | null;
  estado: string;
  respuesta_admin: string | null;
  created_at: string;
  resuelto_por: string | null;
  resuelto_at: string | null;
  pedido_total: number | null;
  pedido_estado: string | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span className="text-gray-800 text-sm text-right">{value}</span>
    </div>
  );
}

export default function ReporteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [reporte, setReporte] = useState<ReporteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estado, setEstado] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ success: boolean; data: ReporteDetalle }>(`/admin/reportes/${id}`)
      .then((res) => {
        setReporte(res.data);
        setEstado(res.data.estado);
        setRespuesta(res.data.respuesta_admin ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!reporte) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await api.patch<{ success: boolean; data: ReporteDetalle }>(
        `/admin/reportes/${reporte.id}`,
        { estado, respuesta_admin: respuesta }
      );
      setReporte(res.data);
      setEstado(res.data.estado);
      setRespuesta(res.data.respuesta_admin ?? "");
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle de reporte" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !reporte) {
    return (
      <>
        <Header title="Detalle de reporte" />
        <div className="p-6 text-red-500">{error ?? "No encontrado"}</div>
      </>
    );
  }

  const dirty = estado !== reporte.estado || respuesta !== (reporte.respuesta_admin ?? "");

  return (
    <>
      <Header title={`Reporte #${reporte.id.slice(0, 8)}`} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/reportes" className="hover:text-indigo-600">Reportes</Link>
          <span>/</span>
          <span className="text-gray-700 font-mono text-xs">{reporte.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Descripción */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Categoría</p>
                  <p className="font-semibold text-gray-900 text-sm">{categoriaLabel(reporte.categoria)}</p>
                </div>
                <BadgeEstado estado={reporte.estado} />
              </div>
              <p className="text-xs text-gray-400 mb-1">Descripción</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {reporte.descripcion || <span className="text-gray-300">Sin descripción</span>}
              </p>
            </div>

            {/* Foto */}
            {reporte.foto_url && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Foto adjunta</h3>
                <a href={reporte.foto_url} target="_blank" rel="noreferrer">
                  <img
                    src={reporte.foto_url}
                    alt="Foto del reporte"
                    className="max-h-96 rounded-lg border border-gray-100 object-contain"
                  />
                </a>
              </div>
            )}

            {/* Gestión: estado + respuesta */}
            <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Gestionar reporte</h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  disabled={saving}
                  className="w-full sm:w-56 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{estadoConfig[e]?.label ?? e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Respuesta del admin</label>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  disabled={saving}
                  rows={4}
                  maxLength={2000}
                  placeholder="Escribe una respuesta para el reporte..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !dirty}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-40"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                {saved && !dirty && <span className="text-green-600 text-sm">Guardado</span>}
                {saveError && <span className="text-red-500 text-sm">{saveError}</span>}
              </div>
            </form>
          </div>

          {/* Columna lateral */}
          <div className="space-y-5">
            {/* Autor */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Autor</h3>
              {reporte.autor?.id ? (
                <Link to={`/users/${reporte.autor.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                  {reporte.autor.nombre || "—"}
                </Link>
              ) : (
                <p className="text-gray-700 text-sm">{reporte.autor?.nombre || "—"}</p>
              )}
              <div className="mt-1.5"><BadgeRol rol={reporte.autor?.rol} /></div>
            </div>

            {/* Pedido */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Pedido</h3>
              {reporte.pedido_id ? (
                <>
                  <Link to={`/pedidos/${reporte.pedido_id}`} className="text-indigo-600 hover:underline font-mono text-xs">
                    {reporte.pedido_id}
                  </Link>
                  <div className="mt-3">
                    <InfoRow
                      label="Estado"
                      value={reporte.pedido_estado ?? "—"}
                    />
                    <InfoRow
                      label="Total"
                      value={reporte.pedido_total != null ? `$${Number(reporte.pedido_total).toFixed(2)}` : "—"}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sin pedido asociado</p>
              )}
            </div>

            {/* Seguimiento */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Seguimiento</h3>
              <InfoRow label="Creado" value={new Date(reporte.created_at).toLocaleString("es-SV")} />
              <InfoRow
                label="Resuelto por"
                value={reporte.resuelto_por ?? <span className="text-gray-300">—</span>}
              />
              <InfoRow
                label="Resuelto el"
                value={reporte.resuelto_at ? new Date(reporte.resuelto_at).toLocaleString("es-SV") : <span className="text-gray-300">—</span>}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
