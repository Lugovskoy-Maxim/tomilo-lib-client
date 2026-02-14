"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { BackButton } from "@/shared";
import { Footer, Header } from "@/widgets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function VerifyEmailPageContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verifyEmail = useCallback(
    async (retry = false) => {
      if (!token) return;
      if (retry) setIsRetrying(true);

      try {
        const response = await fetch(
          `${API_BASE}/auth/verify-email?token=${token}`,
        );
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Ваш email успешно подтверждён!");
        } else {
          setStatus("error");
          setMessage(data.message || "Ошибка при подтверждении email");
        }
      } catch (err) {
        console.error("Ошибка при подтверждении email:", err);
        setStatus("error");
        setMessage(
          "Произошла ошибка при подтверждении email. Проверьте подключение к интернету.",
        );
      } finally {
        setIsRetrying(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "Токен подтверждения не найден в ссылке. Проверьте корректность ссылки из письма.",
      );
      return;
    }
    verifyEmail(false);
  }, [token, verifyEmail]);

  const handleRetry = () => {
    setStatus("loading");
    verifyEmail(true);
  };

  const handleGoProfile = () => router.push("/profile");
  const handleGoHome = () => router.push("/");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="mb-6">
            <BackButton text="Назад" />
          </div>

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            {/* Loading state */}
            {status === "loading" && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--chart-1)]/10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[var(--chart-1)] animate-spin" />
                  </div>
                </div>
                <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Подтверждение email
                </h1>
                <p className="text-[var(--muted-foreground)]">
                  Проверяем токен подтверждения, подождите...
                </p>
              </div>
            )}

            {/* Success state */}
            {status === "success" && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Email подтверждён
                </h1>
                <p className="text-[var(--muted-foreground)] mb-6">{message}</p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGoProfile}
                    className="w-full cursor-pointer border-2 border-[var(--border)] rounded-full bg-[var(--chart-1)] text-[var(--primary)] hover:bg-[var(--chart-1)]/80 transition-all duration-300"
                  >
                    Перейти в профиль
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="w-full rounded-full"
                  >
                    На главную
                  </Button>
                </div>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Ошибка подтверждения
                </h1>
                <p className="text-[var(--muted-foreground)] mb-6">{message}</p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full cursor-pointer border-2 border-[var(--border)] rounded-full bg-[var(--chart-1)] text-[var(--primary)] hover:bg-[var(--chart-1)]/80 transition-all duration-300 disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Проверка...
                      </span>
                    ) : (
                      "Попробовать снова"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoProfile}
                    className="w-full rounded-full"
                  >
                    Перейти в профиль (повторная отправка письма)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="w-full rounded-full"
                  >
                    На главную
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[var(--chart-1)] animate-spin" />
              <p className="text-[var(--muted-foreground)]">Загрузка...</p>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
