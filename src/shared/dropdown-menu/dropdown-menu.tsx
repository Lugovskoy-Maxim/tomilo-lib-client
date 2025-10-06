"use client";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user?: { name?: string };
}

export default function UserDropdown({ isOpen, onClose }: UserDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full right-0 mt-3 w-52 bg-[var(--secondary)] rounded-lg shadow-lg border border-[var(--border)] z-50"
      onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике внутри меню
    >
      <div className="p-2 space-y-1">
        <button
          type="button"
          className="w-full text-left px-3 py-2 font-medium text-[var(--primary)]rounded-md hover:text-[var(--foreground)] cursor-pointer transition-colors"
          onClick={onClose}
        >
          Профиль
        </button>
        <button
          type="button"
          className="w-full text-left px-3 py-2 font-medium text-[var(--primary)]rounded-md hover:text-[var(--foreground)] cursor-pointer transition-colors"
          onClick={onClose}
        >
          Настройки
        </button>
        <button
          type="button"
          className="w-full text-left px-3 py-2 font-medium text-[var(--primary)]rounded-md hover:text-[var(--foreground)] cursor-pointer transition-colors"
          onClick={onClose}
        >
          Помощь
        </button>
        <hr className="my-1 border-[var(--border)]" />
        <button
          type="button"
          className="w-full text-left px-3 py-2 rounded-md hover:text-red-600 text-[var(--destructive)] transition-colors cursor-pointer"
          onClick={onClose}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}