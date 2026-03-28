#!/usr/bin/env bash
# Production-сборка, краткий замер Lighthouse (Performance) для главной.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# По умолчанию 3050 — чтобы не конфликтовать с dev на :3000
PORT="${LIGHTHOUSE_PORT:-3050}"
URL="${LIGHTHOUSE_URL:-http://127.0.0.1:${PORT}}"

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
