"use client";
import { Footer, Header } from "@/widgets";
import Link from "next/link";
import { LoginModal, RegisterModal } from "@/shared";
import { useEffect, useRef, useState } from "react";
import { ApiResponseDto } from "@/types/api";
import { AuthResponse } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";

export default function AdultContentWarning() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  // Унифицированное закрытие всех модальных окон
  const closeAllModals = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };

  const openRegisterModal = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  const openLoginModal = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  const handleAuthSuccess = (authResponse: ApiResponseDto<AuthResponse>) => {
    login(authResponse);
    closeAllModals();
  };

  return (
    <main className="flex flex-col min-h-screen h-full relative">
      {/* Фон с градиентом */}
      <div className="fixed inset-0 max-h-screen z-0 bg-gradient-to-br from-red-900/20 to-red-800/20"></div>

      {/* Полупрозрачный оверлей для улучшения читаемости */}
      <div className="fixed inset-0 max-h-screen z-10 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>

      {/* Основной контент */}
      <div className="flex flex-col flex-1 relative z-20" ref={dropdownRef}>
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center bg-[var(--background)]/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-8 max-w-md">
              {/* Иконка 18+ */}
              <div className="bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl font-bold">18+</span>
              </div>

              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                Контент для взрослых
              </h1>
              <p className="text-[var(--muted-foreground)] mb-6">
                Этот тайтл содержит контент для взрослых. Для просмотра
                необходимо авторизоваться.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="w-30 h-12 cursor-pointer bg-[var(--chart-1)] text-[var(--primary)] rounded-lg font-medium hover:bg-[var(--chart-5)]/90 transition-colors"
                >
                  Войти
                </button>
                <Link
                  href="/titles"
                  className="w-30 h-12 flex justify-center items-center bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
                >
                  На каталог
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Модальные окна */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={closeAllModals}
        onSwitchToRegister={openRegisterModal}
        onAuthSuccess={handleAuthSuccess}
      />
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={closeAllModals}
        onSwitchToLogin={openLoginModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
