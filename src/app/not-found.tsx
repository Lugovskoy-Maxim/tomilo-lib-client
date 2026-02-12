"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BG_IMAGE from "../../public/404/error.gif";
import { Footer, Header } from "@/widgets";

export default function NotFound() {
  const router = useRouter();
  usePageTitle("404 — Страница не найдена");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto flex items-center justify-center">
              <Image
                src={BG_IMAGE}
                alt=""
                role="presentation"
                className="w-32 h-32 animate-pulse select-none"
                unoptimized
                priority
              />
            </div>
          </div>

          <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">
            404
          </p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
            Страница не найдена
          </h1>
          <p className="text-[var(--muted-foreground)] mb-10 leading-relaxed">
            Страница, которую вы ищете, не существует, была удалена или перемещена.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              Назад
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
            >
              <Home className="w-5 h-5 shrink-0" />
              На главную
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
