"use client";
import Link from "next/link";
import {
  MoreVertical,
  Library,
  Home,
  Mail,
  Copyright,
  Bookmark,
  Bell,
  Send,
  Info,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/shared";

const FOOTER_NAV = [
  { href: "/about", label: "О нас" },
  { href: "/contact", label: "Контакты" },
  { href: "/terms-of-use", label: "Пользовательское соглашение" },
  { href: "/copyright", label: "Авторское право" },
  { href: "/updates", label: "Лента новых глав" },
];

const MOBILE_MENU_ITEMS = [
  { href: "/about", label: "О нас", icon: Info },
  { href: "/contact", label: "Контакты", icon: Mail },
  { href: "/copyright", label: "Авторские права", icon: Copyright },
  { href: "/terms-of-use", label: "Условия использования", icon: FileText },
];

export default function Footer() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const toggleDropdown = () => setIsDropdownOpen((v) => !v);
  const closeDropdown = () => setIsDropdownOpen(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const atBottom =
        window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 10;
      if (atBottom) setIsVisible(true);
      else if (scrollingDown && isVisible) setIsVisible(false);
      else if (!scrollingDown && !isVisible) setIsVisible(true);
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full">
      {/* Десктопный футер */}
      <div className="w-full footer-glass mt-auto hidden lg:block">
        <div className="w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mb-8">
            {/* Колонка 1: Логотип и описание */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="footer-brand hover-lift p-4 rounded-2xl -m-4">
                <Logo />
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mt-3 max-w-xs">
                  TOMILO-LIB — платформа для чтения манги, манхвы и маньхуа.
                </p>
              </div>
            </div>

            {/* Колонка 2: Навигация */}
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]/80 mb-3">
                Навигация
              </span>
              <nav className="flex flex-col gap-2">
                {FOOTER_NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="footer-link text-[var(--muted-foreground)] text-sm whitespace-nowrap py-1"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Колонка 3: Контакты */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]/80 mb-3">
                Контакты
              </span>
              <p className="text-[var(--muted-foreground)] text-sm mb-3 max-w-[260px]">
                По вопросам нарушения авторских прав и сотрудничества:
              </p>
              <div className="flex flex-col gap-2 items-center md:items-start">
                <Link
                  href="mailto:support@tomilo-lib.ru"
                  className="footer-contact-link inline-flex items-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4 flex-shrink-0 text-[var(--chart-1)]" />
                  support@tomilo-lib.ru
                </Link>
                <Link
                  href="https://t.me/tomilolib"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link inline-flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4 flex-shrink-0 text-[var(--chart-1)]" />
                  Мы в Telegram
                </Link>
              </div>
            </div>
          </div>

          <div className="gradient-divider my-6" />

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center text-[var(--muted-foreground)] text-sm">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Copyright className="w-4 h-4" />
                2025–{currentYear} «Tomilo-lib.ru»
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <Link
                href="https://t.me/TomiloDev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--muted-foreground)] hover:text-[var(--chart-1)] transition-colors"
              >
                Сайт разработан: @TomiloDev
              </Link>
              <span className="footer-version">Версия 17022026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильная нижняя панель */}
      <div
        className={`
          footer-mobile-bar fixed bottom-0 left-0 right-0 lg:hidden z-50
          transition-transform duration-300 ease-out
          ${isVisible ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="flex items-center justify-center gap-2 px-3 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2 rounded-2xl bg-[var(--card)]/95 border border-[var(--border)] shadow-footer-mobile backdrop-blur-xl px-2 py-2">
            <Link
              href="/titles"
              className="footer-mobile-btn"
              aria-label="Каталог"
            >
              <Library className="w-5 h-5" />
            </Link>
            <Link
              href="/notifications"
              className="footer-mobile-btn"
              aria-label="Уведомления"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="footer-mobile-btn footer-mobile-btn-home"
              aria-label="Главная"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link
              href="/bookmarks"
              className="footer-mobile-btn"
              aria-label="Закладки"
            >
              <Bookmark className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={toggleDropdown}
                className="footer-mobile-btn aria-expanded:bg-[var(--accent)]"
                aria-label="Ещё"
                aria-expanded={isDropdownOpen}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeDropdown} aria-hidden />
                  <div className="absolute right-0 bottom-full mb-2 w-56 dropdown-modern animate-fade-in-scale z-50">
                    <div className="py-2">
                      {MOBILE_MENU_ITEMS.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeDropdown}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)] dropdown-item-modern rounded-lg mx-2"
                        >
                          <Icon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
