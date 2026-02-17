"use client";
import { Logo, Search, ErrorBoundary } from "@/shared";
import { Navigation, UserBar } from "@/widgets";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  ChevronRight,
  BookOpen,
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
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
  const [isMobileMenuReady, setIsMobileMenuReady] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileMenuReady(false);
    setIsSearchOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // Мобильная панель поиска должна быть выключена на десктопе
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleDesktopState = (event: MediaQueryListEvent | MediaQueryList) => {
      const desktop = event.matches;
      setIsDesktop(desktop);
      if (desktop) {
        setIsSearchOpen(false);
      }
    };

    handleDesktopState(mediaQuery);
    mediaQuery.addEventListener("change", handleDesktopState);

    return () => {
      mediaQuery.removeEventListener("change", handleDesktopState);
    };
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

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen) return;
    if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    setIsMobileMenuClosing(true);
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsMobileMenuClosing(false);
      mobileMenuCloseTimeoutRef.current = null;
    }, 220);
  };

  const closeDropdown = () => setIsDropdownOpen(false);

  // Закрытие dropdown по Escape
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  // Закрытие мобильного меню по Escape и блокировка скролла body
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <header
        className={`relative w-full header-glass h-[var(--header-height)] z-50 transition-all duration-300 ${
          isScrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-3 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Кнопка меню только на мобильных */}
          {!isAdminRoute && (
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="header-icon-btn"
                aria-label="Открыть меню"
              >
                <Menu className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>
          )}
          <div className="flex items-center hover-lift rounded-xl -m-2 p-2">
            <Logo />
          </div>
        </div>

        {/* Навигация для десктопа */}
        <div className="hidden lg:block flex-1 min-w-0 mx-3">
          <Navigation />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Поиск для десктопа — в одном стиле с кнопками хедера */}
          <div className="header-search hidden lg:block flex-1 min-w-0 max-w-sm">
            <Search />
          </div>

          {/* Кнопка поиска только на мобильных */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={toggleSearch}
              className={`${isSearchOpen ? "hidden " : ""}header-icon-btn`}
              aria-label="Поиск"
            >
              <SearchIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

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
                <div
                  role="menu"
                  aria-label="Дополнительные ссылки"
                  className="absolute right-0 top-full mt-2 w-56 dropdown-modern animate-fade-in-scale z-50"
                >
                  <div className="dropdown-section-title">Информация</div>
                  <div className="py-2 px-2">
                    {HEADER_DROPDOWN_ITEMS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeDropdown}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] dropdown-item-modern rounded-lg w-full"
                      >
                        <Icon className="w-4 h-4 text-[var(--chart-1)] flex-shrink-0" aria-hidden />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center header-user-bar">
            <UserBar />
          </div>
        </div>
        </div>

      {/* Мобильная панель поиска */}
      {isSearchOpen && !isDesktop && (
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

      </header>
      {/* Мобильное меню — выезжающая панель слева */}
      {isMobileMenuOpen && (
        <>
          <div
            data-header-portal
            className={`lg:hidden fixed inset-0 z-[9998] mobile-menu-backdrop ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
            onClick={closeMobileMenu}
            aria-hidden
          />
          <div
            className={`lg:hidden fixed left-0 top-0 bottom-0 z-[9999] bg-[var(--background)] mobile-menu-panel ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
          >
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Меню</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="mobile-menu-close"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mobile-menu-body">
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
                    {/* Главные разделы */}
                    <section className="mobile-menu-section">
                      <h2 className="mobile-menu-section-title">Разделы</h2>
                      <ul className="mobile-menu-list">
                        <li>
                          <Link
                            href="/"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/" ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <Home className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Главная</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/titles"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/titles" || pathname?.startsWith("/titles/") ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <BookOpen className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Каталог</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/tomilo-shop"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/tomilo-shop" || pathname?.startsWith("/tomilo-shop/") ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <ShoppingBag className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Магазин</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/updates"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/updates" ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <LayoutList className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Обновления</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section">
                      <h2 className="mobile-menu-section-title">Аккаунт</h2>
                      <ul className="mobile-menu-list">
                        <li>
                          <Link href="/profile" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/profile" || pathname?.startsWith("/profile?") ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><User className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Профиль</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="/bookmarks" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/bookmarks" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Bookmark className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Закладки</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="/notifications" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/notifications" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Bell className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Уведомления</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section">
                      <h2 className="mobile-menu-section-title">Информация</h2>
                      <ul className="mobile-menu-list">
                        <li>
                          <Link href="/about" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/about" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Info className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">О нас</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="/contact" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/contact" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Mail className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Контакты</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="/copyright" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/copyright" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Shield className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Авторские права</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="/terms-of-use" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/terms-of-use" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><FileText className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Условия использования</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section">
                      <h2 className="mobile-menu-section-title">Связаться</h2>
                      <ul className="mobile-menu-list">
                        <li>
                          <Link href="mailto:support@tomilo-lib.ru" onClick={closeMobileMenu} className="mobile-menu-item">
                            <span className="mobile-menu-item-icon" aria-hidden><Mail className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">support@tomilo-lib.ru</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                        <li>
                          <Link href="https://t.me/tomilolib" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="mobile-menu-item">
                            <span className="mobile-menu-item-icon" aria-hidden><Send className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Telegram</span>
                            <ChevronRight className="mobile-menu-item-arrow" aria-hidden />
                          </Link>
                        </li>
                      </ul>
                    </section>
                  </>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </>
      )}
    </>
  );
}
