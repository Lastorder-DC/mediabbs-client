#!/bin/sh
# Generates config.js from environment variables when the container starts
# (run by the nginx image's /docker-entrypoint.d mechanism):
#   BACKEND_HOST   backend URL
#   SKIN           default skin (liberty, simple)
#   SKINS          skins users may choose from, comma-separated (default: all)
#   PRIMARY_COLOR  theme color, e.g. #2e7d32
#   MENUS          navigation menus per skin, JSON (inserted verbatim), e.g.
#                  {"simple":[{"type":"boards"},{"type":"wiki"}]}
set -euf  # -f: no filename expansion of values (e.g. "*" in SKINS)
target=/usr/share/nginx/html/config.js

# (printf, not echo: some shells' echo interprets backslashes.)
# JSON/JS string literal: control characters (newlines...) dropped, backslashes
# and double quotes escaped.
str() { printf '"%s"' "$(printf '%s' "$1" | tr -d '\000-\037' | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

if [ -z "${BACKEND_HOST:-}${SKIN:-}${SKINS:-}${PRIMARY_COLOR:-}${MENUS:-}" ]; then
    echo "mediabbs-client: no runtime settings given; using config.js from the image"
    exit 0
fi

{
    printf '%s\n' "window.MEDIABBS_CONFIG = {"
    [ -n "${BACKEND_HOST:-}" ] && printf '%s\n' "  backendHost: $(str "$BACKEND_HOST"),"
    [ -n "${SKIN:-}" ] && printf '%s\n' "  skin: $(str "$SKIN"),"
    if [ -n "${SKINS:-}" ]; then
        list=""
        for s in $(printf '%s' "$SKINS" | tr ',' ' '); do
            list="${list:+$list, }$(str "$s")"
        done
        printf '%s\n' "  skins: [$list],"
    fi
    [ -n "${PRIMARY_COLOR:-}" ] && printf '%s\n' "  primaryColor: $(str "$PRIMARY_COLOR"),"
    [ -n "${MENUS:-}" ] && printf '%s\n' "  menus: $MENUS,"
    printf '%s\n' "};"
} > "$target"
echo "mediabbs-client: wrote config.js:"
cat "$target"
