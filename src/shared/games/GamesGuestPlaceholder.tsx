"use client";

import { LogIn, UserPlus, Sparkles } from "lucide-react";

interface GamesGuestPlaceholderProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function GamesGuestPlaceholder({ onLogin, onRegister }: GamesGuestPlaceholderProps) {
  return (
    <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
      <div className="games-panel max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[color-mix(in_oklch,var(--primary)_14%,var(--card))] border border-[color-mix(in_oklch,var(--primary)_30%,var(--border))] text-[var(--primary)] mb-4">
          <Sparkles className="w-6 h-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] m-0 mb-2">Войдите в аккаунт</h2>
        <p className="games-muted text-sm m-0 mb-5">
          Мини-игры, инвентарь и награды доступны после входа. Регистрация бесплатна.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" onClick={onLogin} className="games-btn games-btn-primary justify-center gap-2">
            <LogIn className="w-4 h-4" aria-hidden />
            Войти
          </button>
          <button type="button" onClick={onRegister} className="games-btn games-btn-secondary justify-center gap-2">
            <UserPlus className="w-4 h-4" aria-hidden />
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );
}
