"use client";
import Link from "next/link";
import { MoreVertical, Library, Home, Mail, Copyright } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/shared";

export default function Footer() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full">
      <div className="w-full bg-[var(--secondary)]/40 border-t border-[var(--border)] mt-auto hidden sm:block">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8">
          {/* Основной контент футера */}
          <div
            className="flex flex-col items-center text-center space-y-6 mb-6
                      md:flex-row md:items-start md:justify-between md:text-left md:space-y-0 md:space-x-8"
          >
            {/* Логотип и описание */}
            <div className="flex flex-col items-center space-y-3 md:items-start md:max-w-sm lg:max-w-xs">
              <Logo />
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed md:text-base">
                TOMILO-LIB — Современная платформа для чтения маньхуя и комиксов
              </p>
            </div>

            {/* Контактная информация */}
            <div className="flex flex-col items-center space-y-2 md:items-end md:min-w-[250px]">
              <div className="text-[var(--muted-foreground)] text-sm text-center md:text-right">
                <span className="block">
                  В случаях нарушения авторских прав - обращайтесь на почту:
                </span>
              </div>
              <Link
                href="mailto:lugovskou.myu@ya.ru"
                className="flex items-center gap-2 text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors text-sm break-words px-2 py-1 text-center md:text-right"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-[180px] sm:max-w-[250px] md:max-w-none">
                  lugovskou.myu@ya.ru
                </span>
              </Link>
            </div>
          </div>

          {/* Разделительная линия */}
          <div className="border-t border-[var(--border)] my-4 md:my-6" />

          {/* Нижняя часть футера */}
          <div
            className="flex flex-col items-center space-y-4 text-[var(--muted-foreground)] text-sm
                      md:flex-row md:justify-between md:space-y-0 md:items-center"
          >
            {/* Навигационные ссылки */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 md:justify-start">
              <Link
                href="/terms-of-use"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Пользовательское соглашение
              </Link>
              <Link
                href="/copyright"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Авторское право
              </Link>
              <Link
                href="/updates"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Лента новых глав
              </Link>
            </div>

            {/* Копирайт и версия */}
            <div
              className="flex flex-col items-center space-y-2
                        sm:flex-row sm:space-y-0 sm:space-x-4
                        md:space-x-6 md:flex-nowrap"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm md:text-base">
                <Copyright className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{currentYear} «Tomilo-lib.ru»</span>
              </div>
              <div className="text-xs bg-[var(--accent)] px-2 py-1 rounded border border-[var(--border)] whitespace-nowrap">
                Версия 271125
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Мобильный футер */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--background)]/80 border-t border-[var(--border)] shadow-lg z-50 backdrop-blur-sm md:hidden">
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
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-0">
            <Link
              href="/"
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--secondary)] rounded-full hover:from-[var(--primary)]/90 hover:to-[var(--primary)]/70 transition-all duration-200 shadow-xl active:scale-95 border-2 border-[var(--border)]"
              aria-label="Домой"
            >
              <Home className="w-6 h-6" />
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
                <div className="fixed inset-0 z-40" onClick={closeDropdown} />
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
