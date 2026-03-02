"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header, Footer } from "@/widgets";
import { LoginModal, RegisterModal } from "@/shared";
import { useRedeemPromoCodeMutation, useLazyCheckPromoCodeQuery } from "@/store/api/promocodesApi";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Ticket, Coins, Crown, Palette, CheckCircle2, Loader2, Sparkles, LogIn } from "lucide-react";
import type { PromoCodeReward } from "@/types/promocode";
import type { ApiResponseDto } from "@/types/api";
import type { AuthResponse } from "@/types/auth";

function PromoPageContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isAuthenticated, login } = useAuth();
  
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [previewRewards, setPreviewRewards] = useState<PromoCodeReward[] | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [grantedRewards, setGrantedRewards] = useState<PromoCodeReward[] | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const [checkPromoCode] = useLazyCheckPromoCodeQuery();
  const [redeemPromoCode, { isLoading: isRedeeming }] = useRedeemPromoCodeMutation();

  const handleLoginModalOpen = () => setLoginModalOpen(true);
  const handleLoginModalClose = () => setLoginModalOpen(false);
  const handleRegisterModalClose = () => setRegisterModalOpen(false);
  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };
  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };
  const handleAuthSuccess = (authResponse: ApiResponseDto<AuthResponse>) => {
    login(authResponse);
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
    toast.success("Вы успешно вошли! Теперь можете активировать промокод.");
  };

  useSEO({
    title: "Активировать промокод - Tomilo-lib.ru",
    description: "Активируйте промокод и получите награды: монеты, декорации или премиум.",
    keywords: "промокод, активация, награды, монеты, декорации, премиум",
  });

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleCheckCode = async () => {
    if (!code.trim()) return;
    
    if (!isAuthenticated) {
      toast.error("Для проверки промокода необходимо войти в аккаунт");
      handleLoginModalOpen();
      return;
    }
    
    setIsChecking(true);
    setPreviewRewards(null);
    
    try {
      const result = await checkPromoCode(code.trim().toUpperCase()).unwrap();
      if (result.valid && result.rewards) {
        setPreviewRewards(result.rewards);
      } else {
        toast.error(result.message ?? "Промокод недействителен");
      }
    } catch {
      toast.error("Не удалось проверить промокод");
    } finally {
      setIsChecking(false);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) return;
    
    if (!isAuthenticated) {
      toast.error("Для активации промокода необходимо войти в аккаунт");
      handleLoginModalOpen();
      return;
    }

    try {
      const result = await redeemPromoCode({ code: code.trim().toUpperCase() }).unwrap();
      if (result.success) {
        setRedeemSuccess(true);
        setGrantedRewards(result.rewards ?? null);
        setNewBalance(result.newBalance ?? null);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка активации")
          : "Ошибка активации";
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setCode("");
    setPreviewRewards(null);
    setRedeemSuccess(false);
    setGrantedRewards(null);
    setNewBalance(null);
  };

  const getRewardIcon = (type: PromoCodeReward["type"]) => {
    switch (type) {
      case "balance":
        return <Coins className="w-6 h-6 text-amber-500" />;
      case "premium":
        return <Crown className="w-6 h-6 text-purple-500" />;
      case "decoration":
        return <Palette className="w-6 h-6 text-pink-500" />;
      default:
        return <Gift className="w-6 h-6 text-[var(--primary)]" />;
    }
  };

  const formatReward = (reward: PromoCodeReward) => {
    switch (reward.type) {
      case "balance":
        return `${reward.amount} монет`;
      case "premium":
        return `${reward.amount} дней премиума`;
      case "decoration":
        return reward.displayName ?? "Декорация";
      default:
        return "Награда";
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Header />

      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--secondary)]/60 to-[var(--background)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[var(--chart-1)]/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6 border border-[var(--primary)]/20">
              <Ticket className="w-4 h-4" />
              Промокоды
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)] tracking-tight mb-4">
              Активировать промокод
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed">
              Введите промокод, чтобы получить монеты, декорации или премиум-статус
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-12 sm:px-6">
        {!isAuthenticated && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
            <LogIn className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[var(--foreground)]">
                Для активации промокода необходимо{" "}
                <button
                  type="button"
                  onClick={handleLoginModalOpen}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  войти в аккаунт
                </button>
              </p>
            </div>
          </div>
        )}

        {redeemSuccess ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Промокод активирован!
            </h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              Вы получили следующие награды:
            </p>

            {grantedRewards && grantedRewards.length > 0 && (
              <div className="space-y-3 mb-6">
                {grantedRewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)]"
                  >
                    {getRewardIcon(reward.type)}
                    <span className="font-medium text-[var(--foreground)]">
                      {formatReward(reward)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {newBalance !== null && (
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Ваш новый баланс: <span className="font-semibold text-amber-500">{newBalance} монет</span>
              </p>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Ticket className="w-4 h-4" />
              Активировать ещё один
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Gift className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Введите промокод
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Код
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.toUpperCase());
                    setPreviewRewards(null);
                  }}
                  placeholder="Например: WELCOME2024"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-mono text-lg uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--muted-foreground)] placeholder:font-sans placeholder:text-base placeholder:normal-case"
                  onKeyDown={e => {
                    if (e.key === "Enter" && code.trim()) {
                      if (previewRewards) {
                        handleRedeem();
                      } else {
                        handleCheckCode();
                      }
                    }
                  }}
                />
              </div>

              {previewRewards && previewRewards.length > 0 && (
                <div className="rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)] p-4">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                    Вы получите:
                  </p>
                  <div className="space-y-2">
                    {previewRewards.map((reward, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {getRewardIcon(reward.type)}
                        <span className="text-[var(--foreground)]">{formatReward(reward)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!previewRewards ? (
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={!code.trim() || isChecking}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        Проверить код
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl text-sm font-medium bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Активация...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          Активировать
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Где получить промокоды?
          </h3>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Следите за нашими анонсами и новостями</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Участвуйте в конкурсах и розыгрышах</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Подписывайтесь на наш Telegram-канал</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Промокоды могут приходить в email-рассылках</span>
            </li>
          </ul>
        </div>
      </div>

      <Footer />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleLoginModalClose}
        onSwitchToRegister={handleSwitchToRegister}
        onAuthSuccess={handleAuthSuccess}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={handleRegisterModalClose}
        onSwitchToLogin={handleSwitchToLogin}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}

export default function PromoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </main>
    }>
      <PromoPageContent />
    </Suspense>
  );
}
