#!/usr/bin/env bash
# Amni-Life self-host installer (Linux / macOS)
# Usage: curl -fsSL https://amni-scient.com/amni-life/install.sh | bash
# Or:    curl -fsSL https://amni-scient.com/amni-life/install.sh | bash -s -- --dir /custom/path
set -e
VERSION="0.27.0"
BASE="https://amni-scient.com/amni-life"
ZIP="Amni-Life-v$VERSION.zip"
DIR="$HOME/amni-life"
PORT=8765
NO_OPEN=0
NO_SERVE=0
while [ $# -gt 0 ]; do
    case "$1" in
        --dir) DIR="$2"; shift 2 ;;
        --port) PORT="$2"; shift 2 ;;
        --no-open) NO_OPEN=1; shift ;;
        --no-serve) NO_SERVE=1; shift ;;
        --version) echo "$VERSION"; exit 0 ;;
        *) echo "[amni-life] unknown arg: $1"; exit 1 ;;
    esac
done
echo "[amni-life] installing v$VERSION to $DIR"
mkdir -p "$DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "[amni-life] downloading $ZIP…"
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$BASE/$ZIP" -o "$TMP/$ZIP"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TMP/$ZIP" "$BASE/$ZIP"
else
    echo "[amni-life] need curl or wget"; exit 1
fi
echo "[amni-life] extracting…"
if command -v unzip >/dev/null 2>&1; then
    unzip -q -o "$TMP/$ZIP" -d "$TMP/extract"
    cp -R "$TMP/extract/Amni-Life-v$VERSION/." "$DIR/"
elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$TMP/$ZIP" "$TMP/extract"
    cp -R "$TMP/extract/Amni-Life-v$VERSION/." "$DIR/"
else
    echo "[amni-life] need unzip or python3"; exit 1
fi
echo "[amni-life] installed to $DIR"
echo "[amni-life]   index.html · $(ls -1 "$DIR"/*.html 2>/dev/null | wc -l) html · $(ls -1 "$DIR"/pkg 2>/dev/null | wc -l) pkg files"
if [ "$NO_SERVE" = "1" ]; then
    echo "[amni-life] skipping server (--no-serve)"
    echo "[amni-life] run later:    cd $DIR && python3 server.py $PORT"
    exit 0
fi
if ! command -v python3 >/dev/null 2>&1; then
    echo "[amni-life] python3 not found — open $DIR/index.html directly in your browser"
    exit 0
fi
URL="http://127.0.0.1:$PORT/"
echo "[amni-life] starting server at $URL …"
( cd "$DIR" && python3 server.py "$PORT" >/dev/null 2>&1 & )
sleep 1
if [ "$NO_OPEN" = "0" ]; then
    if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 || true
    fi
fi
echo "[amni-life] running at $URL"
echo "[amni-life]   stop server:   pkill -f 'server\.py $PORT'"
