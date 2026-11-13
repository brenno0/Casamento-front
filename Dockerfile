# syntax=docker/dockerfile:1

# ---- build: Vite → dist/ ----
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime: Caddy serve os arquivos na porta 80 (HTTPS fica no proxy do stack) ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
