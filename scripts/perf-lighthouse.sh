#!/usr/bin/env bash
# Production-сборка, краткий замер Lighthouse (Performance) для главной.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Свободен ли TCP-порт (LISTEN)
port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN -P -n >/dev/null 2>&1
}

# 3050–3099: не конфликтуем с dev :3000; при занятости — следующий свободный
if [ -n "${LIGHTHOUSE_PORT:-}" ]; then
  PORT="$LIGHTHOUSE_PORT"
  if port_in_use "$PORT"; then
    echo "Порт $PORT занят. Освободите его или не задавайте LIGHTHOUSE_PORT — скрипт выберет сам." >&2
    exit 1
  fi
else
  PORT=""
  for p in $(seq 3050 3099); do
    if ! port_in_use "$p"; then
      PORT=$p
      break
    fi
  done
  if [ -z "${PORT:-}" ]; then
    echo "Не найден свободный порт в диапазоне 3050–3099." >&2
    exit 1
  fi
fi

URL="${LIGHTHOUSE_URL:-http://127.0.0.1:${PORT}}"
echo "Lighthouse: сервер на $URL (порт $PORT)" >&2

npm run build

npm run start -- -p "$PORT" &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 90); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 90 ]; then
    echo "Сервер не поднялся за 90 с" >&2
    exit 1
  fi
done

mkdir -p .lighthouse
OUT_JSON=".lighthouse/home-$(date +%Y%m%d-%H%M%S).json"
export OUT_JSON
npx --yes lighthouse@11 "$URL" \
  --only-categories=performance \
  --output=json \
  --output-path="$OUT_JSON" \
  --quiet \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

node -e "
const fs = require('fs');
const path = process.env.OUT_JSON;
const r = JSON.parse(fs.readFileSync(path, 'utf8'));
const perf = r.categories.performance;
const a = r.audits;
const row = (id) => (a[id] && a[id].displayValue) || '—';
console.log('\\n=== Lighthouse (Performance) ===');
console.log('Score:', perf && perf.score != null ? Math.round(perf.score * 100) + '/100' : '—');
console.log('First Contentful Paint:', row('first-contentful-paint'));
console.log('Largest Contentful Paint:', row('largest-contentful-paint'));
console.log('Total Blocking Time:', row('total-blocking-time'));
console.log('Cumulative Layout Shift:', row('cumulative-layout-shift'));
console.log('Speed Index:', row('speed-index'));
console.log('Time to Interactive:', row('interactive'));
console.log('\\nJSON:', path);
"
