"use client";
import { Logo, Search, ThemeToggle } from "@/shared";
import { Navigation, UserBar } from "@/widgets";
import { useState, useEffect } from "react";
import {
  X,
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
} from "lucide-react";
import Link from "next/link";
import ContactForm from "@/widgets/contact-form/ContactForm";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="absolute top-0 w-full header-glass h-[var(--header-height)] z-50 transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto p-4 h-16 flex items-center justify-between relative z-10">
        {/* Логотип */}
        <div className="flex items-center gap-2 hover-lift">
          <Logo />
        </div>

        {/* Навигация для пк */}
        <div className="hidden lg:block flex-1 mx-8">
          <Navigation />
        </div>
        <div className="flex gap-2 justify-center items-center">
          {/* Поиск для пк */}
          <div className="hidden lg:block flex-1 max-w-md">
            <Search />
          </div>

          {/* Кнопка поиска для мобильных */}
          <button
            onClick={toggleSearch}
            className={`${
              isSearchOpen ? "hidden" : "lg:hidden"
            } lg:hidden p-2.5 btn-modern bg-[var(--secondary)]/80 cursor-pointer text-[var(--muted-foreground)] border border-[var(--border)]/60 rounded-full hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-ring/50`}
            aria-label="Поиск"
          >
            {isSearchOpen ? null : <SearchIcon className="w-5 h-5" />}
          </button>

          {/* Кнопка "..." с выпадающим меню */}
          <div className="relative hidden md:block">
            <button
              onClick={toggleDropdown}
              className="flex items-center p-2.5 cursor-pointer btn-modern bg-[var(--secondary)]/80 rounded-full border border-[var(--border)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Дополнительное меню"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Выпадающее меню */}
            {isDropdownOpen && (
              <>
                <div className="absolute right-0 top-full mt-3 w-52 dropdown-modern animate-fade-in-scale z-50">
                  <div className="py-2">
                    <Link
                      href="/about"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2.5 text-sm text-[var(--foreground)] dropdown-item-modern"
                    >
                      <Info className="w-4 h-4 mr-3 text-[var(--chart-1)]" />О нас
                    </Link>
                    <Link
                      href="/contact"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2.5 text-sm text-[var(--foreground)] dropdown-item-modern"
                    >
                      <Mail className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                      Контакты
                    </Link>
                  </div>
                </div>

                {/* Overlay для закрытия меню */}
                <div className="fixed inset-0 z-40" onClick={closeDropdown} />
              </>
            )}
          </div>

          {/* UserBar */}
          <div className="flex items-center">
            <UserBar />
          </div>
        </div>

        {/* Мобильное поисковое окно */}
        {isSearchOpen && (
          <div className="lg:hidden absolute top-[var(--header-height)] left-0 right-0 header-glass border-b border-[var(--border)]/50 p-4 z-40 items-center justify-center flex animate-slide-down">
            <Search />
            <button
              onClick={toggleSearch}
              className="absolute -bottom-[33px] right-4 rounded-xl rounded-t-none bg-[var(--secondary)]/90 border border-t-0 border-[var(--border)]/60 flex items-center justify-center hover-lift"
              aria-label="Закрыть поиск"
            >
              <div className="w-10 h-8 flex items-center justify-center">
                <X className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[var(--header-height)] bg-[var(--background)]/98 backdrop-blur-xl z-50 overflow-y-auto animate-fade-in-scale">
            <div className="p-4 border-b border-[var(--border)]/50">
              <Navigation onItemClick={closeMobileMenu} />
            </div>

            {/* Дополнительные пункты меню для мобильных */}
            <div className="p-4 space-y-6">
              {/* Секция настроек */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Настройки
                </h3>
                <div className="flex items-center justify-between p-3 bg-[var(--secondary)]/60 rounded-xl border border-[var(--border)]/50 hover-lift">
                  <span className="text-sm font-medium text-[var(--foreground)]">Тема</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Секция аккаунта */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Аккаунт
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/updates"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Home className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Обновления
                  </Link>
                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <User className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Профиль
                  </Link>
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Home className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Главная страница
                  </Link>
                  <Link
                    href="/bookmarks"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Bookmark className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Закладки
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Bell className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Уведомления
                  </Link>
                </div>
              </div>

              {/* Секция информации */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Информация
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Info className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    О нас
                  </Link>
                  <Link
                    href="/contact"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Mail className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Контакты
                  </Link>
                  <Link
                    href="/copyright"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <Shield className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Авторские права
                  </Link>
                  <Link
                    href="/terms-of-use"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] mobile-nav-item rounded-xl"
                  >
                    <FileText className="w-4 h-4 mr-3 text-[var(--chart-1)]" />
                    Условия использования
                  </Link>
                </div>
              </div>

              {/* Форма обратной связи в мобильном меню */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Обратная связь
                </h3>
                <div className="bg-[var(--secondary)]/60 p-4 rounded-xl border border-[var(--border)]/50">
                  <ContactForm compact />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay для мобильного меню */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMobileMenu} />
        )}
      </div>
    </header>
  );
}
