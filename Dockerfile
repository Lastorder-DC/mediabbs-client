# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN node .yarn/releases/yarn-4.9.1.cjs install --immutable
COPY . .
# Optional build-time defaults (see .env); runtime settings go in config.js.
ARG VITE_PRIMARY_COLOR=
ARG VITE_SITE_NAME=
ARG VITE_DEFAULT_SKIN=
# Commit hash shown in the version ("0.3.0-1a2b3c4"); there is no .git in the
# image. Leave it out (or empty) for release builds: plain "0.3.0".
#   docker build --build-arg MEDIABBS_GIT_HASH=$(git rev-parse --short=7 HEAD) .
ARG MEDIABBS_GIT_HASH=
RUN node .yarn/releases/yarn-4.9.1.cjs build

# ---- runtime ----
FROM nginx:1-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/mediabbs-security-headers.conf
COPY docker/40-mediabbs-config.sh /docker-entrypoint.d/40-mediabbs-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
# Writable by the entrypoint script, which generates config.js from the environment.
RUN chmod 0666 /usr/share/nginx/html/config.js
EXPOSE 80
