"use client";

import React, { useState, useEffect } from "react";
import Modal from "./modal";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const AGE_VERIFICATION_KEY = "age-verified";

export function AgeVerificationModal({
  isOpen,
  onConfirm,
  onCancel,
}: AgeVerificationModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isChecked) {
      localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Возрастное ограничение 18+"
    >
      <div className="space-y-4">
        <p className="text-[var(--primary)]">
          Этот контент предназначен только для лиц старше 18 лет.
          Подтвердите, что вам исполнилось 18 лет.
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="age-confirm"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="w-4 h-4 text-[var(--primary)] bg-[var(--background)] border-[var(--border)] rounded focus:ring-[var(--primary)] focus:ring-2"
          />
          <label
            htmlFor="age-confirm"
            className="text-sm text-[var(--primary)] cursor-pointer"
          >
            Мне исполнилось 18 лет
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleConfirm}
            disabled={!isChecked}
            className="flex-1 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Подтвердить
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

export function checkAgeVerification(): boolean {
  return localStorage.getItem(AGE_VERIFICATION_KEY) === "true";
}

export function clearAgeVerification(): void {
  localStorage.removeItem(AGE_VERIFICATION_KEY);
}
