"use client";

import { Eye } from "lucide-react";

interface CommentsSpoilerGateProps {
  onReveal: () => void;
}

export function CommentsSpoilerGate({ onReveal }: CommentsSpoilerGateProps) {
  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--secondary)]/40 p-6 sm:p-8 text-center space-y-3">
      <Eye className="w-8 h-8 mx-auto text-[var(--muted-foreground)] opacity-70" aria-hidden />
      <p className="text-sm text-[var(--foreground)] max-w-sm mx-auto leading-relaxed">
        Комментарии могут содержать спойлеры к сюжету. Текст не загружается, пока вы сами не
        откроете блок.
      </p>
      <button
        type="button"
        onClick={onReveal}
        className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Показать комментарии
      </button>
    </div>
  );
}
