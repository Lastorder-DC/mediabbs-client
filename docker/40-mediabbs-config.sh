#!/bin/sh
# Generates config.js from environment variables when the container starts
# (run by the nginx image's /docker-entrypoint.d mechanism).
set -eu
target=/usr/share/nginx/html/config.js
if [ -n "${BACKEND_HOST:-}" ]; then
    # Escape backslashes and double quotes for the JS string literal.
    escaped=$(printf '%s' "$BACKEND_HOST" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf 'window.MEDIABBS_CONFIG = { backendHost: "%s" };\n' "$escaped" > "$target"
    echo "mediabbs-client: backend host set to $BACKEND_HOST"
else
    echo "mediabbs-client: BACKEND_HOST is not set; using the value from build time"
fi
