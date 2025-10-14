"use client";
import { Logo, Search } from "@/shared";
import { Navigation, UserBar } from "@/widgets";
import { useState } from "react";
import { Menu, X, Search as SearchIcon } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-[var(--secondary)] border-b border-[var(--border)] h-[var(--header-height)]" >
      <div className="w-full max-w-7xl mx-auto p-4 h-16 flex items-center justify-between">
        {/* Логотип или кнопка меню для мобильных экранов */}
        <div className="flex items-center gap-4">
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
        <div className="flex gap-4 justify-center items-center">
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

          {/* UserBar */}
          <div className="flex items-center gap-2">
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
            <div className="p-4 space-y-4"></div>
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
