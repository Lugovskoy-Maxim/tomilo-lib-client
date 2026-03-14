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
  Users,
  Ticket,
  Loader2,
  Gamepad2,
  Heart,
} from "lucide-react";
import Link from "next/link";

const HEADER_DROPDOWN_ITEMS = [
  { href: "/about", label: "О нас", icon: Info },
  { href: "/thanks", label: "Благодарности", icon: Heart },
  { href: "/contact", label: "Контакты", icon: Mail },
  { href: "/characters", label: "Персонажи", icon: Users, beta: true },
  { href: "/games", label: "Мини-игры", icon: Gamepad2, beta: true, inactive: true },
  { href: "/tomilo-shop", label: "Магазин", icon: ShoppingBag },
  { href: "/dmca", label: "Авторские права (DMCA)", icon: Shield },
  { href: "/terms-of-use", label: "Условия использования", icon: FileText },
  { href: "/privacy-policy", label: "Политика конфиденциальности", icon: Lock },
];

function formatPromoRewardsText(
  rewards: PromoCodeReward[] | undefined,
  newBalance: number | undefined,
): string {
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

  const toggleSearch = () => setIsSearchOpen(v => !v);
  const toggleDropdown = () => setIsDropdownOpen(v => !v);
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
        className={`relative z-[var(--z-dropdown)] w-full h-[var(--header-height)] transition-all duration-300 bg-white dark:bg-[rgba(8,8,12,0.92)] backdrop-blur-[20px] max-sm:backdrop-blur-[16px] border-b border-[rgba(var(--border-rgb),0.65)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_4px_30px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] ${
          isScrolled
            ? "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : ""
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
                  className="header-icon-btn group relative flex items-center justify-center min-w-11 min-h-11 p-2 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-250 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] max-[480px]:min-w-[34px] max-[480px]:min-h-[34px] max-[480px]:p-1 max-[480px]:rounded-lg [&_svg]:max-[480px]:w-4 [&_svg]:max-[480px]:h-4"
                  aria-label="Открыть меню"
                >
                  <span
                    className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] opacity-0 transition-opacity duration-250 group-hover:opacity-[0.12] -z-0"
                    aria-hidden
                  />
                  <Menu className="w-5 h-5 text-[var(--muted-foreground)] group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)] transition-transform duration-300 relative z-[1]" />
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
                className={`${isSearchOpen ? "hidden " : ""}header-icon-btn group relative flex items-center justify-center min-w-11 min-h-11 p-2 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-250 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] max-[480px]:min-w-[34px] max-[480px]:min-h-[34px] max-[480px]:p-1 max-[480px]:rounded-lg [&_svg]:max-[480px]:w-4 [&_svg]:max-[480px]:h-4`}
                aria-label="Поиск"
              >
                <span
                  className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] opacity-0 transition-opacity duration-250 group-hover:opacity-[0.12] -z-0"
                  aria-hidden
                />
                <SearchIcon className="w-5 h-5 text-[var(--muted-foreground)] group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)] transition-transform duration-300 relative z-[1]" />
              </button>
            </div>

            {/* Кнопка «Ещё» и выпадающее меню */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={toggleDropdown}
                className={`header-icon-btn group relative flex items-center justify-center min-w-11 min-h-11 p-2 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-250 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] max-[480px]:min-w-[34px] max-[480px]:min-h-[34px] max-[480px]:p-1 max-[480px]:rounded-lg [&_svg]:max-[480px]:w-4 [&_svg]:max-[480px]:h-4 ${isDropdownOpen ? "border-[var(--primary)] text-[var(--foreground)] shadow-[0_0_20px_-5px_var(--primary)] [&_.header-icon-glow]:opacity-[0.15] [&_.header-icon-svg]:scale-110 [&_.header-icon-svg]:-rotate-5 [&_.header-icon-svg]:text-[var(--primary)]" : ""}`}
                aria-label="Дополнительное меню"
                aria-expanded={isDropdownOpen}
              >
                <span
                  className="header-icon-glow absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] opacity-0 transition-opacity duration-250 group-hover:opacity-[0.12] -z-0"
                  aria-hidden
                />
                <MoreVertical className="header-icon-svg w-5 h-5 text-[var(--muted-foreground)] group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)] transition-transform duration-300 relative z-[1]" />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeDropdown} aria-hidden />
                  <div
                    role="menu"
                    aria-label="Дополнительные ссылки"
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-fade-in-scale z-50 py-1"
                  >
                    <form
                      onSubmit={handleRedeemPromo}
                      className="p-2 border-b border-[var(--border)]"
                    >
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
                          {isRedeemingPromo ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                          ) : (
                            <Ticket className="w-4 h-4" aria-hidden />
                          )}
                          <span className="hidden sm:inline">OK</span>
                        </button>
                      </div>
                    </form>
                    {HEADER_DROPDOWN_ITEMS.map(({ href, label, icon: Icon, beta, inactive }) =>
                      inactive ? (
                        <span
                          key={href}
                          role="menuitem"
                          aria-disabled="true"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--muted-foreground)] opacity-60 w-full mx-1 rounded-lg cursor-not-allowed"
                        >
                          <Icon
                            className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0 opacity-70"
                            aria-hidden
                          />
                          {label}
                          {beta && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 opacity-80">
                              бета
                            </span>
                          )}
                        </span>
                      ) : (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeDropdown}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] w-full mx-1 rounded-lg transition-[background-color,color] duration-150 hover:bg-[var(--accent)] hover:[&_svg]:text-[var(--foreground)] active:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
                        >
                          <Icon
                            className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0"
                            aria-hidden
                          />
                          {label}
                          {beta && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                              бета
                            </span>
                          )}
                        </Link>
                      ),
                    )}
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
            className={`lg:hidden fixed inset-0 z-[var(--z-sheet-backdrop)] mobile-menu-backdrop ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
            onClick={closeMobileMenu}
            aria-hidden
          />
          <div
            className={`lg:hidden fixed left-0 top-0 bottom-0 z-[var(--z-sheet)] bg-[var(--background)] mobile-menu-panel flex flex-col w-full h-full max-w-[min(320px,85vw)] pl-[env(safe-area-inset-left,0)] shadow-[8px_0_24px_rgba(0,0,0,0.15)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.4)] ${isMobileMenuClosing ? "mobile-menu-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
          >
            <div className="mobile-menu-header shrink-0 flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-[var(--border)] bg-[var(--background)] min-h-12">
              <span className="mobile-menu-title text-base font-semibold text-[var(--foreground)] tracking-tight">
                Меню
              </span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="mobile-menu-close flex items-center justify-center min-w-10 min-h-10 -mt-1 -mr-1 -mb-1 ml-0 rounded-[var(--radius)] text-[var(--muted-foreground)] bg-transparent border-none transition-colors duration-200 hover:bg-[var(--accent)] hover:text-[var(--foreground)] active:scale-95 [&::-webkit-tap-highlight-color]:transparent"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mobile-menu-body flex-1 min-h-0 py-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden [overflow-scrolling:touch]">
              <ErrorBoundary
                fallback={
                  <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                    Не удалось загрузить меню. Закройте и попробуйте снова.
                  </div>
                }
              >
                {!isMobileMenuReady ? (
                  <div
                    className="p-4 text-center text-sm text-[var(--muted-foreground)]"
                    aria-hidden
                  >
                    Загрузка…
                  </div>
                ) : (
                  <>
                    {/* Главные разделы */}
                    <section className="mobile-menu-section mb-4 last:mb-0">
                      <h2 className="mobile-menu-section-title text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] py-1.5 px-3 pt-1.5 pb-1 mb-0.5">
                        Разделы
                      </h2>
                      <ul className="mobile-menu-list list-none m-0 p-0 flex flex-col gap-0.5">
                        <li>
                          <Link
                            href="/"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Home className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Главная
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/titles"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={
                              pathname === "/titles" || pathname?.startsWith("/titles/")
                                ? "true"
                                : undefined
                            }
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <BookOpen className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Каталог
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/characters"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={
                              pathname === "/characters" || pathname?.startsWith("/characters/")
                                ? "true"
                                : undefined
                            }
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Users className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200 flex items-center gap-1.5">
                              Персонажи
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                                бета
                              </span>
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/tomilo-shop"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={
                              pathname === "/tomilo-shop" || pathname?.startsWith("/tomilo-shop/")
                                ? "true"
                                : undefined
                            }
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Магазин
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <span
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium w-full text-left overflow-hidden cursor-not-allowed bg-transparent border border-transparent text-[var(--muted-foreground)] opacity-60"
                            aria-disabled="true"
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[var(--muted)]/50 text-[var(--muted-foreground)] transition-all duration-300"
                              aria-hidden
                            >
                              <Gamepad2 className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200 flex items-center gap-1.5">
                              Мини-игры
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 opacity-80">
                                бета
                              </span>
                            </span>
                          </span>
                        </li>
                        <li>
                          <Link
                            href="/leaders"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/leaders" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Crown className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Лидеры
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/thanks"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/thanks" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Heart className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Благодарности
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/updates"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/updates" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <LayoutList className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Обновления
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/promo"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/promo" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Ticket className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Промокоды
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section mb-4 last:mb-0">
                      <h2 className="mobile-menu-section-title text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] py-1.5 px-3 pt-1.5 pb-1 mb-0.5">
                        Аккаунт
                      </h2>
                      <ul className="mobile-menu-list list-none m-0 p-0 flex flex-col gap-0.5">
                        <li>
                          <Link
                            href="/profile"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={
                              pathname === "/profile" || pathname?.startsWith("/profile?")
                                ? "true"
                                : undefined
                            }
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <User className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Профиль
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/bookmarks"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/bookmarks" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Bookmark className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Закладки
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/notifications"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/notifications" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Bell className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Уведомления
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section mb-4 last:mb-0">
                      <h2 className="mobile-menu-section-title text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] py-1.5 px-3 pt-1.5 pb-1 mb-0.5">
                        Информация
                      </h2>
                      <ul className="mobile-menu-list list-none m-0 p-0 flex flex-col gap-0.5">
                        <li>
                          <Link
                            href="/about"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/about" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Info className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              О нас
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/contact"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/contact" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Mail className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Контакты
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dmca"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/dmca" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Shield className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Авторские права (DMCA)
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/terms-of-use"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/terms-of-use" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <FileText className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Условия использования
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/privacy-policy"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                            data-active={pathname === "/privacy-policy" ? "true" : undefined}
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Политика конфиденциальности
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      </ul>
                    </section>

                    <section className="mobile-menu-section mb-4 last:mb-0">
                      <h2 className="mobile-menu-section-title text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] py-1.5 px-3 pt-1.5 pb-1 mb-0.5">
                        Связаться
                      </h2>
                      <ul className="mobile-menu-list list-none m-0 p-0 flex flex-col gap-0.5">
                        <li>
                          <Link
                            href="mailto:support@tomilo-lib.ru"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Mail className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              support@tomilo-lib.ru
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="https://t.me/tomilolib"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeMobileMenu}
                            className="mobile-menu-item relative flex items-center gap-2.5 min-h-11 py-1 px-3 rounded-[calc(var(--radius)-2px)] text-sm font-medium text-[var(--foreground)] no-underline w-full text-left overflow-hidden cursor-pointer bg-transparent border border-transparent transition-all duration-200 [&::-webkit-tap-highlight-color]:transparent"
                          >
                            <span
                              className="mobile-menu-item-icon flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[color-mix(in_oklch,var(--chart-1)_10%,transparent)] text-[var(--chart-1)] transition-all duration-300"
                              aria-hidden
                            >
                              <Send className="w-4 h-4" />
                            </span>
                            <span className="mobile-menu-item-label flex-1 min-w-0 transition-transform duration-200">
                              Telegram
                            </span>
                            <ChevronRight
                              className="mobile-menu-item-arrow shrink-0 w-4 h-4 text-[var(--muted-foreground)] opacity-50 transition-all duration-250"
                              aria-hidden
                            />
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
