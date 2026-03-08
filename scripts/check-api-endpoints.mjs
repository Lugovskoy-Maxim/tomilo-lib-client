#!/usr/bin/env node
/**
 * Проверка GET-эндпоинтов API на сервере.
 * Использует NEXT_PUBLIC_API_URL из .env или переменную окружения API_BASE.
 * Запуск: node scripts/check-api-endpoints.mjs
 *        API_BASE=https://tomilo-lib.ru/api node scripts/check-api-endpoints.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv();
const API_BASE = process.env.API_BASE || env.NEXT_PUBLIC_API_URL || "https://tomilo-lib.ru/api";
const base = API_BASE.replace(/\/$/, "");

/** GET-эндпоинты клиента (без path-параметров или с минимальными query). */
const GET_ENDPOINTS = [
  { path: "/titles", name: "Тайтлы (каталог)" },
  { path: "/titles/filters/options", name: "Опции фильтров тайтлов" },
  { path: "/titles/latest-updates?page=1&limit=12", name: "Последние обновления" },
  { path: "/shop/decorations", name: "Украшения магазина (публичный список)" },
  { path: "/shop/admin/decorations", name: "Украшения админки (требует админ)" },
  { path: "/announcements", name: "Новости" },
  { path: "/collections/top?limit=10", name: "Топ коллекций" },
  { path: "/users/leaderboard?limit=10", name: "Лидерборд" },
  { path: "/stats/years", name: "Статистика — годы" },
  { path: "/admin/health", name: "Админ: здоровье" },
  { path: "/comments/reactions/emojis", name: "Эмодзи реакций комментариев" },
  { path: "/chapters/reactions/emojis", name: "Эмодзи реакций глав" },
  { path: "/manga-parser/supported-sites", name: "Парсер: поддерживаемые сайты" },
  { path: "/auto-parsing", name: "Автопарсинг (список)" },
  { path: "/genres/admin", name: "Жанры админ (список)" },
  { path: "/achievements/admin", name: "Достижения админ (список)" },
  { path: "/admin/dashboard", name: "Админ: дашборд" },
  { path: "/admin/system", name: "Админ: система" },
];

async function check(url, name) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    return { status: res.status, ok: res.ok, name };
  } catch (err) {
    return { status: null, ok: false, name, error: err.message };
  }
}

async function main() {
  console.log("Проверка эндпоинтов API");
  console.log("Базовый URL:", base);
  console.log("");

  const results = [];
  for (const { path, name } of GET_ENDPOINTS) {
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
    const r = await check(url, name);
    results.push({ ...r, path, url });
  }

  const ok = results.filter(r => r.ok);
  const notFound = results.filter(r => r.status === 404);
  const authOrOther = results.filter(r => !r.ok && r.status !== 404);

  console.log("Результаты:\n");
  for (const r of results) {
    const status = r.status ?? r.error ?? "—";
    const icon = r.ok ? "✓" : r.status === 404 ? "✗ 404" : "○";
    console.log(`  ${icon} ${String(r.status).padEnd(4)} ${r.name}`);
    console.log(`      ${r.path}`);
  }

  console.log("\n--- Сводка ---");
  console.log("  OK (2xx):     ", ok.length);
  console.log("  404:         ", notFound.length);
  console.log("  Другое (401/403/5xx или ошибка):", authOrOther.length);

  if (notFound.length > 0) {
    console.log("\nЭндпоинты с 404 (возможно не подключены на бэкенде):");
    notFound.forEach(r => console.log("  -", r.path, "(", r.name, ")"));
  }

  if (authOrOther.length > 0) {
    console.log("\nОстальные не-2xx (могут требовать авторизацию или отключены):");
    authOrOther.forEach(r => console.log("  -", r.path, "→", r.status ?? r.error));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
