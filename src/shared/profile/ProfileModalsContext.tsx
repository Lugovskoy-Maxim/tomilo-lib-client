"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Button } from "@/shared/ui/button";
import Modal from "@/shared/modal/modal";
import { useScheduleDeletionMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

const SUPPORT_EMAIL = "support@tomilo-lib.ru";

type ProfileModalsContextValue = {
  openDeleteConfirm: () => void;
};

const ProfileModalsContext = createContext<ProfileModalsContextValue | null>(null);

export function ProfileModalsProvider({ children }: { children: ReactNode }) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleDeletion, { isLoading: isScheduling }] = useScheduleDeletionMutation();
  const toast = useToast();

  const openDeleteConfirm = useCallback(() => setDeleteConfirmOpen(true), []);
  const closeDeleteConfirm = useCallback(() => {
    if (!isScheduling) setDeleteConfirmOpen(false);
  }, [isScheduling]);

  const handleScheduleDeletion = useCallback(async () => {
    try {
      await scheduleDeletion().unwrap();
      toast.success(
        "Удаление профиля запланировано. До указанной даты вы можете отменить его в настройках."
      );
      setDeleteConfirmOpen(false);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ??
        "Не удалось запланировать удаление";
      toast.error(msg);
    }
  }, [scheduleDeletion, toast]);

  const value: ProfileModalsContextValue = { openDeleteConfirm };

  return (
    <ProfileModalsContext.Provider value={value}>
      {children}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Удалить профиль?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Будет запланировано удаление вашего аккаунта через 7 дней. До
            наступления этой даты вы сможете отменить удаление в настройках
            профиля.
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            После удаления войти в аккаунт будет невозможно. Данные сохраняются
            в соответствии с политикой сервиса. Полное удаление данных — по
            запросу на{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--primary)] hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteConfirm}
              disabled={isScheduling}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleScheduleDeletion}
              disabled={isScheduling}
            >
              {isScheduling ? "Сохранение..." : "Запланировать удаление"}
            </Button>
          </div>
        </div>
      </Modal>
    </ProfileModalsContext.Provider>
  );
}

export function useProfileModals(): ProfileModalsContextValue {
  const ctx = useContext(ProfileModalsContext);
  if (!ctx) {
    throw new Error("useProfileModals must be used within ProfileModalsProvider");
  }
  return ctx;
}

/** Для использования в профиле; вне провайдера возвращает null (модал не откроется). */
export function useProfileModalsOptional(): ProfileModalsContextValue | null {
  return useContext(ProfileModalsContext);
}
