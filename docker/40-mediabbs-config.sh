#!/bin/sh
# Generates config.js from environment variables when the container starts
# (run by the nginx image's /docker-entrypoint.d mechanism):
#   BACKEND_HOST   backend URL
#   SKIN           default skin (liberty, simple)
#   SKINS          skins users may choose from, comma-separated (default: all)
#   PRIMARY_COLOR  theme color, e.g. #2e7d32
set -eu
target=/usr/share/nginx/html/config.js

# JSON/JS string literal (escapes backslashes and double quotes).
str() { printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

if [ -z "${BACKEND_HOST:-}${SKIN:-}${SKINS:-}${PRIMARY_COLOR:-}" ]; then
    echo "mediabbs-client: no runtime settings given; using config.js from the image"
    exit 0
fi

{
    echo "window.MEDIABBS_CONFIG = {"
    [ -n "${BACKEND_HOST:-}" ] && echo "  backendHost: $(str "$BACKEND_HOST"),"
    [ -n "${SKIN:-}" ] && echo "  skin: $(str "$SKIN"),"
    if [ -n "${SKINS:-}" ]; then
        list=""
        for s in $(printf '%s' "$SKINS" | tr ',' ' '); do
            list="${list:+$list, }$(str "$s")"
        done
        echo "  skins: [$list],"
    fi
    [ -n "${PRIMARY_COLOR:-}" ] && echo "  primaryColor: $(str "$PRIMARY_COLOR"),"
    echo "};"
} > "$target"
echo "mediabbs-client: wrote config.js:"
cat "$target"
