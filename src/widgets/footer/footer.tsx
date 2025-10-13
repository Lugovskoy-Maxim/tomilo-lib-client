"use client";
import { Logo } from "@/shared";
import Link from "next/link";
import { Mail, Copyright } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[var(--secondary)] border-t border-[var(--border)] mt-auto h-[var(--footer-height)]">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Основной контент футера */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
          {/* Логотип и описание */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <Logo />
            <p className="text-[var(--muted-foreground)] text-sm text-center lg:text-left max-w-md">
              TOMILO-LIB — Современная платформа для чтения маньхуя и комиксов
            </p>
          </div>

          {/* Контактная информация */}
          <div className="flex flex-col items-center lg:items-end gap-3">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
              <span>В случаях нарушения авторских прав - обращайтесь на почту:</span>
            </div>
            <Link 
              href="mailto:contact@senkuro.org"
              className="flex items-center gap-2 text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>lugovskou.myu@ya.ru</span>
            </Link>
          </div>
        </div>

        {/* Разделительная линия */}
        <div className="border-t border-[var(--border)] my-4" />

        {/* Нижняя часть футера */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-[var(--muted-foreground)] text-sm">
          {/* Левая часть - навигационные ссылки */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
            <Link 
              href="/terms-of-use" 
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Пользовательское соглашение
            </Link>
            <Link 
              href="/copyright" 
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Авторское право (DMCA)
            </Link>
            <Link 
              href="/updates" 
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Лента новых глав
            </Link>
          </div>

          {/* Правая часть - копирайт и версия */}
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-1">
              <Copyright className="w-4 h-4" />
              <span>{currentYear} «Tomilo-lib»</span>
            </div>
            <div className="text-xs bg-[var(--accent)] px-2 py-1 rounded border border-[var(--border)]">
              Версия 0.1
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}