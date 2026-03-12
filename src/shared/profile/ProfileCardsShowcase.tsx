"use client";

import type { UserProfile } from "@/types/user";
import { getDecorationImageUrls } from "@/api/shop";

interface ProfileCardsShowcaseProps {
  userProfile: UserProfile;
  readOnly?: boolean;
}

export default function ProfileCardsShowcase({
  userProfile,
  readOnly = true,
}: ProfileCardsShowcaseProps) {
  const cards = userProfile.profileCardsShowcase ?? [];
  const sortLabel =
    userProfile.profileCardsShowcaseSort === "rarity"
      ? "По редкости"
      : userProfile.profileCardsShowcaseSort === "favorites"
        ? "По любимым"
        : userProfile.profileCardsShowcaseSort === "last_upgraded"
          ? "По последнему апгрейду"
          : "Вручную";
  if (cards.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {readOnly ? "Витрина карточек" : "Мои карточки на витрине"}
        </h3>
        <div className="text-right">
          <p className="text-xs text-[var(--muted-foreground)]">
            Карточки персонажей, которые пользователь решил показать в профиле.
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
            Сортировка: {sortLabel}
          </p>
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[var(--muted)] mb-2">
              {card.stageImageUrl ? (
                <img
                  src={getDecorationImageUrls(card.stageImageUrl).primary}
                  alt={card.characterName || card.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">
              {card.characterName || card.name}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] truncate">
              {card.titleName || "Без тайтла"}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              Ранг {card.currentStage}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
              {card.isFavorite ? (
                <span className="px-1.5 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                  Любимый
                </span>
              ) : null}
              {card.lastUpgradedAt ? (
                <span className="px-1.5 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
                  {new Date(card.lastUpgradedAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
