"use client";
import Link from "next/link";
import { MoreVertical, Library, Home } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--border)] shadow-lg z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 py-2 relative">
        {/* Левая кнопка - Каталог */}
        <Link
          href="/browse"
          className="flex items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
          aria-label="Каталог"
        >
          <Library className="w-6 h-6 text-[var(--muted-foreground)]" />
        </Link>

        {/* Центральная кнопка - Домой */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-6">
          <Link
            href="/"
            className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] rounded-full hover:from-[var(--primary)]/90 hover:to-[var(--primary)]/70 transition-all duration-200 shadow-xl active:scale-95 border-2 border-[var(--background)]"
            aria-label="Домой"
          >
            <Home className="w-7 h-7" />
          </Link>
        </div>

        {/* Правая кнопка - ... с меню */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
            aria-label="Дополнительное меню"
          >
            <MoreVertical className="w-6 h-6 text-[var(--muted-foreground)]" />
          </button>

          {/* Выпадающее меню */}
          {isDropdownOpen && (
            <>
              <div className="absolute right-0 bottom-20 mb-3 w-56 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl z-50 backdrop-blur-sm">
                <div className="py-2">
                  <Link
                    href="/about"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                  >
                    О нас
                  </Link>
                  <Link
                    href="/contact"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                  >
                    Контакты
                  </Link>
                  <Link
                    href="/copyright"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                  >
                    Авторские права
                  </Link>
                  <Link
                    href="/terms-of-use"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                  >
                    Условия использования
                  </Link>
                </div>
              </div>

              {/* Overlay для закрытия меню */}
              <div
                className="fixed inset-0 z-40"
                onClick={closeDropdown}
              />
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
