"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  useGetProfileDisciplesQuery,
  useGetProfileCardsQuery,
  useGetProfileInventoryQuery,
  useDisciplesRerollMutation,
  useDisciplesRecruitMutation,
  useDisciplesClaimDuplicateRewardMutation,
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
  useUpgradeProfileCardMutation,
} from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { getCoverUrls } from "@/lib/asset-url";
import { getDecorationImageUrls } from "@/api/shop";
import type { Disciple, DiscipleTechniquesEntry, InventoryEntry } from "@/types/games";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import { Users, Swords, RefreshCw, UserMinus, Zap, Coins, CalendarDays, Crown, Trophy, Shield, Footprints, Heart, UserPlus, Layers } from "lucide-react";

/** В отряде одновременно могут быть только 3 активных персонажа; остальные — в резерве */
const ACTIVE_SLOT_COUNT = 3;

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
  size?: "md" | "lg";
}) {
  const url = avatarPath ? getCoverUrls(avatarPath, "").primary : "";
  const show = url && showImage;
  const sizeClass =
    size === "lg" ? "games-card-avatar games-card-avatar--lg" : size === "md" ? "games-card-avatar games-card-avatar--md" : "games-card-avatar";
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
      <Users className={size === "md" ? "w-5 h-5 text-[var(--muted-foreground)]" : "w-10 h-10 sm:w-12 sm:h-12 text-[var(--muted-foreground)]"} aria-hidden />
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
  buff: "бафф (щит)",
  debuff: "дебафф",
  movement: "уклонение",
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
  const [claimDuplicateReward, { isLoading: isClaimingDuplicate }] = useDisciplesClaimDuplicateRewardMutation();
  const [dismiss] = useDisciplesDismissMutation();
  const [train, { isLoading: isTraining }] = useDisciplesTrainMutation();
  const [battle, { isLoading: isBattling }] = useDisciplesBattleMutation();
  const [weeklyBattle, { isLoading: isWeeklyBattling }] = useDisciplesWeeklyBattleMutation();
  const { data: techniquesData } = useGetDiscipleTechniquesQuery();
  const [learnTechnique, { isLoading: isLearning }] = useDisciplesLearnTechniqueMutation();
  const [equipTechniques, { isLoading: isEquipping }] = useDisciplesEquipTechniquesMutation();
  const [upgradeProfileCard, { isLoading: isUpgradingCard }] = useUpgradeProfileCardMutation();
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
  /** После найма/обмена дубля скрываем панель кандидата, пока бэкенд не обновит lastRerollCandidate */
  const [consumedCandidateId, setConsumedCandidateId] = useState<string | null>(null);
  const [failedCardMediaIds, setFailedCardMediaIds] = useState<Set<string>>(new Set());
  const [failedDiscipleAvatarIds, setFailedDiscipleAvatarIds] = useState<Set<string>>(new Set());
  const [battleCardErrors, setBattleCardErrors] = useState({ user: false, opponent: false });

  const res = data?.data;
  const disciples = (res?.disciples ?? []) as Disciple[];
  const activeRoster = useMemo(() => disciples.slice(0, ACTIVE_SLOT_COUNT), [disciples]);
  const reserveRoster = useMemo(() => disciples.slice(ACTIVE_SLOT_COUNT), [disciples]);
  const rosterItems = useMemo(() => {
    const items: Array<
      | { type: "active"; d: Disciple }
      | { type: "empty"; i: number }
      | { type: "reserve-header" }
      | { type: "reserve"; d: Disciple }
    > = [];
    for (let i = 0; i < ACTIVE_SLOT_COUNT; i++) {
      if (activeRoster[i]) items.push({ type: "active", d: activeRoster[i]! });
      else items.push({ type: "empty", i });
    }
    if (reserveRoster.length > 0) {
      items.push({ type: "reserve-header" });
      reserveRoster.forEach((d) => items.push({ type: "reserve", d }));
    }
    return items;
  }, [activeRoster, reserveRoster]);
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
  const lastRerollRaw = candidateValid ? candidate : (res?.lastRerollCandidate ?? null);
  const lastReroll = lastRerollRaw?.characterId === consumedCandidateId ? null : lastRerollRaw;
  const canReroll = (res?.balance ?? 0) >= (res?.rerollCostCoins ?? 50);

  useEffect(() => {
    if (lastRerollRaw?.characterId && lastRerollRaw.characterId !== consumedCandidateId) setConsumedCandidateId(null);
  }, [lastRerollRaw?.characterId, consumedCandidateId]);

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
      setConsumedCandidateId(characterId);
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

  const handleClaimDuplicateReward = async (characterId: string) => {
    try {
      const result = await claimDuplicateReward(characterId).unwrap();
      const data = result?.data;
      setCandidate(null);
      setCandidateExpiresAt(null);
      setConsumedCandidateId(characterId);
      refetchDisciples();
      const coins = data?.coinsGained ?? 0;
      toast.success(coins > 0 ? `Дубль обменян: +${coins} монет` : "Компенсация получена");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось получить компенсацию за дубля"));
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
                      : `Ход ${e.turn}: ${e.actor === "user" ? "Вы" : "Противник"} — ${e.techniqueName || getItemLabel(e.itemId || "", inventoryById)} (${BATTLE_ACTION_LABELS[e.action ?? ""] ?? e.action}) ${typeof e.value === "number" ? (e.value > 0 ? `+${e.value}` : e.value) : ""}${e.absorbed ? ` · блок ${e.absorbed}` : ""}${(e as { absorbedByShield?: number }).absorbedByShield ? ` · щит ${(e as { absorbedByShield?: number }).absorbedByShield}` : ""}${(e as { shieldTotal?: number }).shieldTotal != null ? ` · щит всего ${(e as { shieldTotal?: number }).shieldTotal}` : ""}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {/* Статы */}
      <div className="games-panel flex flex-wrap items-center justify-center gap-3 py-2 px-3">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-[var(--primary)]" aria-hidden />
          <strong className="text-[var(--primary)]">{res.balance}</strong>
          <span className="games-muted text-sm">монет</span>
        </span>
        <span className="games-muted text-sm">Рейтинг <strong className="text-[var(--foreground)]">{res.combatRating}</strong></span>
        <span className="games-muted text-sm">В отряде <strong className="text-[var(--foreground)]">{Math.min(disciples.length, ACTIVE_SLOT_COUNT)}/{ACTIVE_SLOT_COUNT}</strong></span>
        <span className="games-muted text-sm">Всего учеников <strong className="text-[var(--foreground)]">{disciples.length}</strong></span>
        <span className="games-muted text-sm">Карточки <strong className="text-[var(--foreground)]">{cardsSummary.total}</strong></span>
        <span className="games-muted text-sm">Готовы <strong className="text-[var(--foreground)]">{cardsSummary.upgradeReady}</strong></span>
        {cardsSummary.missing > 0 ? (
          <span className="games-muted text-sm">Не получено <strong className="text-[var(--foreground)]">{cardsSummary.missing}</strong></span>
        ) : null}
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[var(--foreground)]">{lastReroll.name}</p>
                {disciples.some((d) => d.characterId === lastReroll.characterId) && (
                  <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Дубль
                  </span>
                )}
              </div>
              <p className="games-muted text-sm">{lastReroll.titleName}</p>
              {disciples.some((d) => d.characterId === lastReroll.characterId) && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Уже есть в команде. Обменяйте на компенсацию.</p>
              )}
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="games-badge" title="Атака">⚔ {lastReroll.attack}</span>
                <span className="games-badge" title="Защита">🛡 {lastReroll.defense}</span>
                <span className="games-badge" title="Скорость">👟 {lastReroll.speed}</span>
                <span className="games-badge" title="HP">❤ {lastReroll.hp}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {disciples.some((d) => d.characterId === lastReroll.characterId) ? (
                <button
                  type="button"
                  onClick={() => handleClaimDuplicateReward(lastReroll.characterId)}
                  disabled={isClaimingDuplicate}
                  className="games-btn games-btn-primary"
                  title="Получить монеты за дубля"
                >
                  {isClaimingDuplicate ? "…" : "Получить компенсацию"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRecruit(lastReroll.characterId)}
                  disabled={isRecruiting}
                  className="games-btn games-btn-primary"
                >
                  Взять в команду
                </button>
              )}
              <button type="button" onClick={handleReroll} disabled={!canReroll || isRerolling} className="games-btn games-btn-secondary">
                <RefreshCw className={`w-4 h-4 ${isRerolling ? "animate-spin" : ""}`} aria-hidden />
                Ещё призыв ({res.rerollCostCoins} <Coins className="w-4 h-4 text-amber-500 inline-block shrink-0" aria-hidden />)
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
            disabled={!canReroll || isRerolling}
            className="games-btn games-btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isRerolling ? "animate-spin" : ""}`} />
            Призвать ученика — {res.rerollCostCoins} <Coins className="w-4 h-4 text-amber-500 inline-block shrink-0" aria-hidden /> монет
          </button>
        </div>
      )}

      {/* Ростер: активный отряд (3) + резерв */}
      <div>
        <h3 className="games-panel-title">Ваши ученики</h3>
        <p className="games-muted text-sm mb-3">Активный отряд — первые 3 (бой, экспедиции). Остальные в резерве. Без дублей.</p>
        {disciples.length === 0 ? (
          <p className="games-muted text-sm">Нет учеников. Призовите кандидата выше.</p>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden /> Активный отряд (до {ACTIVE_SLOT_COUNT})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {rosterItems.map((item, idx) => {
              if (item.type === "reserve-header") {
                return (
                  <div key="reserve-header" className="col-span-full border-t border-[var(--border)] pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4" aria-hidden /> Резерв ({reserveRoster.length})
                    </h4>
                    <p className="games-muted text-xs">Остальные ученики. В отряде участвуют только первые 3.</p>
                  </div>
                );
              }
              if (item.type === "empty") {
                return (
                  <div
                    key={`empty-${item.i}`}
                    className="rounded-xl border border-dashed border-[var(--border)]/60 bg-[var(--muted)]/10 flex flex-col items-center justify-center py-4 px-2 min-h-[72px]"
                  >
                    <UserPlus className="w-5 h-5 text-[var(--muted-foreground)]/50 mb-0.5" aria-hidden />
                    <span className="text-[11px] text-[var(--muted-foreground)]">Пустой слот</span>
                  </div>
                );
              }
              const d = item.d;
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
              const CardWrap = item.type === "active" ? "div" : "li";
              const cardClass = item.type === "reserve" ? "games-card games-card--compact col-span-full" : "games-card games-card--compact";
              return (
                <CardWrap key={d.characterId} className={cardClass}>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="shrink-0">
                    <DiscipleAvatar
                      avatarPath={d.avatar ?? ""}
                      showImage={showDiscipleAvatar}
                      onError={() => setFailedDiscipleAvatarIds(prev => new Set(prev).add(d.characterId))}
                      size="md"
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="font-semibold text-sm text-[var(--foreground)] truncate">{d.name ?? "Ученик"}</p>
                    {(d.level != null || d.rank) && (
                      <span className="games-muted text-[11px] shrink-0 font-semibold">
                        {d.level != null && <>Ур.{d.level}</>}
                        {d.level != null && d.rank && " · "}
                        {d.rank && <>{d.rank}</>}
                      </span>
                    )}
                    {d.titleName && <span className="games-muted text-[11px] truncate">· {d.titleName}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="games-badge games-badge--primary text-[11px] px-1.5 py-0.5" title="CP"><Zap className="w-3 h-3" data-icon aria-hidden /><span>{formatStat(d.cp)}</span></span>
                  <span className="games-badge text-[11px] px-1.5 py-0.5" title="Атака"><Swords className="w-3 h-3" data-icon aria-hidden /><span>{formatStat(d.attack)}</span></span>
                  <span className="games-badge text-[11px] px-1.5 py-0.5" title="Защита"><Shield className="w-3 h-3" data-icon aria-hidden /><span>{formatStat(d.defense)}</span></span>
                  <span className="games-badge text-[11px] px-1.5 py-0.5" title="Скорость"><Footprints className="w-3 h-3" data-icon aria-hidden /><span>{formatStat(d.speed)}</span></span>
                  <span className="games-badge text-[11px] px-1.5 py-0.5" title="HP"><Heart className="w-3 h-3" data-icon aria-hidden /><span>{formatStat(d.hp)}</span></span>
                  {d.exp != null && d.expToNext != null && d.expToNext > 0 && (
                    <span className="inline-flex items-center gap-1.5 ml-0.5 min-w-0">
                      <span
                        className="h-1.5 w-12 min-w-[3rem] max-w-20 rounded-full bg-[var(--muted)] overflow-hidden shrink-0"
                        role="progressbar"
                        aria-valuenow={d.exp}
                        aria-valuemin={0}
                        aria-valuemax={d.expToNext}
                        title={`${d.exp}/${d.expToNext} XP`}
                      >
                        <span
                          className="block h-full rounded-full bg-[var(--primary)] transition-all"
                          style={{ width: `${Math.min(100, (d.exp / d.expToNext) * 100)}%` }}
                        />
                      </span>
                      <span className="games-muted text-[11px] shrink-0">{d.exp}/{d.expToNext} XP</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleTrain(d.characterId)}
                    disabled={!res.canTrain || isTraining}
                    className="games-btn games-btn-secondary games-btn-sm"
                    title="Тренировка (1 раз в день)"
                  >
                    <Zap className="w-3 h-3" aria-hidden /> Тренировка
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(d.characterId)}
                    className="games-btn games-btn-danger games-btn-sm"
                  >
                    <UserMinus className="w-3 h-3" aria-hidden /> Отпустить
                  </button>
                </div>
                <div className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)]/20 p-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {relatedCard?.stageImageUrl ? (
                      <div className="w-10 h-[52px] shrink-0 rounded overflow-hidden bg-[var(--muted)] border border-[var(--border)]">
                        <img src={getDecorationImageUrls(relatedCard.stageImageUrl).primary} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        {relatedCard ? `Ранг ${relatedCard.currentStage}${relatedCard.progression.nextStage ? ` → ${relatedCard.progression.nextStage}` : " · макс."}` : "Карточка не получена"}
                      </div>
                      {relatedCard?.progression.nextStage && (
                        <div className="text-[11px] games-muted">
                          Ур.{d.level ?? 0}/{relatedCard.progression.nextStageRequiredLevel} · {relatedCard.progression.nextStageUpgradeCoins}🪙
                          {relatedCard.progression.nextStageUpgradeItemId ? ` · ${getItemLabel(relatedCard.progression.nextStageUpgradeItemId, inventoryById)}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  {relatedCard?.progression.nextStage ? (
                    <button
                      type="button"
                      disabled={!relatedCard.progression.canUpgrade || isUpgradingCard}
                      className="games-btn games-btn-secondary games-btn-sm shrink-0"
                      onClick={async () => {
                        try {
                          const result = await upgradeProfileCard(relatedCard.id).unwrap();
                          const success = result?.data?.success;
                          toast[success ? "success" : "warning"](success ? `Улучшено до ${result.data?.card?.currentStage ?? relatedCard.currentStage}` : "Не удалось");
                          refetchCards();
                          refetchDisciples();
                        } catch (e: unknown) {
                          toast.error(getErrorMessage(e, "Не удалось улучшить"));
                        }
                      }}
                    >
                      Улучшить
                    </button>
                  ) : null}
                </div>
                {available.length > 0 ? (
                  <div className="mt-1.5">
                    <div className="games-muted text-[10px] font-semibold uppercase tracking-wide mb-1">Техники (до 3)</div>
                    <div className="flex flex-wrap gap-1">
                      {available.slice(0, 6).map((t) => {
                        const isLearned = learned.has(t.id);
                        const isEq = equipped.has(t.id);
                        return (
                          <div key={t.id} className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--muted)]/10 px-1.5 py-0.5">
                            <span className="text-[11px] truncate max-w-[100px]">{t.name}</span>
                            {!isLearned ? (
                              <button
                                type="button"
                                disabled={isLearning}
                                onClick={async () => {
                                  try {
                                    await learnTechnique({ characterId: d.characterId, techniqueId: t.id }).unwrap();
                                    toast.success(`Изучено: ${t.name}`);
                                  } catch (e: unknown) {
                                    toast.error(getErrorMessage(e, "Не удалось изучить"));
                                  }
                                }}
                                className="games-btn games-btn-secondary text-[10px] py-0.5 px-1"
                              >
                                {t.learnCostCoins}🪙
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
                                className={`games-btn text-[10px] py-0.5 px-1 ${isEq ? "games-btn-primary" : "games-btn-secondary"}`}
                              >
                                {isEq ? "Снять" : "Надеть"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="games-muted text-[11px] mt-1.5">Техник нет. Изучайте за монеты (лимит в день).</p>
                )}
                </CardWrap>
              );
            })}
            </div>
          </div>
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
