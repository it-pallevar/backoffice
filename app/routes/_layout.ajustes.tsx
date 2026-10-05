import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Ajustes — Pallevar Admin" }];
}

interface AjustePedidos {
  pedidos_habilitados: boolean;
  mensaje: string | null;
  actualizado_en: string | null;
}

const MENSAJE_SUGERIDO = "Por ahora no estamos recibiendo pedidos. Intenta de nuevo más tarde.";

export default function AjustesPage() {
  const [guardado, setGuardado] = useState<AjustePedidos | null>(null);
  const [habilitado, setHabilitado] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: AjustePedidos }>("/admin/ajustes/pedidos")
      .then((res) => {
        setGuardado(res.data);
        setHabilitado(res.data.pedidos_habilitados);
        setMensaje(res.data.mensaje ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los ajustes"))
      .finally(() => setCargando(false));
  }, []);

  const hayCambios =
    guardado !== null &&
    (habilitado !== guardado.pedidos_habilitados || mensaje.trim() !== (guardado.mensaje ?? "").trim());

  async function aplicar() {
    if (!habilitado && guardado?.pedidos_habilitados) {
      const ok = window.confirm(
        "Vas a DESACTIVAR los pedidos. Los clientes que estén en el checkout verán el botón de pagar deshabilitado de inmediato y no se podrán crear pedidos nuevos. ¿Continuar?"
      );
      if (!ok) return;
    }
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      const res = await api.put<{ message: string; data: AjustePedidos }>("/admin/ajustes/pedidos", {
        pedidos_habilitados: habilitado,
        mensaje: mensaje.trim() || null,
      });
      setGuardado(res.data);
      setMensaje(res.data.mensaje ?? "");
      setAviso(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  const actualizado = guardado?.actualizado_en
    ? new Date(guardado.actualizado_en).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <>
      <Header title="Ajustes" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Recepción de pedidos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Controla el botón de pagar del checkout en las apps de los clientes. Al apagarlo, el botón se
                  deshabilita en vivo y la API rechaza los pedidos nuevos.
                </p>
              </div>

              {/* Interruptor */}
              <button
                type="button"
                role="switch"
                aria-checked={habilitado}
                aria-label="Recibir pedidos"
                disabled={cargando || guardando}
                onClick={() => setHabilitado((v) => !v)}
                className={`relative shrink-0 w-14 h-8 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
                  habilitado ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    habilitado ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            <div
              className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                habilitado ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${habilitado ? "bg-emerald-500" : "bg-amber-500"}`} />
              {habilitado ? "Pedidos activados: los clientes pueden pagar." : "Pedidos desactivados: los clientes no pueden pagar."}
              {hayCambios && <span className="ml-auto text-xs font-normal opacity-75">Cambios sin aplicar</span>}
            </div>

            <div className="mt-5">
              <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje para los clientes <span className="text-gray-400 font-normal">(se muestra cuando está desactivado)</span>
              </label>
              <textarea
                id="mensaje"
                rows={3}
                maxLength={200}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                disabled={cargando || guardando}
                placeholder={MENSAJE_SUGERIDO}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Si lo dejás vacío se usa el mensaje sugerido.</span>
                <span>{mensaje.length}/200</span>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
            {aviso && <p className="mt-4 text-sm text-emerald-700" role="status">{aviso}</p>}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">{actualizado ? `Última actualización: ${actualizado}` : ""}</p>
              <button
                type="button"
                onClick={aplicar}
                disabled={cargando || guardando || !hayCambios}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-5 py-2"
              >
                {guardando ? "Aplicando…" : "Guardar y aplicar"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
