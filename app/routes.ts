import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("routes/_layout.tsx", [
    index("routes/_layout.dashboard.tsx"),
    route("negocios", "routes/_layout.negocios._index.tsx"),
    route("negocios/nuevo", "routes/_layout.negocios.nuevo.tsx"),
    route("negocios/:id", "routes/_layout.negocios.$id.tsx"),
    route("prospectos", "routes/_layout.prospectos._index.tsx"),
    route("pedidos", "routes/_layout.pedidos._index.tsx"),
    route("pedidos/:id", "routes/_layout.pedidos.$id.tsx"),
    route("busquedas", "routes/_layout.busquedas.tsx"),
    route("reportes", "routes/_layout.reportes._index.tsx"),
    route("reportes/:id", "routes/_layout.reportes.$id.tsx"),
    route("riders", "routes/_layout.riders._index.tsx"),
    route("riders/mapa", "routes/_layout.riders.mapa.tsx"),
    route("riders/:id", "routes/_layout.riders.$id.tsx"),
    route("users", "routes/_layout.users._index.tsx"),
    route("users/:id", "routes/_layout.users.$id.tsx"),
    route("cities", "routes/_layout.cities._index.tsx"),
    route("depositos", "routes/_layout.depositos._index.tsx"),
    route("notificaciones", "routes/_layout.notificaciones.tsx"),
  ]),
] satisfies RouteConfig;
