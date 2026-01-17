import { Suspense } from "react";
import { Metadata } from "next";
import ResetPasswordContent from "./ResetPasswordContent";
import { Header, Footer } from "@/widgets";
import { BackButton } from "@/shared";

export const metadata: Metadata = {
  title: "Сброс пароля - Tomilo-lib.ru",
  description: "Страница сброса пароля для учетной записи Tomilo-lib.ru",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Suspense fallback={<div>Загрузка...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}