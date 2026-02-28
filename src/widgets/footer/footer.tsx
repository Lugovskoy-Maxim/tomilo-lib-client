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
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/shared";

const FOOTER_NAV = [
  { href: "/about", label: "О нас" },
  { href: "/contact", label: "Контакты" },
  { href: "/terms-of-use", label: "Пользовательское соглашение" },
  { href: "/privacy-policy", label: "Политика конфиденциальности" },
  { href: "/copyright", label: "Авторское право" },
  { href: "/updates", label: "Лента новых глав" },
];
const TELEGRAM_HREF = "https://t.me/tomilolib";
const TELEGRAM_DEV_HREF = "https://t.me/TomiloDev";

const MOBILE_MENU_SECTIONS = [
  {
    title: "Информация",
    items: [
      { href: "/about", label: "О проекте", icon: Info },
      { href: "/contact", label: "Связаться с нами", icon: Mail },
      { href: "/updates", label: "Новые главы", icon: Rss, badge: "NEW" },
    ],
  },
  {
    title: "Правовая информация",
    items: [
      { href: "/copyright", label: "Авторские права", icon: Copyright },
      { href: "/terms-of-use", label: "Условия использования", icon: FileText },
      { href: "/privacy-policy", label: "Конфиденциальность", icon: Shield },
    ],
  },
  {
    title: "Социальные сети",
    items: [
      { href: TELEGRAM_HREF, label: "Telegram канал", icon: Send, external: true },
    ],
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
  const [isVisible, setIsVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentY = useRef(0);

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
    dragStartY.current = e.touches[0].clientY;
    currentY.current = 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      setSheetTranslateY(deltaY);
    }
  }, [isDragging]);

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
    const checkScreen = () => setIsLargeScreen(window.matchMedia("(min-width: 1024px)").matches);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowBackToTop(currentScrollY > SCROLL_THRESHOLD_TOP);
      const scrollingDown = currentScrollY > lastScrollY;
      const atBottom =
        window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 10;
      if (atBottom) {
        setIsVisible(true);
      } else if (scrollingDown) {
        setIsVisible(false);
      } else if (!scrollingDown && currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLargeScreen]);

  useEffect(() => {
    if (isMoreOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
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
      <div className="footer-desktop w-full footer-glass mt-auto hidden lg:block" role="contentinfo" aria-label="Подвал сайта">
        <div className="footer-desktop-inner w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 md:px-8 lg:px-10 xl:py-12">
          <div className="footer-desktop-grid grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-10">
            {/* Колонка 1: Логотип и описание */}
            <div className="md:col-span-5 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="footer-brand p-4 rounded-2xl -m-4">
                <Logo variant="footer" />
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mt-3 max-w-[280px]">
                  TOMILO-LIB — платформа для чтения манги, манхвы и маньхуа.
                </p>
              </div>
            </div>

            {/* Колонка 2: Навигация */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <h3 className="footer-section-title text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-4">
                Навигация
              </h3>
              <nav className="flex flex-col gap-2.5" aria-label="Основные разделы">
                {FOOTER_NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="footer-link text-[var(--muted-foreground)] text-sm whitespace-nowrap py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Колонка 3: Контакты */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="footer-section-title text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-4">
                Контакты
              </h3>
              <p className="text-[var(--muted-foreground)] text-sm mb-4 max-w-[260px]">
                По вопросам нарушения авторских прав и сотрудничества:
              </p>
              <div className="flex flex-col gap-3 items-center md:items-start">
                <Link
                  href="mailto:support@tomilo-lib.ru"
                  className="footer-contact-link inline-flex items-center gap-2 text-sm rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  aria-label="Написать на support@tomilo-lib.ru"
                >
                  <Mail className="w-4 h-4 flex-shrink-0 text-[var(--chart-1)]" aria-hidden />
                  support@tomilo-lib.ru
                </Link>
                <Link
                  href={TELEGRAM_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link footer-contact-link-external inline-flex items-center gap-2 text-sm rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  aria-label="Мы в Telegram (открывается в новой вкладке)"
                >
                  <Send className="w-4 h-4 flex-shrink-0 text-[var(--chart-1)]" aria-hidden />
                  Мы в Telegram
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <div className="gradient-divider my-8" />

          <div className="footer-desktop-bottom flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:items-center text-[var(--muted-foreground)] text-sm">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 sm:justify-start">
              <span className="inline-flex items-center gap-1.5" aria-label={`Авторские права 2025–${currentYear} Tomilo-lib.ru`}>
                <Copyright className="w-4 h-4 flex-shrink-0" aria-hidden />
                2025–{currentYear} «Tomilo-lib.ru»
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
              <Link
                href={TELEGRAM_DEV_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-credit-link inline-flex items-center gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                aria-label="Разработчик сайта TomiloDev в Telegram (открывается в новой вкладке)"
              >
                Сайт разработан: @TomiloDev
                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
              </Link>
              <span className="footer-version">Версия 17022026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка «Наверх» — на всех устройствах при прокрутке */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="footer-back-to-top fixed z-40 flex items-center justify-center shadow-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:border-[var(--chart-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 bottom-20 right-4 w-10 h-10 rounded-xl lg:bottom-6 lg:right-6 lg:w-11 lg:h-11 lg:rounded-full"
          aria-label="Вернуться наверх"
        >
          <ArrowUp className="w-5 h-5" aria-hidden />
        </button>
      )}

      {/* Мобильная нижняя панель — переработанный дизайн */}
      <div
        className={`
          mobile-footer fixed bottom-0 left-0 right-0 lg:hidden z-50
          transition-all duration-300 ease-out
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
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
              
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mobile-footer__item ${active ? "mobile-footer__item--active" : ""}`}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="mobile-footer__icon-container">
                    <Icon className="mobile-footer__icon" aria-hidden />
                    {active && <span className="mobile-footer__indicator" aria-hidden />}
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
          transform: isMoreOpen 
            ? `translateY(${sheetTranslateY}px)` 
            : "translateY(100%)",
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
          <div 
            className="mobile-sheet__handle" 
            aria-hidden 
          />
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
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isExternal = 'external' in item && item.external;
                  const ItemComponent = isExternal ? 'a' : Link;
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
                        {'badge' in item && item.badge && (
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
          <p className="mobile-sheet__copyright">
            © 2025–{currentYear} Tomilo-lib.ru
          </p>
        </div>
      </div>
    </footer>
  );
}
