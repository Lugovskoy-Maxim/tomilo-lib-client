"use client";
import { Logo, Search, ThemeToggle } from "@/shared";
import { Navigation, UserBar } from "@/widgets";
import { useState } from "react";
import { Menu, X, Search as SearchIcon, Home, User, FileText, Shield, MoreVertical, Info, Mail } from "lucide-react";
import Link from "next/link";
import ContactForm from "@/widgets/contact-form/contact-form";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
    <header className="w-full bg-[var(--secondary)]/40 border-b border-[var(--border)] h-[var(--header-height)]" >
      <div className="w-full max-w-7xl mx-auto p-4 h-16 flex items-center justify-between">
        {/* Логотип или кнопка меню для мобильных экранов */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)]"
            aria-label="Открыть меню"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
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
            } lg:hidden p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1`}
            aria-label="Поиск"
          >
            {isSearchOpen ? null : <SearchIcon className="w-5 h-5" />}
          </button>

          {/* Кнопка "..." с выпадающим меню */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center p-2 hover:bg-[var(--popover)] bg-[var(--secondary)] rounded-full border border-[var(--border)] text-[var(--muted-foreground)]"
              aria-label="Дополнительное меню"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Выпадающее меню */}
            {isDropdownOpen && (
              <>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--secondary)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      href="/about"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                    >
                      <Info className="w-4 h-4 mr-3" />
                      О нас
                    </Link>
                    <Link
                      href="/contact"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-3" />
                      Контакты
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

          {/* UserBar */}
          <div className="flex items-center">
            <UserBar />
          </div>
        </div>

        {/* Мобильное поисковое окно */}
        {isSearchOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-[var(--secondary)] border-b border-[var(--border)] p-4 z-40 items-center justify-center flex">
            <Search />
            <button
              onClick={toggleSearch}
              className="absolute -bottom-[33px] right-4 rounded-xl rounded-t-none bg-[var(--secondary)] border border-t-0 border-[var(--border)] flex items-center justify-center"
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
          <div className="lg:hidden fixed inset-0 top-16 bg-[var(--background)] z-50 overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)]">
              <Navigation onItemClick={closeMobileMenu} />
            </div>

            {/* Дополнительные пункты меню для мобильных */}
            <div className="p-4 space-y-6">
              {/* Секция настроек */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Настройки
                </h3>
                <div className="flex items-center justify-between p-3 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
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
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <Home className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    Обновления
                  </Link>
                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <User className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    Профиль
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
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <Info className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    О нас
                  </Link>
                  <Link
                    href="/contact"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <Mail className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    Контакты
                  </Link>
                  <Link
                    href="/copyright"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <Shield className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    Авторские права
                  </Link>
                  <Link
                    href="/terms-of-use"
                    onClick={closeMobileMenu}
                    className="flex items-center py-3 px-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                  >
                    <FileText className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                    Условия использования
                  </Link>
                </div>
              </div>

              {/* Форма обратной связи в мобильном меню */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Обратная связь
                </h3>
                <div className="bg-[var(--secondary)] p-4 rounded-lg border border-[var(--border)]">
                  <ContactForm compact />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay для мобильного меню */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={closeMobileMenu}
          />
        )}
      </div>
    </header>
  );
}
