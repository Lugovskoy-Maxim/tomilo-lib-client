"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer, Header } from "@/widgets";
import BG_IMAGE from "../../../public/404/error.png";

export default function ErrorState() {
  usePageTitle("Пользователь не найден");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex min-h-0 flex-1 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4 py-12 sm:py-16">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-8">
            <div className="w-52 h-52 mx-auto flex items-center justify-center">
              <Image
                src={BG_IMAGE}
                alt=""
                role="presentation"
                className="w-52 h-52 select-none"
                unoptimized
                priority
              />
            </div>
          </div>
          <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">
            —
          </p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
            Пользователь не найден
          </h1>
          <p className="text-[var(--muted-foreground)] mb-10 leading-relaxed">
            Не удалось загрузить данные профиля. Профиль может быть скрыт или удалён.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
          >
            <Home className="w-5 h-5 shrink-0" />
            На главную
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
