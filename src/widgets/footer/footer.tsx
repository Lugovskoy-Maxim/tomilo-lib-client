"use client";
import Link from "next/link";
import Image from "next/image";
import {
  MoreVertical,
  Library,
  Mail,
  Copyright,
  Bookmark,
  Bell,
  Send,
  Info,
  FileText,
  Shield,
  X,
  Rss,
  ArrowUp,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Crown,
  HelpCircle,
  Ticket,
  Scale,
  Heart,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/shared/logo/logo";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useGetStatsQuery } from "@/store/api/statsApi";
import { BarChart3 } from "lucide-react";
import { APP_VERSION_LABEL } from "@/constants/version";

const FOOTER_NAV_GROUPS = [
  {
    label: "Сайт",
    items: [
      { href: "/about", label: "О нас", icon: Info },
      { href: "/faq", label: "Частые вопросы", icon: HelpCircle },
      { href: "/thanks", label: "Благодарности", icon: Heart },
      { href: "/contact", label: "Контакты", icon: Mail },
      { href: "/updates", label: "Лента новых глав", icon: Rss },
    ],
  },
  {
    label: "Документы",
    items: [
      { href: "/terms-of-use", label: "Пользовательское соглашение", icon: FileText },
      { href: "/privacy-policy", label: "Политика конфиденциальности", icon: Shield },
      { href: "/dmca", label: "Авторские права (DMCA)", icon: Scale },
    ],
  },
];
const TELEGRAM_HREF = "https://t.me/tomilolib";
const TELEGRAM_DEV_HREF = "https://t.me/TomiloDev";

const MOBILE_MENU_SECTIONS = [
  {
    title: "Информация",
    items: [
      { href: "/about", label: "О проекте", icon: Info },
      { href: "/faq", label: "Частые вопросы", icon: HelpCircle },
      { href: "/thanks", label: "Благодарности", icon: Heart },
      { href: "/leaders", label: "Лидеры", icon: Crown },
      { href: "/contact", label: "Связаться с нами", icon: Mail },
      { href: "/updates", label: "Новые главы", icon: Rss, badge: "NEW" },
      { href: "/promo", label: "Промокоды", icon: Ticket },
    ],
  },
  {
    title: "Правовая информация",
    items: [
      { href: "/terms-of-use", label: "Условия использования", icon: FileText },
      { href: "/privacy-policy", label: "Конфиденциальность", icon: Shield },
      { href: "/dmca", label: "Авторские права (DMCA)", icon: Scale },
    ],
  },
  {
    title: "Социальные сети",
    items: [{ href: TELEGRAM_HREF, label: "Telegram канал", icon: Send, external: true }],
  },
];

const MOBILE_NAV_ITEMS = [
  { href: "/titles", label: "Каталог", icon: Library, isMain: false },
  { href: "/bookmarks", label: "Закладки", icon: Bookmark, isMain: false },
  { href: "/", label: "Главная", icon: null, isMain: true },
  { href: "/notifications", label: "Уведом.", icon: Bell, isMain: false },
] as const;

function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(href + "/");
}

const SCROLL_THRESHOLD_TOP = 400;
const SWIPE_THRESHOLD = 50;

export default function Footer() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  void isLargeScreen;
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document !== "undefined" ? document.visibilityState === "visible" : true,
  );

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentY = useRef(0);

  const { isAuthenticated } = useAuth();
  const { count: notificationCount } = useUnreadCount({
    skip: !isAuthenticated,
    tabVisible: isTabVisible,
  });

  const { data: statsResponse } = useGetStatsQuery(undefined, {
    skip: false,
    refetchOnMountOrArgChange: 300, // не чаще чем раз в 5 мин
  });
  const stats = statsResponse?.data;

  const openMore = useCallback(() => {
    setSheetTranslateY(0);
    setIsMoreOpen(true);
  }, []);

  const closeMore = useCallback(() => {
    setIsMoreOpen(false);
    setSheetTranslateY(0);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      dragStartY.current = e.touches[0].clientY;
      currentY.current = 0;
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        currentY.current = deltaY;
        setSheetTranslateY(deltaY);
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (currentY.current > SWIPE_THRESHOLD) {
      closeMore();
    } else {
      setSheetTranslateY(0);
    }
    currentY.current = 0;
  }, [closeMore]);

  useEffect(() => {
    const handler = () => setIsTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.matchMedia("(min-width: 1024px)").matches);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > SCROLL_THRESHOLD_TOP);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMoreOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMore();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMoreOpen, closeMore]);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full">
      {/* Десктопный футер */}
      <div
        className="footer-desktop w-full mt-auto hidden lg:block bg-white dark:bg-[rgba(8,8,12,0.92)] backdrop-blur-[16px] border-t border-[rgba(var(--border-rgb),0.65)] dark:border-[rgba(255,255,255,0.06)]"
        role="contentinfo"
        aria-label="Подвал сайта"
      >
        <div className="footer-desktop-inner min-w-0 w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 md:px-8 lg:px-10 xl:py-12">
          <div className="footer-desktop-grid min-w-0 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10 mb-10 [&>*]:min-w-0">
            {/* Колонка 1: Логотип */}
            <div className="footer-col flex flex-col items-start min-w-0 footer-col--logo">
              <div className="footer-col__body flex flex-col gap-3 w-full pt-7">
                <Logo variant="footer" />
                <p className="footer-col__text m-0 text-[0.8125rem] leading-normal text-[var(--muted-foreground)] max-w-full">
                  TOMILO-LIB — платформа для чтения манги, манхвы и маньхуа.
                </p>
              </div>
            </div>

            {/* Колонка 2: Сайт */}
            <div className="footer-col flex flex-col items-start min-w-0">
              <h3 className="footer-col__title m-0 mb-3 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">
                Сайт
              </h3>
              <div className="footer-col__body flex flex-col gap-3 w-full">
                <ul className="footer-col__list list-none m-0 p-0 flex flex-col gap-0.5">
                  {FOOTER_NAV_GROUPS[0].items.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="break-words leading-[1.35] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[rgba(var(--primary-rgb),0.06)] focus-visible:outline-none focus-visible:text-[var(--foreground)] focus-visible:bg-[rgba(var(--primary-rgb),0.08)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded px-0.5 py-0.5 -mx-0.5 transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Колонка 3: Документы */}
            <div className="footer-col flex flex-col items-start min-w-0">
              <h3 className="footer-col__title m-0 mb-3 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">
                Документы
              </h3>
              <div className="footer-col__body flex flex-col gap-3 w-full">
                <ul className="footer-col__list list-none m-0 p-0 flex flex-col gap-0.5">
                  {FOOTER_NAV_GROUPS[1].items.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="break-words leading-[1.35] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[rgba(var(--primary-rgb),0.06)] focus-visible:outline-none focus-visible:text-[var(--foreground)] focus-visible:bg-[rgba(var(--primary-rgb),0.08)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded px-0.5 py-0.5 -mx-0.5 transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Колонка 4: Контакты */}
            <div className="footer-col flex flex-col items-start min-w-0">
              <h3 className="footer-col__title m-0 mb-3 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">
                Контакты
              </h3>
              <div className="footer-col__body flex flex-col gap-3 w-full">
                <p className="footer-col__text m-0 text-[0.8125rem] leading-normal text-[var(--muted-foreground)] max-w-full">
                  По вопросам нарушения авторских прав и сотрудничества:
                </p>
                <div className="footer-col__contacts flex flex-col gap-2">
                  <Link
                    href="mailto:support@tomilo-lib.ru"
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--chart-1)] no-underline py-1 px-1.5 -mx-1.5 rounded-md transition-[color,background-color,box-shadow] duration-200 hover:text-[var(--foreground)] hover:shadow-[0_4px_15px_-3px_rgba(var(--primary-rgb),0.3)] focus-visible:outline-none focus-visible:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    aria-label="Написать на support@tomilo-lib.ru"
                  >
                    support@tomilo-lib.ru
                  </Link>
                  <Link
                    href={TELEGRAM_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--chart-1)] no-underline py-1 px-1.5 -mx-1.5 rounded-md transition-[color,background-color,box-shadow] duration-200 hover:text-[var(--foreground)] hover:shadow-[0_4px_15px_-3px_rgba(var(--primary-rgb),0.3)] focus-visible:outline-none focus-visible:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    aria-label="Мы в Telegram (открывается в новой вкладке)"
                  >
                    Мы в Telegram
                    <ExternalLink
                      className="footer-col__contact-icon w-3 h-3 opacity-70 shrink-0"
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {stats && (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4 text-xs text-[var(--muted-foreground)]"
              role="status"
              aria-label="Краткая статистика библиотеки"
            >
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 opacity-70" aria-hidden />В библиотеке:
              </span>
              <span>{stats.totalTitles.toLocaleString("ru-RU")} тайтлов</span>
              <span aria-hidden>·</span>
              <span>{stats.totalChapters.toLocaleString("ru-RU")} глав</span>
              <span aria-hidden>·</span>
              <span>{stats.totalUsers.toLocaleString("ru-RU")} пользователей</span>
              {typeof stats.totalViews === "number" && stats.totalViews > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{stats.totalViews.toLocaleString("ru-RU")} просмотров</span>
                </>
              )}
            </div>
          )}

          <div
            className="h-px my-8 opacity-50 [background:linear-gradient(90deg,transparent_0%,var(--border)_20%,var(--primary)_50%,var(--border)_80%,transparent_100%)]"
            aria-hidden
          />

          <div className="footer-desktop-bottom flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:items-center text-[var(--muted-foreground)] text-sm">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 sm:justify-start">
              <span
                className="inline-flex items-center gap-1.5"
                aria-label={`Авторские права 2025–${currentYear} Tomilo-lib.ru`}
              >
                <Copyright className="w-4 h-4 flex-shrink-0" aria-hidden />
                2025–{currentYear} «Tomilo-lib.ru»
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
              <Link
                href={TELEGRAM_DEV_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--chart-1)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                aria-label="Разработчик сайта TomiloDev в Telegram (открывается в новой вкладке)"
              >
                Сайт разработан: @TomiloDev
                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
              </Link>
              <span
                className="py-1.5 px-3 rounded-xl whitespace-nowrap text-[var(--muted-foreground)] bg-gradient-to-br from-[rgba(var(--primary-rgb),0.12)] to-[rgba(var(--primary-rgb),0.06)] border border-[rgba(var(--border-rgb),0.6)] dark:border-[rgba(var(--border-rgb),0.6)]"
                suppressHydrationWarning
              >
                Версия {APP_VERSION_LABEL}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка «Наверх» — на всех устройствах при прокрутке */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="footer-back-to-top fixed z-40 flex items-center justify-center border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] hover:bg-[var(--accent)] hover:border-[var(--chart-1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[background-color,border-color,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] bottom-[var(--mobile-footer-bar-height)] right-4 w-10 h-10 rounded-xl lg:bottom-6 lg:right-6 lg:w-11 lg:h-11 lg:rounded-full"
          aria-label="Вернуться наверх"
        >
          <ArrowUp className="w-5 h-5" aria-hidden />
        </button>
      )}

      {/* Мобильная нижняя панель — переработанный дизайн */}
      <div className="mobile-footer fixed bottom-0 left-0 right-0 lg:hidden z-50 transition-all duration-300 ease-out translate-y-0 opacity-100">
        <div className="mobile-footer__container">
          <nav className="mobile-footer__nav" aria-label="Основная навигация">
            {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon, isMain }) => {
              const active = isActivePath(pathname, href);

              if (isMain) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`mobile-footer__main-btn ${active ? "mobile-footer__main-btn--active" : ""}`}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="mobile-footer__main-btn-inner">
                      <Image
                        src="/logo/ring_logo.png"
                        alt="Главная"
                        fill
                        sizes="3.5rem"
                        className="mobile-footer__main-logo"
                        priority
                      />
                    </span>
                    <span className="mobile-footer__main-glow" aria-hidden />
                  </Link>
                );
              }

              const isNotifications = href === "/notifications";

              return (
                <Link
                  key={href}
                  href={href}
                  className={`mobile-footer__item ${active ? "mobile-footer__item--active" : ""}`}
                  aria-label={
                    isNotifications && notificationCount > 0
                      ? `${label} (${notificationCount} новых)`
                      : label
                  }
                  aria-current={active ? "page" : undefined}
                >
                  <span className="mobile-footer__icon-container">
                    <Icon className="mobile-footer__icon" aria-hidden />
                    {active && <span className="mobile-footer__indicator" aria-hidden />}
                    {isNotifications && notificationCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1
                          bg-[var(--destructive)] text-white text-[10px] font-bold rounded-full
                          ring-2 ring-[var(--background)] z-10"
                        aria-hidden
                      >
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </span>
                  <span className="mobile-footer__label">{label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={openMore}
              className={`mobile-footer__item ${isMoreOpen ? "mobile-footer__item--active" : ""}`}
              aria-label="Дополнительное меню"
              aria-expanded={isMoreOpen}
            >
              <span className="mobile-footer__icon-container">
                <MoreVertical className="mobile-footer__icon" aria-hidden />
                {isMoreOpen && <span className="mobile-footer__indicator" aria-hidden />}
              </span>
              <span className="mobile-footer__label">Ещё</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Переработанный Bottom sheet */}
      <div
        className={`mobile-sheet-overlay ${isMoreOpen ? "mobile-sheet-overlay--open" : ""}`}
        onClick={closeMore}
        aria-hidden
      />
      <div
        ref={sheetRef}
        className={`mobile-sheet ${isMoreOpen ? "mobile-sheet--open" : ""}`}
        style={{
          transform: isMoreOpen ? `translateY(${sheetTranslateY}px)` : "translateY(100%)",
          transition: isDragging ? "none" : undefined,
        }}
        role="dialog"
        aria-label="Дополнительное меню"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-sheet__header">
          <div className="mobile-sheet__handle" aria-hidden />
          <div className="mobile-sheet__title-row">
            <div className="mobile-sheet__title-content">
              <Sparkles className="mobile-sheet__title-icon" aria-hidden />
              <span className="mobile-sheet__title">Меню</span>
            </div>
            <button
              type="button"
              onClick={closeMore}
              className="mobile-sheet__close"
              aria-label="Закрыть меню"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mobile-sheet__content">
          {MOBILE_MENU_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className="mobile-sheet__section">
              <h3 className="mobile-sheet__section-title">{section.title}</h3>
              <div className="mobile-sheet__section-items">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isExternal = "external" in item && item.external;
                  const ItemComponent = isExternal ? "a" : Link;
                  const linkProps = isExternal
                    ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                    : { href: item.href };

                  return (
                    <ItemComponent
                      key={item.href}
                      {...linkProps}
                      onClick={closeMore}
                      className="mobile-sheet__item"
                    >
                      <span className="mobile-sheet__item-icon-wrap">
                        <Icon className="mobile-sheet__item-icon" aria-hidden />
                      </span>
                      <span className="mobile-sheet__item-content">
                        <span className="mobile-sheet__item-label">{item.label}</span>
                        {"badge" in item && item.badge && (
                          <span className="mobile-sheet__item-badge">{item.badge}</span>
                        )}
                      </span>
                      <ChevronRight className="mobile-sheet__item-arrow" aria-hidden />
                      {isExternal && (
                        <ExternalLink className="mobile-sheet__item-external" aria-hidden />
                      )}
                    </ItemComponent>
                  );
                })}
              </div>
              {sectionIndex < MOBILE_MENU_SECTIONS.length - 1 && (
                <div className="mobile-sheet__divider" />
              )}
            </div>
          ))}
        </div>

        <div className="mobile-sheet__footer">
          <p className="mobile-sheet__copyright">© 2025–{currentYear} Tomilo-lib.ru</p>
        </div>
      </div>
    </footer>
  );
}
