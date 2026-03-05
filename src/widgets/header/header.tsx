"use client";
import Logo from "@/shared/logo/logo";
import Search from "@/shared/search/Search";
import ErrorBoundary from "@/shared/error-boundary/ErrorBoundary";
import LoginModal from "@/shared/modal/LoginModal";
import RegisterModal from "@/shared/modal/RegisterModal";
import { Navigation, UserBar } from "@/widgets";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useRedeemPromoCodeMutation } from "@/store/api/promocodesApi";
import type { PromoCodeReward } from "@/types/promocode";
import { ApiResponseDto } from "@/types/api";
import { AuthResponse } from "@/types/auth";
import {
  X,
  Menu,
  Search as SearchIcon,
  Home,
  User,
  FileText,
  Shield,
  Lock,
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
  Crown,
  Ticket,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const HEADER_DROPDOWN_ITEMS = [
  { href: "/about", label: "О нас", icon: Info },
  { href: "/contact", label: "Контакты", icon: Mail },
  { href: "/tomilo-shop", label: "Магазин", icon: ShoppingBag },
  { href: "/dmca", label: "Авторские права (DMCA)", icon: Shield },
  { href: "/terms-of-use", label: "Условия использования", icon: FileText },
  { href: "/privacy-policy", label: "Политика конфиденциальности", icon: Lock },
];

function formatPromoRewardsText(rewards: PromoCodeReward[] | undefined, newBalance: number | undefined): string {
  const parts: string[] = [];
  if (rewards?.length) {
    for (const r of rewards) {
      if (r.type === "balance") parts.push(`${r.amount ?? 0} монет`);
      else if (r.type === "premium") parts.push(`${r.amount ?? 0} дней премиума`);
      else if (r.type === "decoration") parts.push(r.displayName ?? "Декорация");
    }
  }
  if (newBalance !== undefined && newBalance !== null && !parts.some(p => p.includes("монет"))) {
    parts.push(`Баланс: ${newBalance} монет`);
  }
  return parts.length ? parts.join(", ") : "";
}

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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { login, isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [redeemPromoCode, { isLoading: isRedeemingPromo }] = useRedeemPromoCodeMutation();
  const toast = useToast();

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
  const handleLoginModalOpen = () => setLoginModalOpen(true);
  const handleLoginModalClose = () => setLoginModalOpen(false);
  const handleRegisterModalClose = () => setRegisterModalOpen(false);
  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };
  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };
  const handleAuthSuccess = (authResponse: ApiResponseDto<AuthResponse>) => {
    login(authResponse);
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };

  const closeMobileMenu = useCallback(() => {
    if (!isMobileMenuOpen) return;
    if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    setIsMobileMenuClosing(true);
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsMobileMenuClosing(false);
      mobileMenuCloseTimeoutRef.current = null;
    }, 220);
  }, [isMobileMenuOpen]);

  const closeDropdown = () => setIsDropdownOpen(false);

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (!isAuthenticated) {
      toast.error("Войдите в аккаунт для активации промокода");
      setLoginModalOpen(true);
      return;
    }
    try {
      const result = await redeemPromoCode({ code }).unwrap();
      if (result.success) {
        const rewardsText = formatPromoRewardsText(result.rewards, result.newBalance);
        const message = rewardsText
          ? `Промокод активирован! Получено: ${rewardsText}`
          : (result.message ?? "Промокод активирован");
        toast.success(message);
        setPromoCode("");
        closeDropdown();
      } else {
        toast.error(result.message ?? "Промокод недействителен");
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка активации")
          : "Ошибка активации";
      toast.error(msg);
    }
  };

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
  }, [isMobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <header
        className={`relative z-layer-dropdown w-full header-glass h-[var(--header-height)] transition-all duration-300 ${
          isScrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-3 relative">
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
          <div className="flex items-center rounded-xl -m-2 p-2">
            <Logo variant="header" />
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
                  className="absolute right-0 top-full mt-2 w-56 dropdown-modern animate-fade-in-scale z-50 py-1"
                  onClick={e => e.stopPropagation()}
                >
                  <form onSubmit={handleRedeemPromo} className="p-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Промокод"
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] uppercase"
                        disabled={isRedeemingPromo}
                        aria-label="Введите промокод"
                      />
                      <button
                        type="submit"
                        disabled={!promoCode.trim() || isRedeemingPromo}
                        className="shrink-0 px-2.5 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
                        aria-label="Активировать промокод"
                      >
                        {isRedeemingPromo ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Ticket className="w-4 h-4" aria-hidden />}
                        <span className="hidden sm:inline">OK</span>
                      </button>
                    </div>
                  </form>
                  {HEADER_DROPDOWN_ITEMS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeDropdown}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] dropdown-item-modern w-full mx-1"
                    >
                      <Icon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" aria-hidden />
                      {label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center header-user-bar">
            <UserBar onOpenLogin={handleLoginModalOpen} />
          </div>
        </div>
        </div>

      {/* Мобильный поиск: только панель по кнопке в хедере */}
      {!isDesktop && (
        <Search
          trigger="none"
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          showCloseInPanel
        />
      )}

      </header>
      {/* Мобильное меню — выезжающая панель слева */}
      {isMobileMenuOpen && (
        <>
          <div
            data-header-portal
            className={`lg:hidden fixed inset-0 z-layer-sheet-backdrop mobile-menu-backdrop ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
            onClick={closeMobileMenu}
            aria-hidden
          />
          <div
            className={`lg:hidden fixed left-0 top-0 bottom-0 z-layer-sheet bg-[var(--background)] mobile-menu-panel ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
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
                            href="/leaders"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/leaders" ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <Crown className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Лидеры</span>
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
                        <li>
                          <Link
                            href="/promo"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item"
                            data-active={pathname === "/promo" ? "true" : undefined}
                          >
                            <span className="mobile-menu-item-icon" aria-hidden>
                              <Ticket className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label">Промокоды</span>
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
                          <Link href="/dmca" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/dmca" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Shield className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Авторские права (DMCA)</span>
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
                        <li>
                          <Link href="/privacy-policy" onClick={closeMobileMenu} className="mobile-menu-item" data-active={pathname === "/privacy-policy" ? "true" : undefined}>
                            <span className="mobile-menu-item-icon" aria-hidden><Lock className="w-4 h-4" /></span>
                            <span className="mobile-menu-item-label">Политика конфиденциальности</span>
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

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleLoginModalClose}
        onSwitchToRegister={handleSwitchToRegister}
        onAuthSuccess={handleAuthSuccess}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={handleRegisterModalClose}
        onSwitchToLogin={handleSwitchToLogin}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
