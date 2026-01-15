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
  Paperclip,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/shared";
import Image from "next/image";
import SnowCapImage from "../../../public/snow_cap/snow_cap_long.png";

import SnowCapImageRight from "../../../public/snow_cap/snow_cap_small_right.png";

export default function Footer() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;

      if (
        window.innerHeight + window.pageYOffset >=
        document.documentElement.scrollHeight
      ) {
        setIsVisible(true);
      }
      if (scrollingDown && isVisible) {
        setIsVisible(false);
      } else if (!scrollingDown && !isVisible) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full">
      <Image
        src={SnowCapImage}
        alt="Сугроб"
        width={300}
        height={40}

        className="absolute -top-5 left-1/4 hidden lg:block"
      />


      <div className="w-full bg-[var(--secondary)]/40 border-t border-[var(--border)] mt-auto hidden lg:block">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8">
          {/* Основной контент футера */}
          <div
            className="flex flex-col items-center text-center space-y-6 mb-6
                      md:flex-row md:items-start md:justify-between md:text-left md:space-y-0 md:space-x-8"
          >
            {/* Логотип и описание */}
            <div className="flex flex-col items-center space-y-3 md:items-start md:max-w-sm lg:max-w-xs">
              <Logo />
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed md:text-base">
                TOMILO-LIB — Современная платформа для чтения манги, манхвы и
                маньхуа.
              </p>
            </div>

            {/* Контактная информация */}
            <div className="flex flex-col items-center space-y-2 md:items-end md:min-w-[250px]">
              <div className="text-[var(--muted-foreground)] text-sm text-center md:text-right">
                <span className="block">
                  В случаях нарушения авторских прав - обращайтесь на почту:
                </span>
              </div>
              <Link
                href="mailto:support@tomilo-lib.ru"
                className="flex items-center gap-2 text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors text-sm break-words px-2 py-1 text-center md:text-right"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-[180px] sm:max-w-[250px] md:max-w-none">
                  support@tomilo-lib.ru
                </span>
              </Link>
              <Link
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors text-sm break-words px-2 py-1 text-center md:text-right"
              >
                <Send className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-[180px] sm:max-w-[250px] md:max-w-none">
                  Мы в телеграм
                </span>
              </Link>
            </div>
          </div>

          {/* Разделительная линия */}
          <div className="border-t border-[var(--border)] my-4 md:my-6" />

          {/* Нижняя часть футера */}
          <div
            className="flex flex-col items-center space-y-4 text-[var(--muted-foreground)] text-sm
                      md:flex-row md:justify-between md:space-y-0 md:items-center"
          >
            {/* Навигационные ссылки */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 md:justify-start">
              <Link
                href="/terms-of-use"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Пользовательское соглашение
              </Link>
              <Link
                href="/copyright"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Авторское право
              </Link>
              <Link
                href="/updates"
                className="hover:text-[var(--foreground)] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Лента новых глав
              </Link>
            </div>

            {/* Копирайт и версия */}
            <div
              className="flex flex-col items-center space-y-2
                        sm:flex-row sm:space-y-0 sm:space-x-4
                        md:space-x-6 md:flex-nowrap"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm md:text-base">
                <Copyright className="w-4 h-4  sm:w-4 sm:h-4" />
                <span>{currentYear} «Tomilo-lib.ru»</span>
              </div>
              <div className="text-xs bg-[var(--accent)] px-2 py-1 rounded border border-[var(--border)] whitespace-nowrap">
                Версия 11012026.084
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Мобильный футер */}
      <div


        className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 max-w-[360px] w-[calc(100%-16px)] sm:w-auto rounded-md bg-[var(--background)]/90 border-t border-[var(--border)] shadow-lg z-50 backdrop-blur-sm lg:hidden transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "translate-y-20"
        }`}
      >
        <Image
          src={SnowCapImageRight}
          alt="Сугроб"
          width={50}
          height={10}
          className="absolute -top-2 -right-0"
        />

        <div className="flex items-center justify-around p-0 rounded-md">
          <Link
            href="/titles"
            className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
            aria-label="Каталог"
          >
            <Library className="w-4 h-4  text-[var(--muted-foreground)]" />
            <span className=" text-sm text-[var(--muted-foreground)]  ">
              Каталог
            </span>
          </Link>
          <Link
            href="/notifications"
            className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
            aria-label="Уведомления"
          >
            <Bell className="w-4 h-4  text-[var(--muted-foreground)]" />
            <span className=" text-sm text-[var(--muted-foreground)]  ">
              Увед.
            </span>
          </Link>

          <Link
            href="/"
            className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
            aria-label="Главная страница"
          >
            <Home className="w-4 h-4  text-[var(--muted-foreground)]" />
            <span className=" text-sm text-[var(--muted-foreground)]  ">
              Главная
            </span>
          </Link>

          <Link
            href="/bookmarks"
            className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
            aria-label="Закладки"
          >
            <Bookmark className="w-4 h-4  text-[var(--muted-foreground)]" />
            <span className=" text-sm text-[var(--muted-foreground)]  ">
              Закладки
            </span>
          </Link>

          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--accent)] transition-all duration-200 active:scale-95"
              aria-label="Меню"
            >
              <MoreVertical className="w-4 h-4  text-[var(--muted-foreground)]" />
              <span className=" text-sm text-[var(--muted-foreground)]  ">
                Меню
              </span>
            </button>

            {/* Выпадающее меню */}
            {isDropdownOpen && (
              <>
                <div className="absolute right-0 bottom-20 mb-3 w-56 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl z-50 backdrop-blur-sm">
                  <div className="py-2">
                    <Link
                      href="/about"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                    >
                      О нас
                    </Link>
                    <Link
                      href="/contact"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                    >
                      Контакты
                    </Link>
                    <Link
                      href="/copyright"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                    >
                      Авторские права
                    </Link>
                    <Link
                      href="/terms-of-use"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2"
                    >
                      Условия использования
                    </Link>
                  </div>
                </div>

                {/* Overlay для закрытия меню */}
                <div className="fixed inset-0 z-40" onClick={closeDropdown} />
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
