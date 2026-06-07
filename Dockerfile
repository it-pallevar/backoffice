FROM node:20-alpine AS build-env
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=https://api.pallevar.app/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build-env /app/build/client /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
