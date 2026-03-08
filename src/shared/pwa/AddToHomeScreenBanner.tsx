"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Smartphone } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY_DISMISSED = "tomilo-a2hs-dismissed";
const STORAGE_KEY_PROMPT_AVAILABLE = "tomilo-a2hs-prompt-available";

export function AddToHomeScreenBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<{ outcome: string }>;
  } | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    const wasDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
    setDismissed(wasDismissed);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as { prompt: () => Promise<{ outcome: string }> };
      setDeferredPrompt({ prompt: () => ev.prompt() });
      try {
        if (localStorage.getItem(STORAGE_KEY_DISMISSED) !== "true") {
          setDismissed(false);
        }
        localStorage.setItem(STORAGE_KEY_PROMPT_AVAILABLE, "true");
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setDismissed(true);
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    } catch {
      // user dismissed or error
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    } catch {
      // ignore
    }
  }, []);

  const show = !isStandalone && !dismissed && Boolean(deferredPrompt);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-[var(--mobile-footer-bar-height)] left-4 right-4 max-w-md mx-auto z-[var(--z-dropdown)] lg:bottom-6 lg:left-auto lg:right-6"
      role="dialog"
      aria-label="Установить приложение"
    >
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
        <div className="p-2 rounded-xl bg-[var(--primary)]/10">
          <Smartphone className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">Установить приложение</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Быстрый доступ с главного экрана
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              Установить
            </button>
            <Link
              href="/about"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              Подробнее
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
