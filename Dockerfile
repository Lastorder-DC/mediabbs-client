# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN node .yarn/releases/yarn-4.9.1.cjs install --immutable
COPY . .
# Optional build-time branding (see .env)
ARG VUE_APP_PRIMARY_COLOR=
ARG VUE_APP_SITE_NAME=
RUN node .yarn/releases/yarn-4.9.1.cjs build

# ---- runtime ----
FROM nginx:1-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-mediabbs-config.sh /docker-entrypoint.d/40-mediabbs-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
# Writable by the entrypoint script, which generates config.js from BACKEND_HOST.
RUN chmod 0666 /usr/share/nginx/html/config.js
EXPOSE 80
