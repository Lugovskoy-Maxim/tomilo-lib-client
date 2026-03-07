"use client";

import { UserProfile } from "@/types/user";
import { Trash2, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCancelDeletionMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { useProfileModalsOptional } from "@/shared/profile/ProfileModalsContext";

interface ProfileDeleteAccountProps {
  userProfile: UserProfile;
}

const SUPPORT_EMAIL = "support@tomilo-lib.ru";

function formatDeletionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ProfileDeleteAccount({ userProfile }: ProfileDeleteAccountProps) {
  const toast = useToast();
  const modals = useProfileModalsOptional();
  const [cancelDeletion, { isLoading: isCancelling }] = useCancelDeletionMutation();

  const scheduledAt = userProfile.scheduledDeletionAt;
  const isScheduled =
    scheduledAt && new Date(scheduledAt).getTime() > Date.now();
  const isDeleted = Boolean(userProfile.deletedAt);

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion().unwrap();
      toast.success("Запланированное удаление отменено.");
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? "Не удалось отменить удаление";
      toast.error(msg);
    }
  };

  if (isDeleted) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]/60 shrink-0">
            <AlertTriangle className="w-5 h-5 text-[var(--muted-foreground)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Профиль удалён</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Данные учётной записи сохранены, но не используются. Полное удаление данных — по запросу на {SUPPORT_EMAIL}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/5 p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Удаление аккаунта</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Безвозвратно запланировать удаление профиля. До даты удаления можно отменить.
            </p>
          </div>
        </div>

        {isScheduled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-[var(--foreground)]">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Удаление запланировано на {formatDeletionDate(scheduledAt!)}. После этой даты войти в аккаунт будет нельзя.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelDeletion}
              disabled={isCancelling}
              className="border-[var(--border)]"
            >
              {isCancelling ? "Отмена..." : "Отменить удаление"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => modals?.openDeleteConfirm()}
            className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            Удалить профиль
          </Button>
        )}
      </div>
    </>
  );
}
