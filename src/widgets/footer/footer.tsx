"use client";
import { Logo } from "@/shared";
import Link from "next/link";
import { Mail, Copyright } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[var(--secondary)]/40 border-t border-[var(--border)] mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8">
        {/* Основной контент футера */}
        <div className="flex flex-col items-center text-center space-y-6 mb-6
                      md:flex-row md:items-start md:justify-between md:text-left md:space-y-0 md:space-x-8">

          {/* Логотип и описание */}
          <div className="flex flex-col items-center space-y-3 md:items-start md:max-w-sm lg:max-w-xs">
            <Logo />
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed md:text-base">
              TOMILO-LIB — Современная платформа для чтения маньхуя и комиксов
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
              href="mailto:lugovskou.myu@ya.ru"
              className="flex items-center gap-2 text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors text-sm break-words px-2 py-1 text-center md:text-right"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="max-w-[180px] sm:max-w-[250px] md:max-w-none">lugovskou.myu@ya.ru</span>
            </Link>
          </div>
        </div>

        {/* Разделительная линия */}
        <div className="border-t border-[var(--border)] my-4 md:my-6" />

        {/* Нижняя часть футера */}
        <div className="flex flex-col items-center space-y-4 text-[var(--muted-foreground)] text-sm
                      md:flex-row md:justify-between md:space-y-0 md:items-center">

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
          <div className="flex flex-col items-center space-y-2
                        sm:flex-row sm:space-y-0 sm:space-x-4
                        md:space-x-6 md:flex-nowrap">
            <div className="flex items-center gap-1 text-xs sm:text-sm md:text-base">
              <Copyright className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{currentYear} «Tomilo-lib.ru»</span>
            </div>
            <div className="text-xs bg-[var(--accent)] px-2 py-1 rounded border border-[var(--border)] whitespace-nowrap">
              Версия 111125
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
