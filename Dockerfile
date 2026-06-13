FROM node:22-alpine AS build-env
WORKDIR /app
# Copiamos también el lockfile para que la instalación sea determinista (antes solo se
# copiaba package.json, así el build re-resolvía dependencias y podía traer versiones
# nuevas no probadas en cada ejecución del CI). Usamos `npm install` (no `npm ci`) para
# tolerar pequeños desfases de plataforma en el lockfile (dev Windows + CI Linux).
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_API_URL=https://api.pallevar.app/api
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_WS_URL=https://ws.pallevar.app
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build-env /app/build/client /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
