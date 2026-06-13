# Changelog — PA'LLEVAR Backoffice

## [No publicado] — feature/backoffice-alerta-sin-rider (2026-06-13)

### Agregado
- **Alerta en tiempo real de pedidos sin rider.** El backoffice ahora se conecta
  por WebSocket (socket.io) al pedidos-server y muestra una alerta flotante global
  cuando un pedido queda **sin rider** (esperando recolocación), que se actualiza
  con cada reintento y desaparece al asignarse un rider.
  - `app/services/socket.ts`: cliente socket.io autenticado con el JWT del admin.
  - `app/components/SinRiderAlert.tsx`: alerta flotante; siembra estado inicial
    desde `GET /admin/pedidos?estado=sin_rider` y escucha `pedido.sin_rider` /
    `pedido_rider_asignado` en vivo. Enlaza al detalle y a la lista filtrada.
  - Integrada en el layout (visible en cualquier pantalla).
  - La lista de pedidos respeta `?estado=` de la URL (enlace "Ver todos").
  - Nueva dependencia: `socket.io-client`.
  - `VITE_WS_URL` (URL del pedidos-server) se hornea en build, como `VITE_API_URL`.

### Build / CI
- `Dockerfile`: base `node:20-alpine` → `node:22-alpine`; se copia `package-lock.json`
  e instala con él (instalación determinista). Nuevo build-arg `VITE_WS_URL`.

> Requiere el cambio correspondiente en el pedidos-server (sala `admins` + emisión
> de `pedido.sin_rider` / `pedido_rider_asignado` a esa sala).
