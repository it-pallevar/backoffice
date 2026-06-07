import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/services/api";

export function meta() {
  return [{ title: "Notificaciones Push — Pallevar Admin" }];
}

interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  avatar_url: string | null;
}

interface Resultado {
  enviados: number;
  fallidos: number;
  message: string;
}

export default function NotificacionesPage() {
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [loadingC, setLoadingC]       = useState(true);
  const [destino, setDestino]         = useState<"todos" | "uno">("todos");
  const [clienteId, setClienteId]     = useState<string>("");
  const [busqueda, setBusqueda]       = useState("");
  const [titulo, setTitulo]           = useState("");
  const [mensaje, setMensaje]         = useState("");
  const [enviando, setEnviando]       = useState(false);
  const [resultado, setResultado]     = useState<Resultado | null>(null);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Cliente[]; total: number }>("/admin/notificaciones/clientes")
      .then((res) => setClientes(res.data ?? []))
      .catch(() => setClientes([]))
      .finally(() => setLoadingC(false));
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombres.toLowerCase().includes(q) ||
      c.apellidos.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);

  const handleEnviar = async () => {
    if (!titulo.trim() || !mensaje.trim()) {
      setError("El título y el mensaje son obligatorios.");
      return;
    }
    if (destino === "uno" && !clienteId) {
      setError("Seleccioná un cliente.");
      return;
    }

    setError(null);
    setResultado(null);
    setEnviando(true);

    try {
      const body: Record<string, string> = { titulo, mensaje };
      if (destino === "uno") body.user_id = clienteId;

      const res = await api.post<Resultado>("/admin/notificaciones/enviar", body);
      setResultado(res);
      setTitulo("");
      setMensaje("");
      setClienteId("");
      setBusqueda("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Header title="Notificaciones Push" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* KPI */}
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-3 shadow-sm w-fit">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <div>
              <p className="text-xs text-gray-400">Clientes con notificaciones activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingC ? "—" : clientes.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Formulario ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700">Redactar notificación</h2>

              {/* Destinatario */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Destinatario</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDestino("todos"); setClienteId(""); setBusqueda(""); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      destino === "todos"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Todos los clientes
                  </button>
                  <button
                    onClick={() => setDestino("uno")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      destino === "uno"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Cliente específico
                  </button>
                </div>
              </div>

              {/* Buscador de cliente */}
              {destino === "uno" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Buscar cliente</label>
                  <input
                    type="text"
                    placeholder="Nombre, apellido o email..."
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setClienteId(""); }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {busqueda && (
                    <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                      {clientesFiltrados.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3">Sin resultados</p>
                      ) : (
                        clientesFiltrados.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setClienteId(c.id); setBusqueda(`${c.nombres} ${c.apellidos}`); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 transition ${
                              clienteId === c.id ? "bg-indigo-50" : ""
                            }`}
                          >
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                                {c.nombres?.[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{c.nombres} {c.apellidos}</p>
                              <p className="text-xs text-gray-400 truncate">{c.email}</p>
                            </div>
                            {clienteId === c.id && (
                              <span className="ml-auto text-indigo-600 text-xs font-bold shrink-0">✓</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {clienteId && (
                    <p className="mt-1.5 text-xs text-indigo-600 font-medium">
                      ✓ {clienteSeleccionado?.nombres} {clienteSeleccionado?.apellidos} seleccionado
                    </p>
                  )}
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Título <span className="text-gray-300">({titulo.length}/100)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Ej: ¡Oferta especial!"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Mensaje <span className="text-gray-300">({mensaje.length}/500)</span>
                </label>
                <textarea
                  maxLength={500}
                  rows={4}
                  placeholder="Escribí el contenido de la notificación..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-green-700">{resultado.message}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-green-600">✓ {resultado.enviados} enviados</p>
                    {resultado.fallidos > 0 && (
                      <p className="text-xs text-red-500">✗ {resultado.fallidos} fallidos</p>
                    )}
                  </div>
                </div>
              )}

              {/* Botón */}
              <button
                onClick={handleEnviar}
                disabled={enviando || !titulo.trim() || !mensaje.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {destino === "todos"
                      ? `Enviar a ${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`
                      : "Enviar notificación"}
                  </>
                )}
              </button>
            </div>

            {/* ── Preview ── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Vista previa</h2>

              {/* Mockup de notificación Android */}
              <div className="bg-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <p className="text-slate-400 text-xs">Pa'Llevar · ahora</p>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {titulo || <span className="text-slate-500 font-normal italic">Título de la notificación</span>}
                      </p>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed line-clamp-3">
                        {mensaje || <span className="text-slate-500 italic">El mensaje aparecerá aquí...</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-3 text-center">
                  Vista previa · Android
                </p>
              </div>

              {/* Info destinatario */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-3">Resumen del envío</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Destinatarios</span>
                    <span className="font-medium text-gray-800">
                      {destino === "todos"
                        ? `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`
                        : clienteSeleccionado
                          ? `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`
                          : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Caracteres título</span>
                    <span className={`font-medium ${titulo.length > 80 ? "text-orange-500" : "text-gray-800"}`}>
                      {titulo.length} / 100
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Caracteres mensaje</span>
                    <span className={`font-medium ${mensaje.length > 400 ? "text-orange-500" : "text-gray-800"}`}>
                      {mensaje.length} / 500
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
