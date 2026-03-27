"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, ArrowUpCircle, LibraryBig } from "lucide-react";

import { getDecorationImageUrls } from "@/api/shop";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { useGetProfileCardsQuery, useUpgradeProfileCardMutation } from "@/store/api/gamesApi";

import { GameResultReveal } from "./GameResultReveal";

export function CardsCollectionSection() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetProfileCardsQuery();
  const [upgradeCard, { isLoading: isUpgrading }] = useUpgradeProfileCardMutation();
  const [reveal, setReveal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    tone: "default" | "success" | "warning";
  }>({ open: false, title: "", tone: "default" });

  const cards = useMemo(() => data?.data?.cards ?? [], [data?.data?.cards]);
  const stats = data?.data?.stats;

  const featuredCards = useMemo(
    () =>
      [...cards]
        .sort((a, b) => {
          const aReady = Number(Boolean(a.progression.canUpgrade));
          const bReady = Number(Boolean(b.progression.canUpgrade));
          return (
            bReady - aReady ||
            Number(b.progression.nextStage != null) - Number(a.progression.nextStage != null) ||
            (a.characterName ?? "").localeCompare(b.characterName ?? "")
          );
        })
        .slice(0, 8),
    [cards],
  );

  useEffect(() => {
    if (!cards.length) {
      setReveal(prev => (prev.open ? { ...prev, open: false } : prev));
    }
  }, [cards.length]);

  if (isLoading) {
    return <div className="games-empty games-muted">Загрузка коллекции карточек...</div>;
  }

  if (isError) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить коллекцию карточек.</p>
        <button type="button" className="games-btn games-btn-secondary games-btn-sm mt-3" onClick={() => refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="games-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="games-panel-title flex items-center gap-2">
              <LibraryBig className="w-4 h-4 text-[var(--primary)]" aria-hidden />
              Коллекция карточек
            </h3>
            <p className="games-muted text-sm mt-1">
              Следите за этапами F → SSS, копиями и осколками прямо из игрового хаба.
            </p>
          </div>
          <Link href="/profile" className="games-btn games-btn-secondary games-btn-sm">
            Открыть профиль
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="games-badge">Всего: {stats?.total ?? cards.length}</span>
          <span className="games-badge">Уникальных тайтлов: {stats?.uniqueTitles ?? 0}</span>
          <span className="games-badge">Готово к апгрейду: {cards.filter(card => card.progression.canUpgrade).length}</span>
        </div>
      </div>

      {featuredCards.length === 0 ? (
        <div className="games-panel games-empty">
          <p className="games-muted">
            У вас пока нет карточек персонажей. Ищите их в дропах, колодах и наградах.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredCards.map(card => {
            const upgradeBlockedLabel =
              card.progression.upgradeBlockReason === "missing_stage_image"
                ? "Нет картинки следующего этапа"
                : card.progression.upgradeBlockReason === "disciple_level_too_low"
                  ? "Нужен уровень ученика"
                  : card.progression.upgradeBlockReason === "not_enough_coins"
                    ? "Не хватает монет"
                    : card.progression.upgradeBlockReason === "missing_upgrade_materials"
                      ? "Не хватает материалов"
                      : card.progression.nextStage
                        ? "Не готово"
                        : "Максимальный этап";

            return (
              <div key={card.id} className="games-panel space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
                    {card.stageImageUrl ? (
                      <img
                        src={getDecorationImageUrls(card.stageImageUrl).primary}
                        alt={card.characterName || card.name}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[3/4] w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {card.characterName || card.name}
                    </div>
                    <div className="games-muted text-xs mt-0.5">
                      Этап {card.currentStage}
                      {card.progression.nextStage ? ` → ${card.progression.nextStage}` : " · максимум"}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="games-badge">Осколки: {card.shards}</span>
                      <span className="games-badge">Копии: {card.copies}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Статус улучшения</span>
                    <span>{card.progression.canUpgrade ? "Можно улучшить" : upgradeBlockedLabel}</span>
                  </div>
                  {card.progression.nextStageRequiredLevel ? (
                    <div className="games-stat-bar h-2">
                      <div
                        className="games-stat-fill h-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((card.progression.discipleLevel ?? 0) / Math.max(1, card.progression.nextStageRequiredLevel)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                    {card.progression.nextStageRequiredLevel ? (
                      <span className="games-badge">
                        Ученик: {card.progression.discipleLevel}/{card.progression.nextStageRequiredLevel}
                      </span>
                    ) : null}
                    {card.progression.nextStageUpgradeCoins > 0 ? (
                      <span className="games-badge">Монеты: {card.progression.nextStageUpgradeCoins}</span>
                    ) : null}
                    {card.progression.nextStageUpgradeItemId ? (
                      <span className="games-badge">
                        Материал: {card.progression.nextStageUpgradeItemId} ×{card.progression.nextStageUpgradeItemCount}
                      </span>
                    ) : null}
                    {card.progression.nextStageSuccessChance ? (
                      <span className="games-badge">
                        Шанс: {Math.round(card.progression.nextStageSuccessChance * 100)}%
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!card.progression.canUpgrade || isUpgrading}
                  className="games-btn games-btn-primary w-full justify-center"
                  onClick={async () => {
                    try {
                      const result = await upgradeCard(card.id).unwrap();
                      const success = Boolean(result.data?.success);
                      setReveal({
                        open: true,
                        title: success
                          ? `Карточка улучшена до ${result.data?.card?.currentStage ?? card.currentStage}`
                          : "Усиление сорвалось",
                        subtitle: success
                          ? "Новый этап активирован. Проверьте обновлённые бонусы и следующий порог."
                          : "Ресурсы потрачены, но прогресс карточки сохранился для следующих попыток.",
                        tone: success ? "success" : "warning",
                      });
                      toast[success ? "success" : "warning"](
                        success ? "Улучшение прошло успешно" : "Улучшение не удалось",
                      );
                      refetch();
                    } catch (error) {
                      toast.error(getErrorMessage(error, "Не удалось улучшить карточку"));
                    }
                  }}
                >
                  <ArrowUpCircle className="w-4 h-4" aria-hidden />
                  {isUpgrading ? "Усиление..." : card.progression.canUpgrade ? "Усилить карточку" : upgradeBlockedLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <GameResultReveal
        open={reveal.open}
        title={reveal.title}
        subtitle={reveal.subtitle}
        tone={reveal.tone}
        onClose={() => setReveal(prev => ({ ...prev, open: false }))}
      >
        <div className="flex flex-wrap gap-2">
          <span className="games-reward-chip inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Коллекция обновлена
          </span>
        </div>
      </GameResultReveal>
    </div>
  );
}
