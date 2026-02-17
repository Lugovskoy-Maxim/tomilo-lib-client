#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseDotEnv(content) {
  const lines = content.split(/\r?\n/);
  const parsed = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = parseDotEnv(raw);

    for (const [key, value] of Object.entries(data)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }
}

function getEnv(name, required = false, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolveJsonPath(input, pathString) {
  if (!pathString) return input;
  return pathString.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return undefined;
  }, input);
}

function extractRssTag(text, tagName) {
  const match = text.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractRssLink(itemBlock) {
  const linkTag = extractRssTag(itemBlock, "link");
  if (linkTag && !linkTag.startsWith("<")) {
    return linkTag;
  }

  const hrefMatch = itemBlock.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return hrefMatch ? hrefMatch[1] : "";
}

function stripXmlCdata(value) {
  return value.replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1").trim();
}

function normalizeChapter(item, options) {
  const idKey = options.idKey || "id";
  const titleKey = options.titleKey || "title";
  const urlKey = options.urlKey || "url";
  const dateKey = options.dateKey || "publishedAt";

  const id =
    String(
      item[idKey] ??
        item.guid ??
        item.link ??
        item[urlKey] ??
        item[titleKey] ??
        "",
    ).trim();
  const title = String(item[titleKey] ?? item.title ?? "Новая глава").trim();
  const url = String(item[urlKey] ?? item.link ?? "").trim();
  const publishedAtRaw = item[dateKey] ?? item.pubDate ?? item.published ?? item.updated;
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null;

  if (!id || !url) return null;
  return { id, title, url, publishedAt };
}

async function fetchChaptersFromJson(config) {
  const response = await fetch(config.sourceUrl);
  if (!response.ok) {
    throw new Error(`Source request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const maybeItems = resolveJsonPath(payload, config.itemsPath);
  if (!Array.isArray(maybeItems)) {
    throw new Error("JSON source must resolve to an array");
  }

  return maybeItems
    .map((item) => normalizeChapter(item, config))
    .filter(Boolean);
}

async function fetchChaptersFromRss(config) {
  const response = await fetch(config.sourceUrl);
  if (!response.ok) {
    throw new Error(`Source request failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/gi)].map(
    (match) => match[0],
  );

  return blocks
    .map((block) => {
      const title = stripXmlCdata(extractRssTag(block, "title") || "Новая глава");
      const guid = stripXmlCdata(extractRssTag(block, "guid"));
      const link = stripXmlCdata(extractRssLink(block));
      const pubDate = stripXmlCdata(
        extractRssTag(block, "pubDate") || extractRssTag(block, "updated"),
      );

      return normalizeChapter(
        {
          id: guid || link || title,
          title,
          url: link,
          publishedAt: pubDate || null,
        },
        config,
      );
    })
    .filter(Boolean);
}

function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildMessage(chapter) {
  return `📘 <b>Новая глава!</b>\n\n<b>${escapeHtml(chapter.title)}</b>\n${escapeHtml(chapter.url)}`;
}

async function readState(stateFilePath) {
  try {
    const raw = await fs.readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed.sentIds) ? parsed.sentIds : []);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return new Set();
    }
    throw error;
  }
}

async function writeState(stateFilePath, sentIdsSet) {
  await fs.mkdir(path.dirname(stateFilePath), { recursive: true });
  const payload = JSON.stringify({ sentIds: [...sentIdsSet] }, null, 2);
  await fs.writeFile(stateFilePath, payload, "utf8");
}

async function sendTelegramMessage(config, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API failed: ${response.status} ${errorText}`);
  }
}

async function runOnce(config) {
  const state = await readState(config.stateFilePath);
  const chapters =
    config.sourceType === "rss"
      ? await fetchChaptersFromRss(config)
      : await fetchChaptersFromJson(config);

  const sorted = chapters.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return aTime - bTime;
  });

  const fresh = sorted.filter((chapter) => !state.has(chapter.id));

  if (!fresh.length) {
    console.log("No new chapters found.");
    return;
  }

  for (const chapter of fresh) {
    const message = buildMessage(chapter);
    await sendTelegramMessage(config, message);
    state.add(chapter.id);
    await writeState(config.stateFilePath, state);
    console.log(`Sent: ${chapter.title}`);
  }
}

function buildConfig() {
  const sourceType = getEnv("CHAPTER_SOURCE_TYPE", false, "json").toLowerCase();
  if (!["json", "rss"].includes(sourceType)) {
    throw new Error("CHAPTER_SOURCE_TYPE must be either 'json' or 'rss'");
  }

  const stateFile = getEnv(
    "CHAPTER_STATE_FILE",
    false,
    path.join(".cache", "telegram-chapters-sent.json"),
  );

  return {
    telegramToken: getEnv("TELEGRAM_BOT_TOKEN", true),
    telegramChatId: getEnv("TELEGRAM_CHANNEL_ID", true),
    sourceUrl: getEnv("CHAPTER_SOURCE_URL", true),
    sourceType,
    itemsPath: getEnv("CHAPTER_JSON_ITEMS_PATH", false, ""),
    idKey: getEnv("CHAPTER_JSON_ID_KEY", false, "id"),
    titleKey: getEnv("CHAPTER_JSON_TITLE_KEY", false, "title"),
    urlKey: getEnv("CHAPTER_JSON_URL_KEY", false, "url"),
    dateKey: getEnv("CHAPTER_JSON_DATE_KEY", false, "publishedAt"),
    pollIntervalSeconds: Number(getEnv("CHAPTER_POLL_INTERVAL_SECONDS", false, "0")),
    stateFilePath: path.isAbsolute(stateFile)
      ? stateFile
      : path.join(process.cwd(), stateFile),
  };
}

async function main() {
  await loadEnvFile(path.join(process.cwd(), ".env"));
  await loadEnvFile(path.join(process.cwd(), ".env.local"));

  const config = buildConfig();
  await runOnce(config);

  if (Number.isFinite(config.pollIntervalSeconds) && config.pollIntervalSeconds > 0) {
    console.log(`Polling every ${config.pollIntervalSeconds} second(s).`);
    setInterval(() => {
      runOnce(config).catch((error) => {
        console.error("Polling error:", error.message);
      });
    }, config.pollIntervalSeconds * 1000);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
