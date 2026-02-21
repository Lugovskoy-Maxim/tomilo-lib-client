"use client";

import Modal from "@/shared/modal/modal";
import type { LinkConflictExistingAccount } from "@/types/auth";
import { LogIn, Link2, Merge, X } from "lucide-react";

export type SocialProvider = "vk" | "yandex";

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  vk: "VK ID",
  yandex: "Яндекс.ID",
};

interface LinkConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: SocialProvider;
  existingAccount: LinkConflictExistingAccount;
  onUseExisting: () => void;
  onLinkHere: () => void;
  onMerge: () => void;
  isLoading?: boolean;
}

export default function LinkConflictModal({
  isOpen,
  onClose,
  provider,
  existingAccount,
  onUseExisting,
  onLinkHere,
  onMerge,
  isLoading = false,
}: LinkConflictModalProps) {
  const label = PROVIDER_LABELS[provider];
  const username = existingAccount?.username ?? "другой пользователь";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${label} уже привязан`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {label} уже привязан к пользователю <strong className="text-[var(--foreground)]">{username}</strong>.
          Что сделать?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onUseExisting}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] text-[var(--foreground)] text-left text-sm font-medium transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 shrink-0 text-[var(--chart-1)]" />
            Войти в тот аккаунт
          </button>
          <button
            type="button"
            onClick={onLinkHere}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] text-[var(--foreground)] text-left text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Link2 className="w-4 h-4 shrink-0 text-[var(--chart-2)]" />
            Привязать к текущему аккаунту
          </button>
          <button
            type="button"
            onClick={onMerge}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] text-[var(--foreground)] text-left text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Merge className="w-4 h-4 shrink-0 text-[var(--chart-3)]" />
            Объединить аккаунты
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Отмена
        </button>
      </div>
    </Modal>
  );
}
