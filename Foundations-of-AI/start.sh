#!/usr/bin/env bash
# AlgoDojo: start the local tutor model (Ollama) and the app, then open the browser.
# Everything runs on this Mac; no internet needed once the model is downloaded.
cd "$(dirname "$0")"
PORT=${PORT:-8765}

if [ ! -f web/dist/index.html ]; then
  echo "Building the web app (first run)…"
  (cd web && npm install --no-audit --no-fund && npm run build) || exit 1
fi

if ! curl -s -m 2 http://127.0.0.1:11434/api/version >/dev/null; then
  echo "Starting Ollama…"
  open -ga Ollama 2>/dev/null || (ollama serve >/dev/null 2>&1 &)
fi

if curl -s -m 2 "http://127.0.0.1:$PORT/api/catalog" >/dev/null; then
  echo "AlgoDojo is already running."
  open "http://127.0.0.1:$PORT"
  exit 0
fi

python3 server.py "$PORT" &
SERVER=$!
cleanup() {
  kill $SERVER 2>/dev/null
  # Free the model's memory now instead of waiting for Ollama's keep-alive timer.
  ollama ps 2>/dev/null | awk 'NR>1 {print $1}' | xargs -n1 ollama stop 2>/dev/null
}
trap cleanup EXIT INT TERM
sleep 1
open "http://127.0.0.1:$PORT"
wait $SERVER
