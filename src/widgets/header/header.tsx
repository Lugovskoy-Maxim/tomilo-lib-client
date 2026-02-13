"use client";
import { Logo, Search, ThemeToggle, ErrorBoundary } from "@/shared";
import { Navigation, UserBar } from "@/widgets";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Menu,
  Search as SearchIcon,
  Home,
  User,
  FileText,
  Shield,
  MoreVertical,
  Info,
  Mail,
  Bookmark,
  Bell,
  LayoutList,
  ShoppingBag,
  Send,
} from "lucide-react";
import Link from "next/link";

const HEADER_DROPDOWN_ITEMS = [
  { href: "/about", label: "О нас", icon: Info },
  { href: "/contact", label: "Контакты", icon: Mail },
  { href: "/tomilo-shop", label: "Магазин", icon: ShoppingBag },
  { href: "/copyright", label: "Авторские права", icon: Shield },
  { href: "/terms-of-use", label: "Условия использования", icon: FileText },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuReady, setIsMobileMenuReady] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Рендер содержимого мобильного меню после открытия (избегаем ошибок при первом показе)
  useEffect(() => {
    if (!isMobileMenuOpen) {
      setIsMobileMenuReady(false);
      return;
    }
    const t = requestAnimationFrame(() => setIsMobileMenuReady(true));
    return () => cancelAnimationFrame(t);
  }, [isMobileMenuOpen]);

  const toggleSearch = () => setIsSearchOpen((v) => !v);
  const toggleDropdown = () => setIsDropdownOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeDropdown = () => setIsDropdownOpen(false);

  return (
    <header
      className={`relative w-full header-glass h-[var(--header-height)] z-50 transition-all duration-300 ${
        isScrolled ? "header-scrolled" : ""
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2">
          {/* Кнопка меню только на мобильных */}
          <div className="shrink-0 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="header-icon-btn"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
          <div className="flex items-center hover-lift rounded-xl -m-2 p-2">
            <Logo />
          </div>
        </div>

        {/* Навигация для десктопа */}
        <div className="hidden lg:block flex-1 mx-6">
          <Navigation />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Поиск для десктопа */}
          <div className="hidden lg:block flex-1 min-w-0 max-w-sm">
            <Search />
          </div>

          {/* Кнопка поиска на мобильных */}
          <button
            onClick={toggleSearch}
            className={`${isSearchOpen ? "hidden" : "lg:hidden"} header-icon-btn`}
            aria-label="Поиск"
          >
            <SearchIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>

          {/* Кнопка «Ещё» и выпадающее меню */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={toggleDropdown}
              className="header-icon-btn"
              aria-label="Дополнительное меню"
              aria-expanded={isDropdownOpen}
            >
              <MoreVertical className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeDropdown} aria-hidden />
                <div className="absolute right-0 top-full mt-2 w-56 dropdown-modern animate-fade-in-scale z-50">
                  <div className="py-2">
                    {HEADER_DROPDOWN_ITEMS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeDropdown}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] dropdown-item-modern rounded-lg mx-2"
                      >
                        <Icon className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center">
            <UserBar />
          </div>
        </div>
      </div>

      {/* Мобильная панель поиска */}
      {isSearchOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 header-glass border-b border-[var(--border)]/50 z-40 animate-slide-down">
          <div className="relative flex items-center gap-2 p-3">
            <div className="flex-1 min-w-0">
              <Search />
            </div>
            <button
              type="button"
              onClick={toggleSearch}
              className="header-icon-btn flex-shrink-0"
              aria-label="Закрыть поиск"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Мобильное меню: портал в body, чтобы всегда поверх контента (на мобильных меню уходило под main). */}
      {isMobileMenuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-[9998]"
              onClick={closeMobileMenu}
              aria-hidden
            />
            <div className="lg:hidden fixed inset-x-0 top-[var(--header-height)] bottom-0 bg-[var(--background)]/98 backdrop-blur-xl z-[9999] overflow-y-auto animate-fade-in-scale">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 border-b border-[var(--border)]/50 bg-[var(--background)]/98 backdrop-blur-sm">
              <span className="text-sm font-semibold text-[var(--foreground)]">Меню</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="header-icon-btn ml-auto"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ErrorBoundary
              fallback={
                <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                  Не удалось загрузить меню. Закройте и попробуйте снова.
                </div>
              }
            >
              {!isMobileMenuReady ? (
                <div className="p-4 text-center text-sm text-[var(--muted-foreground)]" aria-hidden>
                  Загрузка…
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-[var(--border)]/50">
                    <Navigation onItemClick={closeMobileMenu} />
                  </div>

                  <div className="p-4 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Настройки
                </h3>
                <div className="flex items-center justify-between p-3 bg-[var(--secondary)]/60 rounded-xl border border-[var(--border)]/50 hover-lift">
                  <span className="text-sm font-medium text-[var(--foreground)]">Тема</span>
                  <ThemeToggle />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Аккаунт
                </h3>
                <div className="space-y-1">
                  <Link href="/" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Home className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Главная
                  </Link>
                  <Link href="/updates" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <LayoutList className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Обновления
                  </Link>
                  <Link href="/profile" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <User className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Профиль
                  </Link>
                  <Link href="/bookmarks" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Bookmark className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Закладки
                  </Link>
                  <Link href="/notifications" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Bell className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Уведомления
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Информация
                </h3>
                <div className="space-y-1">
                  <Link href="/about" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Info className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    О нас
                  </Link>
                  <Link href="/contact" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Mail className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Контакты
                  </Link>
                  <Link href="/copyright" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <Shield className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Авторские права
                  </Link>
                  <Link href="/terms-of-use" onClick={closeMobileMenu} className="header-mobile-nav-link">
                    <FileText className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Условия использования
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Связаться
                </h3>
                <div className="flex flex-col gap-2">
                  <Link
                    href="mailto:support@tomilo-lib.ru"
                    onClick={closeMobileMenu}
                    className="header-mobile-nav-link"
                  >
                    <Mail className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    support@tomilo-lib.ru
                  </Link>
                  <Link
                    href="https://t.me/tomilolib"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileMenu}
                    className="header-mobile-nav-link"
                  >
                    <Send className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" />
                    Telegram
                  </Link>
                </div>
              </div>
                  </div>
                </>
              )}
            </ErrorBoundary>
            </div>
          </>,
          document.body,
        )}
    </header>
  );
}
