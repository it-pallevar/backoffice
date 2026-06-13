// Cliente WebSocket (socket.io) del backoffice hacia el pedidos-server.
// Se conecta con el JWT del admin; el servidor lo une a la sala "admins" y le
// empuja alertas en tiempo real (p.ej. pedidos sin rider esperando recolocación).
import { io, type Socket } from "socket.io-client";

// URL del pedidos-server. Se hornea en build (igual que VITE_API_URL).
//   local: http://localhost:4000 · prod: https://ws.pallevar.app
const WS_URL = (import.meta.env.VITE_WS_URL as string) ?? "http://localhost:4000";

let socket: Socket | null = null;

/** Devuelve el socket (lo crea si hace falta). null en SSR o sin token. */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("admin_token");
  if (!token) return null;

  if (!socket) {
    socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    socket.on("connect", () => console.log("🔌 backoffice conectado al pedidos-server"));
    socket.on("connect_error", (e) => console.warn("⚠️ socket error:", e.message));
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
