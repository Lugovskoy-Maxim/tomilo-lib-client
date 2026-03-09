"use client";

import { UserProfile } from "@/types/user";
import { Crown, Check, Sparkles, BookOpen, BadgeCheck } from "lucide-react";
import { isPremiumActive, formatSubscriptionEnd } from "@/lib/premium";

interface ProfilePremiumSettingsProps {
  userProfile: UserProfile;
  /** Встроенный вид: без карточки, только контент */
  embedded?: boolean;
}

const PREMIUM_BENEFITS = [
  { icon: BookOpen, text: "Доступ ко всем платным главам по подписке" },
  { icon: Sparkles, text: "Скидки в магазине для подписчиков" },
  { icon: BadgeCheck, text: "Премиум-значок в профиле" },
];

export default function ProfilePremiumSettings({
  userProfile,
  embedded,
}: ProfilePremiumSettingsProps) {
  const expiresAt = userProfile.subscriptionExpiresAt ?? null;
  const active = isPremiumActive(expiresAt);
  const formattedEnd = formatSubscriptionEnd(expiresAt);

  const inner = (
    <>
      {/* Статус */}
      <div
        className={`rounded-lg border p-3 mb-4 ${
          active
            ? "bg-amber-500/10 border-amber-500/30 text-[var(--foreground)]"
            : "bg-[var(--secondary)]/50 border-[var(--border)] text-[var(--muted-foreground)]"
        }`}
      >
        <div className="flex items-center gap-2">
          {active ? (
            <Check className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Crown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          )}
          <span className="text-sm font-medium">
            {active ? `Подписка активна до ${formattedEnd}` : "У вас нет активной премиум-подписки"}
          </span>
        </div>
      </div>

      {/* Преимущества */}
      <div className="mb-4">
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
          Что даёт премиум
        </p>
        <ul className="space-y-2">
          {PREMIUM_BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <Icon className="w-4 h-4 text-amber-500/80 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Заглушка оплаты */}
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)]/30 p-4 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">Оплата подписки — в разработке</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Скоро здесь можно будет оформить или продлить премиум
        </p>
      </div>
    </>
  );

  if (embedded) return inner;

  return (
    <div
      id="settings-premium"
      className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Премиум-подписка</h2>
            <p className="text-[var(--muted-foreground)] text-xs">Статус подписки и преимущества</p>
          </div>
        </div>
      </div>
      {inner}
    </div>
  );
}
