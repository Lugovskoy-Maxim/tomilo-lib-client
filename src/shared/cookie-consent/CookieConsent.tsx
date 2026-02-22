"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie-consent-accepted";

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="animate-fade-in-up bg-[var(--card)] border-2 border-[#0088cc]/30 rounded-xl p-4 shadow-2xl relative overflow-hidden"
      role="dialog"
      aria-label="Уведомление об использовании cookie"
    >
      {/* Декоративный градиент в стиле Telegram */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0088cc]/10 via-transparent to-[#00a8e6]/10 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0088cc] to-[#00a8e6] shadow-lg shadow-[#0088cc]/30">
            <Cookie className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
              Cookie и локальное хранилище
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Мы используем их для авторизации, настроек и аналитики. Подробнее в{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-[#0088cc] hover:text-[#00a8e6] underline underline-offset-2 hover:no-underline"
              >
                политике конфиденциальности
              </Link>
              .
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          className="w-full sm:w-auto shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[#0088cc] to-[#00a8e6] text-white hover:from-[#0099dd] hover:to-[#00b9f7] transition-all duration-200 shadow-lg shadow-[#0088cc]/25 hover:shadow-[#0088cc]/40 hover:-translate-y-0.5"
        >
          Принять
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
