"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Shield, Clock } from "lucide-react";
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
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setIsButtonEnabled(false);
      setCountdown(3);
    }
  }, [isOpen]);

  // Таймер задержки кнопки после включения галочки
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isChecked && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsButtonEnabled(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isChecked, countdown]);

  // Сброс таймера при отключении галочки
  useEffect(() => {
    if (!isChecked) {
      setIsButtonEnabled(false);
      setCountdown(3);
    }
  }, [isChecked]);

  const handleConfirm = () => {
    if (isChecked) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      }
      onConfirm();
     router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Возрастное ограничение 18+">
      <div className="space-y-3 sm:space-y-5">
        {/* Заголовок с иконкой */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg sm:rounded-xl">
          <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-amber-600 dark:text-amber-400">
              Доступ ограничен
            </h3>
            <p className="text-xs sm:text-sm text-[var(--primary)]/80">
              Требуется подтверждение возраста
            </p>
          </div>
        </div>

        {/* Основной текст */}
        <div className="space-y-2 sm:space-y-3">
          <p className="text-sm sm:text-base text-[var(--primary)] leading-relaxed">
            Содержимое предназначено{" "}
            <strong className="text-[var(--chart-5)]">
              только для 18+
            </strong>
            .
          </p>
          <p className="text-xs sm:text-sm text-[var(--primary)]/70">
            Ограничение по законодательству РФ (№436-ФЗ) для защиты несовершеннолетних.
          </p>
        </div>

        {/* Разделитель */}
        <div className="h-px bg-[var(--border)]" />

        {/* Чекбокс */}
        <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-[var(--accent)]/5 border border-[var(--border)] hover:bg-[var(--accent)]/10 transition-colors">
          <input
            type="checkbox"
            id="age-confirm"
            checked={isChecked}
            onChange={e => setIsChecked(e.target.checked)}
            className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-[var(--primary)] bg-[var(--background)] border-[var(--border)] rounded focus:ring-[var(--primary)] focus:ring-2 cursor-pointer"
          />
          <label htmlFor="age-confirm" className="text-xs sm:text-sm text-[var(--primary)] cursor-pointer select-none">
            <span className="font-medium block mb-0.5 sm:mb-1">
              Мне исполнилось 18 лет
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--primary)]/60 block leading-tight">
              Я осознаю содержание материалов и несу ответственность. Ложная информация — нарушение правил.
            </span>
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
          <button
            onClick={handleConfirm}
            disabled={!isChecked || !isButtonEnabled}
            className="relative flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base overflow-hidden"
          >
            {/* Фоновое заполнение прогресса */}
            {isChecked && !isButtonEnabled && (
              <div 
                className="absolute inset-0 bg-[var(--chart-1)] transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${((3 - countdown) / 3) * 100}%`,
                  opacity: 0.3 + ((3 - countdown) / 3) * 0.7
                }}
              />
            )}
            {/* Основной фон кнопки */}
            <div className={`absolute inset-0 ${isButtonEnabled ? 'bg-[var(--chart-1)]' : 'bg-[var(--chart-1)]/30'} transition-colors duration-300`} />
            {/* Контент кнопки */}
            <span className="relative z-10 flex items-center gap-2 text-[var(--primary-foreground)]">
              {isButtonEnabled ? (
                <>
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  Подтвердить
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  <span>Подтвердить ({countdown})</span>
                </>
              )}
            </span>
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-[var(--background)] text-[var(--primary)] rounded-lg sm:rounded-xl font-medium hover:bg-[var(--accent)]/30 transition-all border border-[var(--border)] text-sm sm:text-base"
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
