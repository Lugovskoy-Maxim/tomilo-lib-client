"use client";

import { useState } from "react";
import { useGetAlchemyRecipesQuery, useGetAlchemyStatusQuery, useAlchemyCraftMutation, useAlchemyUpgradeCauldronMutation } from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { FlaskConical, Sparkles, Coins } from "lucide-react";

import { GameResultReveal } from "./GameResultReveal";

export function AlchemySection() {
  const toast = useToast();
  const { data: recipesData, isLoading: recipesLoading, isError: recipesError } = useGetAlchemyRecipesQuery();
  const { data: statusData } = useGetAlchemyStatusQuery();
  const [craft, { isLoading: isCrafting }] = useAlchemyCraftMutation();
  const [upgradeCauldron, { isLoading: isUpgrading }] = useAlchemyUpgradeCauldronMutation();
  const [reveal, setReveal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    items?: { itemId: string; count: number; name?: string; icon?: string }[];
    rewards?: { exp?: number; coins?: number };
    tone: "success" | "warning";
  }>({ open: false, title: "", tone: "success" });

  const recipes = (recipesData?.data?.recipes ?? []) as Array<{
    _id: string;
    name: string;
    description: string;
    icon: string;
    coinCost: number;
    ingredients: { itemId: string; count: number; have: number; name?: string; icon?: string }[];
    resultType: string;
    resultPreview?: {
      common?: { itemId: string; name?: string; icon?: string };
      quality?: { itemId: string; name?: string; icon?: string };
      legendary?: { itemId: string; name?: string; icon?: string };
    };
    element?: string | null;
    mishapChancePercent?: number;
    effectiveMishapChancePercent?: number;
    canCraft: boolean;
  }>;
  const status = statusData?.data;
  const canCraft = status?.canCraft ?? false;

  const handleCraft = async (recipeId: string) => {
    try {
      const result = await craft(recipeId).unwrap();
      const q = result?.data?.quality;
      const mishap = result?.data?.mishap;
      const items = result?.data?.itemsGained?.length
        ? ` · +${result.data.itemsGained.map(i => `${i.name || i.itemId}×${i.count}`).join(", ")}`
        : "";
      const left = typeof result?.data?.alchemy?.attemptsLeft === "number"
        ? ` · попыток осталось: ${result.data.alchemy.attemptsLeft}`
        : "";
      if (result?.data?.success === false && mishap?.happened) {
        setReveal({
          open: true,
          title: "Котёл сорвался",
          subtitle: "Попытка потрачена, но вы всё равно получили утешительные награды и опыт алхимика.",
          rewards: result?.data?.rewards,
          items: result?.data?.itemsGained,
          tone: "warning",
        });
        toast.error(
          `Котёл сорвался (риск ${mishap.chancePercent ?? "?"}%). ` +
            `Утешение: +${result?.data?.rewards?.exp ?? 0} опыта, +${result?.data?.rewards?.coins ?? 0} монет${left}`,
        );
        return;
      }

      const saved =
        mishap?.happened && mishap?.preventedByStabilizer
          ? " · стабилизатор спас варку"
          : "";

      toast.success(
        q
          ? `Варка: ${q === "legendary" ? "Легендарное" : q === "quality" ? "Улучшенное" : "Обычное"} качество. +${result?.data?.rewards?.exp ?? 0} опыта, +${result?.data?.rewards?.coins ?? 0} монет${items}${saved}${left}`
          : "Варка завершена",
      );
      setReveal({
        open: true,
        title:
          q === "legendary"
            ? "Легендарная варка"
            : q === "quality"
              ? "Улучшенная варка"
              : "Варка завершена",
        subtitle: saved ? "Стабилизатор удержал рецепт и сохранил результат." : "Награды уже начислены в инвентарь и баланс.",
        rewards: result?.data?.rewards,
        items: result?.data?.itemsGained,
        tone: "success",
      });
      (result?.data?.itemsGained ?? []).forEach((item) => {
        const label = item.name || item.itemId;
        toast.success(`Получено: ${label} ×${item.count}`, 5000, { icon: item.icon });
      });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось сварить пилюлю"));
    }
  };

  if (recipesLoading && !recipesData) {
    return <div className="games-empty games-muted">Загрузка рецептов...</div>;
  }

  if (recipesError) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить рецепты алхимии. Проверьте сеть и обновите страницу.</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="games-panel games-empty">
        <FlaskConical className="games-empty-icon mx-auto block" />
        <p className="games-muted">Пока нет доступных рецептов.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status && (
        <div className="games-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="games-muted text-sm">
              Алхимик: <strong className="text-[var(--foreground)]">ур. {status.alchemyLevel}</strong>{" "}
              <span className="games-muted text-xs">({status.alchemyExp}/{status.alchemyExpToNext})</span>
              {status.element ? (
                <span className="games-muted text-xs"> · стихия: <strong className="text-[var(--foreground)]">{status.element}</strong></span>
              ) : null}
            </div>
            <div className="games-muted text-sm">
              Попытки: <strong className="text-[var(--foreground)]">{status.attemptsLeft}</strong> / {status.craftsPerDay}
            </div>
          </div>
          <div className="games-stat-bar w-full h-2 mt-3">
            <div
              className="games-stat-fill h-full"
              style={{ width: `${Math.min(100, (status.alchemyExp / (status.alchemyExpToNext || 1)) * 100)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <div className="games-muted text-sm">
              Котёл: <strong className="text-[var(--foreground)]">T{status.cauldronTier}</strong>
              {" · "}Стабилизатор: <strong className="text-[var(--foreground)]">{status.stabilizers?.count ?? 0}</strong>
            </div>
            {status.resetAt ? (
              <div className="games-muted text-xs">
                Сброс попыток: <strong className="text-[var(--foreground)]">{status.resetAt}</strong>
              </div>
            ) : null}
            <button
              type="button"
              disabled={!status.cauldronUpgrade?.canUpgrade || isUpgrading}
              className="games-btn games-btn-secondary games-btn-sm"
              onClick={async () => {
                try {
                  const res = await upgradeCauldron().unwrap();
                  toast.success(`Котёл улучшен до T${res.data.tier}`);
                } catch (e: unknown) {
                  toast.error(getErrorMessage(e, "Не удалось улучшить котёл"));
                }
              }}
              title={status.cauldronUpgrade ? `${status.cauldronUpgrade.fragmentItemId}: ${status.cauldronUpgrade.have}/${status.cauldronUpgrade.need}` : undefined}
            >
              Улучшить котёл ({status.cauldronUpgrade?.have ?? 0}/{status.cauldronUpgrade?.need ?? 0})
            </button>
          </div>
        </div>
      )}

      {!canCraft && (
        <div className="games-panel border-[var(--border)] bg-[var(--accent)]">
          <p className="games-muted text-sm">🧪 Сегодня лимит варок исчерпан. Завтра можно снова.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {recipes.map((r) => (
          <div key={r._id} className="games-recipe flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="games-recipe-name">{r.name}</h3>
              {r.description && <p className="games-muted mt-0.5 text-sm">{r.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {typeof r.effectiveMishapChancePercent === "number" && (
                  <span className="games-reward-chip">Риск котла: {r.effectiveMishapChancePercent}%</span>
                )}
                {r.element && <span className="games-reward-chip">Стихия: {r.element}</span>}
              </div>
              <p className="games-muted mt-2 text-xs">
                Ингредиенты: {r.ingredients.map((i) => `${i.name || i.itemId} ×${i.count} (есть ${i.have})`).join(", ")}
              </p>
              {r.coinCost > 0 && <p className="games-muted text-xs mt-0.5">Монет: {r.coinCost}</p>}
              {r.resultPreview ? (
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  {r.resultPreview.common?.itemId ? (
                    <span className="games-badge">
                      Обычн.: {r.resultPreview.common.name || r.resultPreview.common.itemId}
                    </span>
                  ) : null}
                  {r.resultPreview.quality?.itemId ? (
                    <span className="games-badge">
                      Улучш.: {r.resultPreview.quality.name || r.resultPreview.quality.itemId}
                    </span>
                  ) : null}
                  {r.resultPreview.legendary?.itemId ? (
                    <span className="games-badge">
                      Легенд.: {r.resultPreview.legendary.name || r.resultPreview.legendary.itemId}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => handleCraft(r._id)}
              disabled={!r.canCraft || !canCraft || isCrafting}
              className="games-btn games-btn-primary shrink-0"
            >
              {isCrafting ? "..." : "Варить"}
            </button>
          </div>
        ))}
      </div>
      <GameResultReveal
        open={reveal.open}
        title={reveal.title}
        subtitle={reveal.subtitle}
        tone={reveal.tone}
        onClose={() => setReveal(prev => ({ ...prev, open: false }))}
      >
        <div className="flex flex-wrap gap-2">
          {reveal.rewards?.coins ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" aria-hidden />
              +{reveal.rewards.coins} монет
            </span>
          ) : null}
          {reveal.rewards?.exp ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              +{reveal.rewards.exp} опыта
            </span>
          ) : null}
          {reveal.items?.map(item => (
            <span key={`${item.itemId}-${item.count}`} className="games-reward-chip inline-flex items-center gap-1">
              {item.icon ? <img src={item.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
              {item.name || item.itemId} ×{item.count}
            </span>
          ))}
        </div>
      </GameResultReveal>
    </div>
  );
}
