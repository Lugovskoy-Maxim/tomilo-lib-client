"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Footer, Header } from "@/widgets";

function VerifyEmailPageContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Токен подтверждения не найден в URL");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/auth/verify-email?token=${token}`
        );
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Ваш email успешно подтвержден!");
        } else {
          setStatus("error");
          setMessage(data.message || "Ошибка при подтверждении email");
        }
      } catch (error) {
        console.error("Ошибка при подтверждении email:", error);
        setStatus("error");
        setMessage("Произошла ошибка при подтверждении email");
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-8 flex justify-center">
        <div className="w-full max-w-md bg-background border border-border rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Подтверждение Email</h1>
            <p className="text-muted-foreground">
              {status === "loading" && "Проверяем токен подтверждения..."}
              {status === "success" && "Email успешно подтвержден"}
              {status === "error" && "Ошибка подтверждения"}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-center">
              {status === "loading" && "Пожалуйста, подождите..."}
              {(status === "success" || status === "error") && message}
            </p>
          </div>

          {status !== "loading" && (
            <div className="flex flex-col gap-3">
              <Button className="w-full" onClick={handleGoToProfile}>
                Перейти в профиль
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoHome}
              >
                На главную
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
