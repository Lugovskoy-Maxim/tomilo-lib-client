"use client";

import React, { useState, useEffect } from "react";
import Modal from "./modal";
import { UserProfile } from "@/types/user";
import { StoredUser } from "@/types/auth";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const AGE_VERIFICATION_KEY = "age-verified";

export function AgeVerificationModal({ isOpen, onConfirm, onCancel }: AgeVerificationModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isChecked) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      }
      onConfirm();
      window.location.reload();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="⚠️ Внимание: Возрастное ограничение 18+">
      <div className="space-y-4">
        {/* Основной текст с иконкой-предупреждением (опционально) */}
        <div className="flex items-start gap-3">
          {/* Можно добавить иконку, например, <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-500" /> */}
          <div className="space-y-2">
            <p className="text-[var(--primary)] font-medium">
              Содержимое этого раздела предназначено{" "}
              <strong className="text-[var(--chart-5)]">
                исключительно для совершеннолетних пользователей (18 лет и старше)
              </strong>
              .
            </p>
            <p className="text-sm text-[var(--primary)]">
              Данное ограничение установлено в соответствии с законодательством РФ (№436-ФЗ) и
              внутренними правилами платформы для защиты несовершеннолетних.
            </p>
          </div>
        </div>

        {/* Предупреждение о последствиях */}
        {/* <div className="p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--border)]">
      <p className="text-sm text-[var(--primary)]">
        <strong>Важно:</strong> Предоставление заведомо ложной информации о своем возрасте является нарушением правил использования сервиса и может повлечь ограничение доступа к сервису.
      </p>
    </div> */}

        {/* Чекбокс */}
        <div className="flex items-start space-x-2 pt-2">
          <input
            type="checkbox"
            id="age-confirm"
            checked={isChecked}
            onChange={e => setIsChecked(e.target.checked)}
            className="w-4 h-4 mt-1 text-[var(--primary)] bg-[var(--background)] border-[var(--border)] rounded focus:ring-[var(--primary)] focus:ring-2"
          />
          <label htmlFor="age-confirm" className="text-sm text-[var(--primary)] cursor-pointer">
            <span className="font-medium">Я подтверждаю, что мне исполнилось 18 лет.</span>
            <br />
            <span className="text-xs text-[var(--primary)]/60">
              Я осознаю содержание материалов и несу полную ответственность за просмотр данного
              контента.
            </span>
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleConfirm}
            disabled={!isChecked}
            className="flex-1 px-4 py-2 bg-[var(--chart-1)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Подтвердить возраст и продолжить
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-[var(--background)] text-[var(--primary)] rounded-lg font-medium hover:bg-[var(--accent)]/30 transition-colors border border-[var(--border)]"
          >
            Отмена
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function checkAgeVerification(user: UserProfile | StoredUser | null = null): boolean {
  // Если передан пользователь с датой рождения, проверяем возраст
  if (user && user.birthDate) {
    try {
      const birthDate = new Date(user.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Корректируем возраст, если день рождения еще не наступил в этом году
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Если пользователю 18+, возвращаем true и записываем в localStorage
      if (age >= 18) {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(AGE_VERIFICATION_KEY, "true");
        }
        return true;
      }
    } catch (error) {
      console.error("Error parsing birth date:", error);
    }
  }

  // Проверяем localStorage только в браузере
  if (typeof window !== "undefined" && window.localStorage) {
    const localStorageVerified = localStorage.getItem(AGE_VERIFICATION_KEY) === "true";
    return localStorageVerified;
  }

  // Возвращаем false если localStorage недоступен (на сервере)
  return false;
}

export function clearAgeVerification(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(AGE_VERIFICATION_KEY);
  }
}
