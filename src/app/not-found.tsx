"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BG_IMAGE from "../../public/404/error.gif";
import { Footer, Header } from "@/widgets";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center">
        {" "}
        <div className="max-w-md w-max text-center">
          {/* Анимированная иконка */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto flex items-center justify-center">
              <Image
                src={BG_IMAGE}
                alt="404"
                className="w-32 h-32 animate-pulse"
                unoptimized
              />
            </div>
          </div>

          {/* Текст */}
          <h1 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
            Страница не найдена
          </h1>

          <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
            Страница, которую вы ищете, не существует или была удалена.
          </p>

          {/* Кнопка назад */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--primary)] text-[var(--secondary)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться назад
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
