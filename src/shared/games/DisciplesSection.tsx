"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  useGetProfileDisciplesQuery,
  useGetProfileCardsQuery,
  useGetProfileInventoryQuery,
  useDisciplesRerollMutation,
  useDisciplesRecruitMutation,
  useDisciplesDismissMutation,
  useDisciplesTrainMutation,
  useLazyDisciplesBattleMatchQuery,
  useDisciplesBattleMutation,
  useLazyDisciplesWeeklyBattleMatchQuery,
  useDisciplesWeeklyBattleMutation,
  useGetDisciplesWeeklyLeaderboardQuery,
  useGetDiscipleTechniquesQuery,
  useDisciplesLearnTechniqueMutation,
  useDisciplesEquipTechniquesMutation,
  useGetDisciplesExpeditionStatusQuery,
  useDisciplesStartExpeditionMutation,
  useUpgradeProfileCardMutation,
} from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { getCoverUrls } from "@/lib/asset-url";
import { getDecorationImageUrls } from "@/api/shop";
import type { Disciple, DiscipleTechniquesEntry, InventoryEntry } from "@/types/games";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import { Users, Swords, RefreshCw, UserMinus, Zap, Coins, CalendarDays, Crown, Trophy, Shield, Footprints, Heart } from "lucide-react";
import { Compass } from "lucide-react";

/** Тип ответа экспедиции (inProgress, lastResult, completesAt и т.д.) */
interface ExpeditionStatusData {
  inProgress?: boolean;
  completesAt?: string;
  nextExpeditionAt?: string;
  canStart?: boolean;
  balance?: number;
  ambushRiskPercent?: number | null;
  hasDisciples?: boolean;
  costs?: Record<string, number>;
  lastResult?: {
    at?: string;
    success?: boolean;
    difficulty?: string;
    coinsGained?: number;
    expGained?: number;
    log?: string[];
    ambush?: { happened?: boolean; preventedByTalisman?: boolean };
    itemsGained?: Array<{ itemId: string; count: number; name?: string; icon?: string }>;
  };
}
/** Элемент лога боя */
interface BattleLogEntry {
  action?: string;
  turn?: number;
  actor?: string;
  techniqueName?: string;
  itemId?: string;
  value?: number;
  absorbed?: number;
  items?: Array<{ itemId: string; name?: string }>;
}
/** Результат боя (battleLog, userCard, opponentCard и др.) */
interface BattleResultState {
  battleLog?: BattleLogEntry[];
  userCard?: { mediaUrl?: string };
  opponentCard?: { mediaUrl?: string };
  [key: string]: unknown;
}

/** Общий аватар ученика/кандидата — один источник (getCoverUrls) и один плейсхолдер */
function DiscipleAvatar({
  avatarPath,
  showImage,
  onError,
  size = "lg",
}: {
  avatarPath: string;
  showImage: boolean;
  onError: () => void;
  size?: "lg";
}) {
  const url = avatarPath ? getCoverUrls(avatarPath, "").primary : "";
  const show = url && showImage;
  const sizeClass = size === "lg" ? "games-card-avatar games-card-avatar--lg" : "games-card-avatar";
  if (show) {
    return (
      <img
        src={url}
        alt=""
        className={`${sizeClass} object-cover`}
        onError={onError}
      />
    );
  }
  return (
    <div className={`${sizeClass} flex items-center justify-center`}>
      <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--muted-foreground)]" aria-hidden />
    </div>
  );
}

const TECHNIQUE_TYPE_LABELS: Record<string, string> = {
  attack: "атака",
  movement: "движение",
  heal: "лечение",
  buff: "усиление",
  debuff: "ослабление",
  ultimate: "ультимейт",
};

const BATTLE_ACTION_LABELS: Record<string, string> = {
  damage: "урон",
  heal: "лечение",
  item_damage: "урон предметом",
  item_heal: "лечение предметом",
  item_revive: "воскрешение",
};

const BATTLE_SUPPORT_ITEMS = [
  { id: "healing_pill", label: "Пилюля исцеления", description: "Авто-лечение при просадке HP" },
  { id: "basic_talisman", label: "Базовый талисман", description: "Небольшой одноразовый щит" },
  { id: "defense_talisman", label: "Талисман защиты", description: "Поглощает часть входящего урона" },
  { id: "heavenly_thunder_talisman", label: "Талисман небесной грозы", description: "Наносит стартовый урон врагу" },
  { id: "resurrection_fragment", label: "Осколок воскрешения", description: "Разово поднимает бойца после поражения" },
] as const;

function formatCountdown(untilMs: number): string {
  const left = Math.max(0, Math.floor((untilMs - Date.now()) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0 || h > 0) parts.push(`${m} мин`);
  parts.push(`${s} сек`);
  return parts.join(" ");
}

/** Отображает число стата без лишних знаков после запятой (CP и др.) */
function formatStat(value: number | null | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.?0+$/, "");
}

function getItemLabel(itemId: string, inventoryById: Map<string, InventoryEntry>): string {
  return inventoryById.get(itemId)?.name || GAME_ITEMS_LORE.find((entry) => entry.id === itemId)?.name || itemId;
}

export function DisciplesSection() {
  const toast = useToast();
  const { data, isLoading, isError: isProfileError, refetch: refetchDisciples } = useGetProfileDisciplesQuery();
  const { data: profileCardsData, refetch: refetchCards } = useGetProfileCardsQuery();
  const { data: inventoryData } = useGetProfileInventoryQuery();
  const [reroll, { isLoading: isRerolling }] = useDisciplesRerollMutation();
  const [recruit, { isLoading: isRecruiting }] = useDisciplesRecruitMutation();
  const [dismiss] = useDisciplesDismissMutation();
  const [train, { isLoading: isTraining }] = useDisciplesTrainMutation();
  const [battle, { isLoading: isBattling }] = useDisciplesBattleMutation();
  const [weeklyBattle, { isLoading: isWeeklyBattling }] = useDisciplesWeeklyBattleMutation();
  const { data: techniquesData } = useGetDiscipleTechniquesQuery();
  const [learnTechnique, { isLoading: isLearning }] = useDisciplesLearnTechniqueMutation();
  const [equipTechniques, { isLoading: isEquipping }] = useDisciplesEquipTechniquesMutation();
  const { data: expeditionStatusData, isLoading: expeditionLoading, isError: expeditionStatusError, refetch: refetchExpedition } = useGetDisciplesExpeditionStatusQuery();
  const [startExpedition, { isLoading: isStartingExpedition }] = useDisciplesStartExpeditionMutation();
  const [upgradeProfileCard, { isLoading: isUpgradingCard }] = useUpgradeProfileCardMutation();
  const lastShownExpeditionResultAt = useRef<string | null>(null);
  const expeditionData = expeditionStatusData?.data as ExpeditionStatusData | undefined;
  const inProgress = expeditionData?.inProgress ?? false;
  const [, setCountdownNow] = useState(() => Date.now());
  const expeditionTargetMs =
    expeditionData?.inProgress && expeditionData?.completesAt
      ? new Date(expeditionData.completesAt).getTime()
      : !expeditionData?.canStart && expeditionData?.nextExpeditionAt
        ? new Date(expeditionData.nextExpeditionAt).getTime()
        : null;
  useEffect(() => {
    if (!expeditionTargetMs) return;
    const id = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expeditionTargetMs]);
  useEffect(() => {
    if (!inProgress) return;
    const id = setInterval(() => refetchExpedition(), 5000);
    return () => clearInterval(id);
  }, [inProgress, refetchExpedition]);

  // Показать тосты при появлении результата экспедиции (после завершения по таймеру)
  useEffect(() => {
    const res = expeditionData;
    if (!res?.lastResult || res.inProgress) return;
    const resultAt = res.lastResult.at;
    if (!resultAt || lastShownExpeditionResultAt.current === resultAt) return;
    lastShownExpeditionResultAt.current = resultAt;
    const payload = res.lastResult;
    const ambush = (payload as { ambush?: { happened?: boolean; preventedByTalisman?: boolean } }).ambush;
    if (ambush?.happened) {
      if (ambush.preventedByTalisman) {
        toast.success("Экспедиция успешна! Засада отражена талисманом. +" + payload.coinsGained + " монет, +" + payload.expGained + " опыта");
      } else {
        toast.warning("Засада! Часть добычи потеряна. +" + payload.coinsGained + " монет, +" + payload.expGained + " опыта");
      }
    } else {
      toast.success(
        (payload.success ? "Экспедиция успешна! " : "Провал... ") +
          `+${payload.coinsGained ?? 0} монет, +${payload.expGained ?? 0} опыта`,
      );
    }
    (payload.itemsGained ?? []).forEach((item: { itemId: string; count: number; name?: string; icon?: string }) => {
      const label = item.name || item.itemId;
      toast.success(`Найдено: ${label} ×${item.count}`, 5000, { icon: item.icon });
    });
  }, [expeditionData?.lastResult, expeditionData?.inProgress, toast]);

  const [candidate, setCandidate] = useState<{ characterId: string; titleId: string; name: string; avatar?: string; titleName?: string; attack: number; defense: number; speed: number; hp: number } | null>(null);
  /** Истекает через 10 мин после призыва (сервер тоже сбрасывает кандидата через 10 мин) */
  const [candidateExpiresAt, setCandidateExpiresAt] = useState<number | null>(null);
  const [triggerMatch, { isLoading: findingMatch }] = useLazyDisciplesBattleMatchQuery();
  const [opponent, setOpponent] = useState<{ userId: string; username: string; combatRating: number } | null>(null);
  const [triggerWeeklyMatch, { isLoading: findingWeeklyMatch }] = useLazyDisciplesWeeklyBattleMatchQuery();
  const [weeklyOpponent, setWeeklyOpponent] = useState<{ userId: string; username: string; weeklyRating?: number } | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResultState | null>(null);
  const [selectedSupportItems, setSelectedSupportItems] = useState<string[]>([]);
  const [selectedWeeklySupportItems, setSelectedWeeklySupportItems] = useState<string[]>([]);
  const [candidateAvatarError, setCandidateAvatarError] = useState(false);
  const [failedCardMediaIds, setFailedCardMediaIds] = useState<Set<string>>(new Set());
  const [failedDiscipleAvatarIds, setFailedDiscipleAvatarIds] = useState<Set<string>>(new Set());
  const [battleCardErrors, setBattleCardErrors] = useState({ user: false, opponent: false });

  const res = data?.data;
  const disciples = (res?.disciples ?? []) as Disciple[];
  const profileCards = profileCardsData?.data?.cards ?? [];
  const inventory = (inventoryData?.data ?? []) as InventoryEntry[];
  const inventoryById = new Map(inventory.map((entry) => [entry.itemId, entry]));
  const cardsSummary = useMemo(
    () => ({
      total: profileCards.length,
      upgradeReady: profileCards.filter((card) => card.progression.canUpgrade).length,
      missing: disciples.filter(
        (disciple) =>
          !profileCards.some((card) => card.characterId === disciple.characterId),
      ).length,
    }),
    [disciples, profileCards],
  );
  const weekly = res?.weekly;
  const { data: leaderboardData } = useGetDisciplesWeeklyLeaderboardQuery(
    weekly ? { limit: 10 } : { limit: 0 },
    { skip: !weekly },
  );
  const leaderboard = leaderboardData?.data ?? [];
  const candidateValid = candidate && (candidateExpiresAt == null || Date.now() <= candidateExpiresAt);
  const lastReroll = candidateValid ? candidate : (res?.lastRerollCandidate ?? null);
  const canReroll = (res?.balance ?? 0) >= (res?.rerollCostCoins ?? 50);
  const expeditionTalismanCount = inventoryById.get("expedition_talisman")?.count ?? 0;

  const toggleSupportItem = (itemId: string, mode: "normal" | "weekly") => {
    const setter = mode === "normal" ? setSelectedSupportItems : setSelectedWeeklySupportItems;
    setter((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId].slice(0, 3));
  };

  useEffect(() => {
    if (candidateExpiresAt == null || !candidate) return;
    const msLeft = candidateExpiresAt - Date.now();
    if (msLeft <= 0) {
      setCandidate(null);
      setCandidateExpiresAt(null);
      refetchDisciples();
      return;
    }
    const t = setTimeout(() => {
      setCandidate(null);
      setCandidateExpiresAt(null);
      refetchDisciples();
    }, msLeft);
    return () => clearTimeout(t);
  }, [candidate, candidateExpiresAt, refetchDisciples]);
  const showCandidateAvatar = !candidateAvatarError;

  useEffect(() => {
    setCandidateAvatarError(false);
  }, [lastReroll?.characterId, lastReroll?.avatar]);

  useEffect(() => {
    setBattleCardErrors({ user: false, opponent: false });
  }, [battleResult?.userCard?.mediaUrl, battleResult?.opponentCard?.mediaUrl]);

  const CANDIDATE_TTL_MS = 10 * 60 * 1000;

  const handleReroll = async () => {
    try {
      const result = await reroll().unwrap();
      if (result?.data?.candidate) {
        setCandidate(result.data.candidate);
        setCandidateExpiresAt(Date.now() + CANDIDATE_TTL_MS);
      }
      toast.success(result?.data?.candidate?.name ? `Призыв: ${result.data.candidate.name}` : "Призыв выполнен");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось призвать"));
    }
  };

  const handleRecruit = async (characterId: string) => {
    try {
      await recruit(characterId).unwrap();
      setCandidate(null);
      setCandidateExpiresAt(null);
      toast.success("Ученик в команде!");
    } catch (e: unknown) {
      refetchDisciples();
      const msg = getErrorMessage(e, "Не удалось принять ученика");
      const isExpired =
        typeof msg === "string" &&
        (msg.toLowerCase().includes("устар") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("timeout"));
      toast.error(isExpired ? "Кандидат устарел. Призовите нового." : msg);
    }
  };

  const handleDismiss = async (characterId: string) => {
    try {
      await dismiss(characterId).unwrap();
      toast.success("Ученик отпущен");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось отпустить"));
    }
  };

  const handleTrain = async (characterId: string) => {
    try {
      const res = await train(characterId).unwrap();
      const outcome = res?.data?.outcome;
      toast.success(outcome === "fail" ? "Тренировка сорвалась: прогресса нет, но опыт получен" : "Тренировка завершена");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось потренировать"));
    }
  };

  const handleFindMatch = async () => {
    try {
      const result = await triggerMatch();
      const d = result?.data?.data;
      if (d?.opponent) {
        setOpponent({ userId: d.opponent.userId, username: d.opponent.username, combatRating: d.opponent.combatRating });
      } else {
        toast.error("Противник не найден");
      }
    } catch {
      toast.error("Не удалось найти противника");
    }
  };

  const handleBattle = async () => {
    if (!opponent) return;
    try {
      const result = await battle({
        opponentUserId: opponent.userId,
        supportItemIds: selectedSupportItems,
      }).unwrap();
      const win = result?.data?.win;
      toast.success((win ? "Победа! " : "Поражение. ") + `+${result?.data?.coinsGained ?? 0} монет`);
      (result?.data?.consumedItems ?? []).forEach((item) => {
        toast.success(`Использовано: ${item.name || item.itemId} ×${item.count}`, 3500, { icon: item.icon });
      });
      if (result?.data?.resultScreen) setBattleResult(result.data.resultScreen as BattleResultState);
      setSelectedSupportItems([]);
      setOpponent(null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Бой не состоялся"));
    }
  };

  const handleFindWeeklyMatch = async () => {
    try {
      const result = await triggerWeeklyMatch();
      const d = result?.data?.data;
      if (d?.opponent) {
        setWeeklyOpponent({ userId: d.opponent.userId, username: d.opponent.username, weeklyRating: d.opponent.weeklyRating });
      } else {
        toast.error("Противник не найден");
      }
    } catch {
      toast.error("Недельные схватки пока недоступны");
    }
  };

  const handleWeeklyBattle = async () => {
    if (!weeklyOpponent) return;
    try {
      const result = await weeklyBattle({
        opponentUserId: weeklyOpponent.userId,
        supportItemIds: selectedWeeklySupportItems,
      }).unwrap();
      const win = result?.data?.win;
      const delta = result?.data?.weeklyRatingDelta;
      toast.success(
        (win ? "Недельная победа! " : "Недельное поражение. ") +
          `+${result?.data?.coinsGained ?? 0} монет` +
          (typeof delta === "number" ? `, рейтинг ${delta > 0 ? "+" : ""}${delta}` : ""),
      );
      (result?.data?.consumedItems ?? []).forEach((item) => {
        toast.success(`Использовано: ${item.name || item.itemId} ×${item.count}`, 3500, { icon: item.icon });
      });
      if (result?.data?.resultScreen) setBattleResult(result.data.resultScreen as BattleResultState);
      setSelectedWeeklySupportItems([]);
      setWeeklyOpponent(null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Бой не состоялся"));
    }
  };

  if (isProfileError) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить данные учеников. Проверьте сеть и обновите страницу.</p>
      </div>
    );
  }
  if (isLoading || !res) {
    return <div className="games-empty games-muted">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {battleResult && (
        <div className={`games-panel games-result-screen ${battleResult.outcome === "win" ? "games-result-win" : "games-result-lose"}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="games-panel-title mb-0">
              {battleResult.outcome === "win" ? "🏆 Победа" : "💀 Поражение"}
            </h3>
            <button
              type="button"
              onClick={() => setBattleResult(null)}
              className="games-btn games-btn-secondary games-btn-sm"
            >
              Закрыть
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-3">
            <div>
              <div className="games-muted text-xs mb-1">Ваша карточка</div>
              {battleResult.userCard?.mediaUrl && !battleCardErrors.user ? (
                <div className="games-card-frame">
                  <img
                    src={battleResult.userCard.mediaUrl}
                    alt=""
                    className="w-full max-w-full"
                    onError={() => setBattleCardErrors(prev => ({ ...prev, user: true }))}
                  />
                </div>
              ) : (
                <div className="games-muted text-sm">Нет карточки</div>
              )}
            </div>
            <div>
              <div className="games-muted text-xs mb-1">Карточка противника</div>
              {battleResult.opponentCard?.mediaUrl && !battleCardErrors.opponent ? (
                <div className="games-card-frame">
                  <img
                    src={battleResult.opponentCard.mediaUrl}
                    alt=""
                    className="w-full max-w-full"
                    onError={() => setBattleCardErrors(prev => ({ ...prev, opponent: true }))}
                  />
                </div>
              ) : (
                <div className="games-card-frame py-4 px-3 text-center games-muted text-sm">
                  {battleResult.opponentCard === null ? "Бот (карточки нет)" : "Нет карточки"}
                </div>
              )}
            </div>
          </div>

          {Array.isArray(battleResult.battleLog) && battleResult.battleLog.length > 0 && (
            <div className="mt-4">
              <div className="games-muted text-xs font-semibold uppercase tracking-wide mb-2">
                Лог боя
              </div>
              <ul className="space-y-1 text-sm">
                {battleResult.battleLog.slice(0, 10).map((e: BattleLogEntry, i: number) => (
                  <li key={i} className="games-muted">
                    {e.action === "support_items"
                      ? `Подготовка: ${(e.items ?? []).map((item) => item.name || getItemLabel(item.itemId, inventoryById)).join(", ")}`
                      : `Ход ${e.turn}: ${e.actor === "user" ? "Вы" : "Противник"} — ${e.techniqueName || getItemLabel(e.itemId || "", inventoryById)} (${BATTLE_ACTION_LABELS[e.action ?? ""] ?? e.action}) ${typeof e.value === "number" ? (e.value > 0 ? `+${e.value}` : e.value) : ""}${e.absorbed ? ` · блок ${e.absorbed}` : ""}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {/* Статы */}
      <div className="games-panel flex flex-wrap items-center justify-center gap-4 py-3">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-[var(--primary)]" aria-hidden />
          <strong className="text-[var(--primary)]">{res.balance}</strong>
          <span className="games-muted text-sm">монет</span>
        </span>
        <span className="games-muted text-sm">Рейтинг <strong className="text-[var(--foreground)]">{res.combatRating}</strong></span>
        <span className="games-muted text-sm">Ученики <strong className="text-[var(--foreground)]">{disciples.length}/{res.maxDisciples}</strong></span>
        <span className="games-muted text-sm">Карточки <strong className="text-[var(--foreground)]">{cardsSummary.total}</strong></span>
        <span className="games-muted text-sm">Готовы <strong className="text-[var(--foreground)]">{cardsSummary.upgradeReady}</strong></span>
        {cardsSummary.missing > 0 ? (
          <span className="games-muted text-sm">Не получено <strong className="text-[var(--foreground)]">{cardsSummary.missing}</strong></span>
        ) : null}
      </div>

      {/* Экспедиции */}
      <div className="games-panel">
        <h3 className="games-panel-title flex items-center gap-2">
          <Compass className="w-4 h-4 text-[var(--primary)]" aria-hidden /> Экспедиция
        </h3>
        {expeditionLoading && !expeditionData ? (
          <p className="games-muted text-sm">Загрузка статуса...</p>
        ) : expeditionStatusError || !expeditionData ? (
          <p className="games-muted text-sm text-[var(--destructive)]">Не удалось загрузить статус экспедиции</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="games-muted text-sm">
                {expeditionData.inProgress ? (
                  <>
                    Экспедиция в пути. Завершится через{" "}
                    <strong className="text-[var(--foreground)]">
                      {expeditionData.completesAt && expeditionTargetMs
                        ? formatCountdown(expeditionTargetMs)
                        : "—"}
                    </strong>
                  </>
                ) : expeditionData.canStart ? (
                  <>Готово к отправке. Выберите сложность.</>
                ) : (
                  <>
                    Кулдаун:{" "}
                    <strong className="text-[var(--foreground)]">
                      {expeditionData.nextExpeditionAt && expeditionTargetMs
                        ? formatCountdown(expeditionTargetMs)
                        : "—"}
                    </strong>
                  </>
                )}
              </p>
              <p className="games-muted text-sm">
                Баланс: <strong className="text-[var(--primary)]">{expeditionData.balance}</strong>
                {expeditionData.ambushRiskPercent != null && (
                  <> · Риск засады: <strong className="text-[var(--primary)]">{expeditionData.ambushRiskPercent}%</strong></>
                )}
              </p>
            </div>
            <div className="games-muted text-xs">
              Защита экспедиции: <strong className="text-[var(--foreground)]">{expeditionTalismanCount}</strong> талисм.
              {expeditionTalismanCount > 0
                ? " При засаде один талисман спишется автоматически."
                : " Если получите `expedition_talisman`, он будет срабатывать автоматически."}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={!expeditionData.canStart || isStartingExpedition || !expeditionData.hasDisciples}
                  className={d === "hard" ? "games-btn games-btn-primary" : "games-btn games-btn-secondary"}
                  onClick={async () => {
                    try {
                      const res = await startExpedition({ difficulty: d }).unwrap();
                      const payload = res?.data;
                      if (!payload) {
                        toast.error("Нет ответа от сервера. Попробуйте позже.");
                        return;
                      }
                      toast.success("Экспедиция отправлена! Результат будет через 1–2 минуты.");
                      refetchExpedition();
                    } catch (e: unknown) {
                      toast.error(getErrorMessage(e, "Не удалось отправить экспедицию"));
                    }
                  }}
                >
                  {d === "easy" ? "Лёгкая" : d === "normal" ? "Обычная" : "Тяжёлая"} ({expeditionData.costs?.[d]}🪙)
                </button>
              ))}
            </div>

            {expeditionData.lastResult && (
              <div className="games-reward-box">
                <p className="games-muted text-xs mb-2">Монеты и предметы — вам; опыт начисляется только первому ученику в отряде.</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[var(--foreground)]">
                    {expeditionData.lastResult.success ? "Успех" : "Провал"} · {expeditionData.lastResult.difficulty === "easy" ? "лёгкая" : expeditionData.lastResult.difficulty === "normal" ? "обычная" : "тяжёлая"}
                  </strong>
                  <span className="games-muted text-xs">
                    {expeditionData.lastResult.at
                      ? new Date(expeditionData.lastResult.at).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="games-reward-chip">+{expeditionData.lastResult.coinsGained ?? 0} монет</span>
                  <span className="games-reward-chip">+{expeditionData.lastResult.expGained ?? 0} опыта</span>
                  {(expeditionData.lastResult.itemsGained ?? []).map((i: { itemId: string; count: number; name?: string; icon?: string }, idx: number) => (
                    <span key={idx} className="games-reward-chip inline-flex items-center gap-1">
                      {i.icon ? <img src={i.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
                      {i.name || i.itemId} ×{i.count}
                    </span>
                  ))}
                  {(expeditionData.lastResult as { ambush?: { happened: boolean; preventedByTalisman: boolean } }).ambush?.happened && (
                    <span className="games-reward-chip games-reward-chip--warning">
                      {(expeditionData.lastResult as { ambush?: { preventedByTalisman?: boolean } }).ambush?.preventedByTalisman ? "Засада отражена" : "Засада"}
                    </span>
                  )}
                </div>
                {expeditionData.lastResult.log?.length ? (
                  <ul className="mt-2 space-y-1 text-xs games-muted">
                    {expeditionData.lastResult.log.slice(0, 6).map((l: string, idx: number) => (
                      <li key={idx}>{l}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кандидат */}
      {lastReroll && (
        <div className="games-panel">
          <h3 className="games-panel-title">Кандидат в ученики</h3>
          <div className="flex flex-wrap items-center gap-4">
            <DiscipleAvatar
              avatarPath={lastReroll.avatar ?? ""}
              showImage={showCandidateAvatar}
              onError={() => setCandidateAvatarError(true)}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--foreground)]">{lastReroll.name}</p>
              <p className="games-muted text-sm">{lastReroll.titleName}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="games-badge" title="Атака">⚔ {lastReroll.attack}</span>
                <span className="games-badge" title="Защита">🛡 {lastReroll.defense}</span>
                <span className="games-badge" title="Скорость">👟 {lastReroll.speed}</span>
                <span className="games-badge" title="HP">❤ {lastReroll.hp}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleRecruit(lastReroll.characterId)}
                disabled={isRecruiting || disciples.length >= res.maxDisciples}
                className="games-btn games-btn-primary"
              >
                Взять в команду
              </button>
              <button type="button" onClick={handleReroll} disabled={!canReroll || isRerolling} className="games-btn games-btn-secondary">
                <RefreshCw className={`w-4 h-4 ${isRerolling ? "animate-spin" : ""}`} aria-hidden />
                Ещё призыв ({res.rerollCostCoins} 🪙)
              </button>
            </div>
          </div>
        </div>
      )}

      {!lastReroll && (
        <div className="games-panel text-center">
          <button
            type="button"
            onClick={handleReroll}
            disabled={!canReroll || isRerolling || disciples.length >= res.maxDisciples}
            className="games-btn games-btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isRerolling ? "animate-spin" : ""}`} />
            Призвать ученика — {res.rerollCostCoins} монет
          </button>
        </div>
      )}

      {/* Ростер */}
      <div>
        <h3 className="games-panel-title">Ваши ученики</h3>
        {disciples.length === 0 ? (
          <p className="games-muted text-sm">Нет учеников. Призовите кандидата выше.</p>
        ) : (
          <ul className="space-y-3">
            {disciples.map((d) => {
              const raw = techniquesData?.data;
              const list = Array.isArray(raw)
                ? raw
                : (raw && typeof raw === "object" && "disciples" in raw && Array.isArray((raw as { disciples: unknown[] }).disciples))
                  ? (raw as { disciples: Array<{ characterId: string; available?: unknown[]; techniquesLearned?: string[]; techniquesEquipped?: string[] }> }).disciples
                  : [];
              const disciplesList: Array<{
                characterId: string;
                available: DiscipleTechniquesEntry["available"];
                techniquesLearned: string[];
                techniquesEquipped: string[];
              }> = (Array.isArray(list) ? list : []).map((entry) => ({
                characterId: entry.characterId,
                available: Array.isArray(entry.available) ? entry.available as DiscipleTechniquesEntry["available"] : [],
                techniquesLearned: "learned" in entry && Array.isArray(entry.learned)
                  ? entry.learned
                  : "techniquesLearned" in entry && Array.isArray(entry.techniquesLearned)
                    ? entry.techniquesLearned
                    : [],
                techniquesEquipped: "equipped" in entry && Array.isArray(entry.equipped)
                  ? entry.equipped
                  : "techniquesEquipped" in entry && Array.isArray(entry.techniquesEquipped)
                    ? entry.techniquesEquipped
                    : [],
              }));
              const tInfo = disciplesList.find((x) => x.characterId === d.characterId);
              const available = tInfo?.available ?? [];
              const learned = new Set(tInfo?.techniquesLearned ?? []);
              const equipped = new Set(tInfo?.techniquesEquipped ?? []);
              const showDiscipleAvatar = !failedDiscipleAvatarIds.has(d.characterId);
              const relatedCard = profileCards.find(card => card.characterId === d.characterId);
              return (
              <li key={d.characterId} className="games-card">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="shrink-0">
                    <DiscipleAvatar
                      avatarPath={d.avatar ?? ""}
                      showImage={showDiscipleAvatar}
                      onError={() => setFailedDiscipleAvatarIds(prev => new Set(prev).add(d.characterId))}
                      size="lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <p className="font-semibold text-[var(--foreground)] truncate">{d.name ?? "Ученик"}</p>
                      {(d.level != null || d.rank) && (
                        <span className="games-muted text-xs shrink-0">
                          {d.level != null && <>Ур. {d.level}</>}
                          {d.level != null && d.rank && " · "}
                          {d.rank && <>{d.rank}</>}
                        </span>
                      )}
                    </div>
                    {d.titleName && (
                      <p className="games-muted text-xs truncate mb-2">{d.titleName}</p>
                    )}
                    {d.exp != null && d.expToNext != null && d.expToNext > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="games-stat-bar w-24 h-1.5 flex-shrink-0" title="Опыт">
                          <div className="games-stat-fill h-full" style={{ width: `${Math.min(100, (d.exp / d.expToNext) * 100)}%` }} />
                        </div>
                        <span className="games-muted text-xs">{d.exp}/{d.expToNext}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="games-badge games-badge--primary" title="Боевая сила">
                        <Zap className="w-4 h-4 text-[var(--primary)]" data-icon aria-hidden />
                        <span>{formatStat(d.cp)}</span>
                      </span>
                      <span className="games-badge" title="Атака">
                        <Swords className="w-4 h-4 text-[var(--destructive)]" data-icon aria-hidden />
                        <span>{formatStat(d.attack)}</span>
                      </span>
                      <span className="games-badge" title="Защита">
                        <Shield className="w-4 h-4 text-[var(--chart-2)]" data-icon aria-hidden />
                        <span>{formatStat(d.defense)}</span>
                      </span>
                      <span className="games-badge" title="Скорость">
                        <Footprints className="w-4 h-4 text-[var(--chart-4)]" data-icon aria-hidden />
                        <span>{formatStat(d.speed)}</span>
                      </span>
                      <span className="games-badge" title="HP">
                        <Heart className="w-4 h-4 text-[var(--chart-3)]" data-icon aria-hidden />
                        <span>{formatStat(d.hp)}</span>
                      </span>
                    </div>

                    {d.cardMedia?.mediaUrl && !failedCardMediaIds.has(d.characterId) ? (
                      <div className="mb-2">
                        <div className="games-card-frame inline-block max-w-[200px]">
                          <img
                            src={d.cardMedia.mediaUrl}
                            alt=""
                            className="w-full max-w-[200px]"
                            onError={() => setFailedCardMediaIds(prev => new Set(prev).add(d.characterId))}
                          />
                          {d.cardMedia.label ? (
                            <div className="games-muted text-xs mt-1">{d.cardMedia.label}</div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-[var(--foreground)]">Игровая карточка</div>
                          {relatedCard ? (
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Ранг {relatedCard.currentStage}
                              {relatedCard.progression.nextStage
                                ? ` → ${relatedCard.progression.nextStage}`
                                : " · максимум"}
                              {typeof relatedCard.progression.nextStageRequiredLevel === "number"
                                ? ` · нужен ур. ${relatedCard.progression.nextStageRequiredLevel}`
                                : ""}
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Карточка этого персонажа ещё не получена. Ищите дропы при чтении или откройте колоду.
                            </div>
                          )}
                        </div>
                        {relatedCard?.progression.nextStage ? (
                          <button
                            type="button"
                            disabled={!relatedCard.progression.canUpgrade || isUpgradingCard}
                            className="games-btn games-btn-secondary games-btn-sm"
                            onClick={async () => {
                              try {
                                const result = await upgradeProfileCard(relatedCard.id).unwrap();
                                const success = result?.data?.success;
                                toast[success ? "success" : "warning"](
                                  success
                                    ? `Карточка улучшена до ${result.data?.card?.currentStage ?? relatedCard.currentStage}`
                                    : "Улучшение не удалось, ресурсы потрачены",
                                );
                                refetchCards();
                                refetchDisciples();
                              } catch (e: unknown) {
                                toast.error(getErrorMessage(e, "Не удалось улучшить карточку"));
                              }
                            }}
                          >
                            Улучшить
                          </button>
                        ) : null}
                      </div>
                      {relatedCard ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="w-16 shrink-0 rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)]">
                              {relatedCard.stageImageUrl ? (
                                <img
                                  src={getDecorationImageUrls(relatedCard.stageImageUrl).primary}
                                  alt={relatedCard.characterName || relatedCard.name}
                                  className="w-full aspect-[3/4] object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-[var(--muted-foreground)] mb-1">
                                {relatedCard.characterName || relatedCard.name}
                              </div>
                              {relatedCard.progression.nextStage ? (
                                <div className="text-xs text-[var(--muted-foreground)]">
                                  До этапа {relatedCard.progression.nextStage} осталось{" "}
                                  <strong className="text-[var(--foreground)]">
                                    {Math.max(
                                      0,
                                      (relatedCard.progression.nextStageRequiredLevel ?? 0) -
                                        (d.level ?? 0),
                                    )}
                                  </strong>{" "}
                                  ур.
                                </div>
                              ) : (
                                <div className="text-xs text-[var(--muted-foreground)]">
                                  Карточка достигла максимального этапа.
                                </div>
                              )}
                            </div>
                          </div>
                          {relatedCard.progression.nextStageRequiredLevel ? (
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] mb-1">
                                <span>Прогресс ученика</span>
                                <span>
                                  {Math.min(
                                    d.level ?? 0,
                                    relatedCard.progression.nextStageRequiredLevel,
                                  )}
                                  /{relatedCard.progression.nextStageRequiredLevel}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                                <div
                                  className="h-full bg-[var(--primary)] transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((d.level ?? 0) /
                                        Math.max(
                                          1,
                                          relatedCard.progression.nextStageRequiredLevel,
                                        )) *
                                        100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                            <span className="games-badge">Осколки: {relatedCard.shards}</span>
                            <span className="games-badge">Копии: {relatedCard.copies}</span>
                            {relatedCard.progression.nextStageUpgradeCoins > 0 ? (
                              <span className="games-badge">
                                Цена: {relatedCard.progression.nextStageUpgradeCoins}🪙
                              </span>
                            ) : null}
                            {relatedCard.progression.nextStageUpgradeItemId ? (
                              <span className="games-badge">
                                Материал: {getItemLabel(relatedCard.progression.nextStageUpgradeItemId, inventoryById)} ×{relatedCard.progression.nextStageUpgradeItemCount}
                                {" · "}
                                есть {inventoryById.get(relatedCard.progression.nextStageUpgradeItemId)?.count ?? 0}
                              </span>
                            ) : null}
                            {relatedCard.progression.nextStage ? (
                              <span className="games-badge">
                                Шанс: {Math.round((relatedCard.progression.nextStageSuccessChance ?? 1) * 100)}%
                              </span>
                            ) : null}
                            {!relatedCard.progression.hasNextStageImage ? (
                              <span className="games-badge games-badge--warning">Нет изображения следующего этапа</span>
                            ) : null}
                            {!relatedCard.progression.canUpgradeByLevel && relatedCard.progression.nextStage ? (
                              <span className="games-badge games-badge--warning">
                                Ученику нужен более высокий уровень
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                  {available.length > 0 && (
                    <div className="mt-3">
                      <div className="games-muted text-xs font-semibold uppercase tracking-wide mb-2">
                        Техники (экипировка: до 3)
                      </div>
                      <div className="grid gap-2">
                        {available.slice(0, 6).map((t) => {
                          const isLearned = learned.has(t.id);
                          const isEq = equipped.has(t.id);
                          return (
                            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                                  {t.name} <span className="games-muted text-xs">({TECHNIQUE_TYPE_LABELS[t.type] ?? t.type})</span>
                                </div>
                                {t.description ? (
                                  <div className="games-muted text-xs truncate">{t.description}</div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                {!isLearned ? (
                                  <button
                                    type="button"
                                    disabled={isLearning}
                                    onClick={async () => {
                                      try {
                                        await learnTechnique({ characterId: d.characterId, techniqueId: t.id }).unwrap();
                                        toast.success(`Изучено: ${t.name}`);
                                      } catch (e: unknown) {
                                        toast.error(getErrorMessage(e, "Не удалось изучить технику"));
                                      }
                                    }}
                                    className="games-btn games-btn-secondary games-btn-sm"
                                  >
                                    Учить ({t.learnCostCoins}🪙)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isEquipping}
                                    onClick={async () => {
                                      try {
                                        const next = isEq
                                          ? (tInfo?.techniquesEquipped ?? []).filter(x => x !== t.id)
                                          : [...(tInfo?.techniquesEquipped ?? []), t.id].slice(0, 3);
                                        await equipTechniques({ characterId: d.characterId, techniqueIds: next }).unwrap();
                                        toast.success(isEq ? "Снято" : "Экипировано");
                                      } catch (e: unknown) {
                                        toast.error(getErrorMessage(e, "Не удалось экипировать"));
                                      }
                                    }}
                                    className={`games-btn games-btn-sm ${isEq ? "games-btn-primary" : "games-btn-secondary"}`}
                                  >
                                    {isEq ? "Снять" : "Экипировать"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTrain(d.characterId)}
                      disabled={!res.canTrain || isTraining}
                      className="games-btn games-btn-secondary games-btn-sm whitespace-nowrap"
                      title="Тренировка (1 раз в день)"
                    >
                      <Zap className="w-3.5 h-3.5" aria-hidden /> Тренировка
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(d.characterId)}
                      className="games-btn games-btn-danger games-btn-sm whitespace-nowrap"
                    >
                      <UserMinus className="w-3.5 h-3.5" aria-hidden /> Отпустить
                    </button>
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>

      {/* Арена (как сейчас) */}
      <div className="games-panel">
        <h3 className="games-panel-title flex items-center gap-2">
          <Swords className="w-4 h-4 text-[var(--primary)]" aria-hidden /> Арена
        </h3>
        {!opponent ? (
          <button
            type="button"
            onClick={handleFindMatch}
            disabled={!res.canBattle || disciples.length === 0 || findingMatch || isBattling}
            className="games-btn games-btn-primary"
          >
            {findingMatch ? "Поиск противника..." : "Найти противника"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium text-[var(--foreground)]">
                {opponent.username}
                {opponent.userId?.startsWith?.("bot:") && (
                  <span className="games-badge-bot ml-1.5">бот</span>
                )}
                {" "}
                <span className="games-muted text-sm">(рейтинг {opponent.combatRating})</span>
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpponent(null)} className="games-btn games-btn-secondary games-btn-sm">Отмена</button>
                <button type="button" onClick={handleBattle} disabled={isBattling} className="games-btn games-btn-primary">В бой!</button>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
              <div className="games-muted text-xs font-semibold uppercase tracking-wide mb-2">Боевые предметы (до 3)</div>
              <div className="flex flex-wrap gap-2">
                {BATTLE_SUPPORT_ITEMS.map((item) => {
                  const count = inventoryById.get(item.id)?.count ?? 0;
                  const active = selectedSupportItems.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={count <= 0}
                      onClick={() => toggleSupportItem(item.id, "normal")}
                      className={`games-btn games-btn-sm ${active ? "games-btn-primary" : "games-btn-secondary"}`}
                      title={item.description}
                    >
                      {item.label} ×{count}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Недельные схватки */}
      <div className="games-panel">
        <h3 className="games-panel-title flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[var(--primary)]" aria-hidden /> Недельная схватка
        </h3>
        {weekly ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="games-muted text-sm">
                {weekly.weeklyDivision ? (
                  <span className="inline-flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[var(--primary)]" aria-hidden />
                    Дивизион <strong className="text-[var(--foreground)]">{weekly.weeklyDivision}</strong>
                    {typeof weekly.weeklyRating === "number" ? (
                      <span>· рейтинг <strong className="text-[var(--foreground)]">{weekly.weeklyRating}</strong></span>
                    ) : null}
                  </span>
                ) : (
                  <span>1 бой в неделю</span>
                )}
              </div>
              {!weekly.canWeeklyBattle && weekly.nextWeeklyBattleAt ? (
                <div className="games-muted text-sm">
                  Доступно после: <strong className="text-[var(--foreground)]">{new Date(weekly.nextWeeklyBattleAt).toLocaleDateString()}</strong>
                </div>
              ) : null}
            </div>

            {!weeklyOpponent ? (
              <button
                type="button"
                onClick={handleFindWeeklyMatch}
                disabled={!weekly.canWeeklyBattle || disciples.length === 0 || findingWeeklyMatch || isWeeklyBattling}
                className="games-btn games-btn-primary"
              >
                {findingWeeklyMatch ? "Поиск противника..." : "Найти противника"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium text-[var(--foreground)]">
                    {weeklyOpponent.username}
                    {weeklyOpponent.userId?.startsWith?.("bot:") && (
                      <span className="games-badge-bot ml-1.5">бот</span>
                    )}
                    {" "}
                    {typeof weeklyOpponent.weeklyRating === "number" ? (
                      <span className="games-muted text-sm">(рейтинг {weeklyOpponent.weeklyRating})</span>
                    ) : null}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setWeeklyOpponent(null)} className="games-btn games-btn-secondary games-btn-sm">Отмена</button>
                    <button type="button" onClick={handleWeeklyBattle} disabled={isWeeklyBattling} className="games-btn games-btn-primary">В бой!</button>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                  <div className="games-muted text-xs font-semibold uppercase tracking-wide mb-2">Боевые предметы (до 3)</div>
                  <div className="flex flex-wrap gap-2">
                    {BATTLE_SUPPORT_ITEMS.map((item) => {
                      const count = inventoryById.get(item.id)?.count ?? 0;
                      const active = selectedWeeklySupportItems.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={count <= 0}
                          onClick={() => toggleSupportItem(item.id, "weekly")}
                          className={`games-btn games-btn-sm ${active ? "games-btn-primary" : "games-btn-secondary"}`}
                          title={item.description}
                        >
                          {item.label} ×{count}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {leaderboard.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <h4 className="games-muted text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden /> Топ недели
                </h4>
                <ol className="space-y-1 text-sm">
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <li key={entry.username} className="flex items-center justify-between gap-2">
                      <span className="games-muted text-xs w-5">#{i + 1}</span>
                      <span className="truncate font-medium text-[var(--foreground)]">{entry.username}</span>
                      <span className="text-[var(--primary)] font-semibold shrink-0">{entry.weeklyRating}</span>
                      <span className="games-muted text-xs shrink-0">{entry.weeklyWins}П / {entry.weeklyLosses}П</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="games-muted text-sm">
            Режим появится после обновления бэкенда: 1 схватка в неделю + сезонный рейтинг.
          </p>
        )}
      </div>
    </div>
  );
}
