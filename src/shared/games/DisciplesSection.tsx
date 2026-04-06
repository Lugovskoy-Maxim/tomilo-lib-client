"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useGetProfileDisciplesQuery,
  useGetProfileCardsQuery,
  useGetProfileInventoryQuery,
  useDisciplesRerollMutation,
  useDisciplesRecruitMutation,
  useDisciplesClaimDuplicateRewardMutation,
  useDisciplesDismissMutation,
  useDisciplesTrainMutation,
  useDisciplesSetPrimaryMutation,
  useDisciplesSetWarehouseMutation,
  useGetDisciplesGameShopQuery,
  useDisciplesGameShopBuyMutation,
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
import {
  normalizeGameInventoryList,
  countInventoryForCanonicalId,
  findInventoryEntryForCanonicalId,
} from "@/lib/gameInventory";
import { getCoverUrls } from "@/lib/asset-url";
import { formatUsernameDisplay } from "@/lib/username-display";
import { getDecorationImageUrls } from "@/api/shop";
import type { Disciple, DiscipleTechniquesEntry, InventoryEntry, TechniqueEntry } from "@/types/games";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import { Users, Swords, RefreshCw, UserMinus, Zap, Coins, CalendarDays, Crown, Trophy, Shield, Footprints, Heart, UserPlus, BookOpen, ShoppingBag, Warehouse, ChevronDown, ChevronRight, Package, Loader2 } from "lucide-react";

import { GAME_ART, battleBuffArtForLog, weeklyBattleBiomeArt } from "./gameArt";
/** Элемент лога боя */
interface BattleLogEntry {
  action?: string;
  turn?: number;
  actor?: string;
  techniqueName?: string;
  performerName?: string;
  message?: string;
  opponentSummary?: string;
  itemId?: string;
  value?: number;
  absorbed?: number;
  items?: Array<{ itemId: string; name?: string }>;
  dodgeNext?: boolean;
  /** Кому досталось (если присылает бэкенд) */
  targetName?: string;
  targetActor?: string;
  /** Альтернативные поля имени с бэка (противник часто приходит сюда) */
  characterName?: string;
  unitName?: string;
  actorName?: string;
  attackerName?: string;
  defenderName?: string;
}
/** Результат боя (battleLog, userCard, opponentCard и др.) */
interface BattleResultState {
  battleLog?: BattleLogEntry[];
  userCard?: { mediaUrl?: string };
  opponentCard?: { mediaUrl?: string };
  outcome?: "win" | "lose";
  /** Текст с бэка: почему исход такой */
  outcomeReason?: string;
  defeatReason?: string;
  winReason?: string;
  [key: string]: unknown;
}

/** Упрощённый боец для полоски отряда на экране результата */
interface BattleSquadPreview {
  name?: string;
  avatar?: string;
  characterId?: string;
  level?: number;
  mediaUrl?: string;
}

type PvpOpponentSnapshot = {
  userId: string;
  username: string;
  combatRating?: number;
  weeklyRating?: number;
  avatar?: string;
  disciples?: unknown[];
};

function pickFirstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function coerceSquadMember(row: unknown): BattleSquadPreview | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const nest = (r.disciple ?? r.character ?? r.unit ?? r.card) as Record<string, unknown> | undefined;
  const n = nest && typeof nest === "object" ? nest : undefined;

  const name = pickFirstString(
    r.name,
    r.characterName,
    r.displayName,
    r.titleName,
    n?.name,
  );
  const avatar = pickFirstString(r.avatar, n?.avatar);
  const characterId = pickFirstString(r.characterId, n?.characterId);
  const levelRaw = r.level ?? n?.level;
  const level = typeof levelRaw === "number" ? levelRaw : undefined;
  let mediaUrl: string | undefined;
  const cm = r.cardMedia ?? n?.cardMedia;
  if (cm && typeof cm === "object" && cm !== null && "mediaUrl" in cm) {
    const u = (cm as { mediaUrl?: unknown }).mediaUrl;
    if (typeof u === "string") mediaUrl = u;
  }
  if (typeof r.mediaUrl === "string") mediaUrl = r.mediaUrl;
  if (!name && !avatar && !characterId && !mediaUrl && level == null) return null;
  return { name, avatar, characterId, level, mediaUrl };
}

function squadFromUnknownArray(raw: unknown): BattleSquadPreview[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(coerceSquadMember).filter((x): x is BattleSquadPreview => x != null);
}

function firstNonEmptySquad(...sources: unknown[]): BattleSquadPreview[] {
  for (const s of sources) {
    const m = squadFromUnknownArray(s);
    if (m.length) return m;
  }
  return [];
}

function squadsFromResultScreen(br: BattleResultState): { user: BattleSquadPreview[]; opponent: BattleSquadPreview[] } {
  const teams = br.teams as Record<string, unknown> | undefined;
  const user = firstNonEmptySquad(
    br.userDisciples,
    br.userSquad,
    br.userTeam,
    teams?.user,
    teams?.ally,
    (br.user as { disciples?: unknown })?.disciples,
  );
  const ext = br as {
    opponentRoster?: unknown;
    enemyDisciples?: unknown;
    enemySquad?: unknown;
  };
  const opponent = firstNonEmptySquad(
    br.opponentDisciples,
    br.opponentSquad,
    br.opponentTeam,
    ext.opponentRoster,
    ext.enemyDisciples,
    ext.enemySquad,
    teams?.opponent,
    teams?.enemy,
    (br.opponent as { disciples?: unknown })?.disciples,
  );
  return { user, opponent };
}

function battleSideRu(actor: string | undefined): string {
  if (actor === "user") return "ваш отряд";
  if (actor === "opponent") return "противник";
  if (actor === "system") return "система";
  return actor ?? "неизвестно";
}

function targetSideRu(actor: string | undefined): string {
  if (actor === "user") return "ваш отряд";
  if (actor === "opponent") return "отряд противника";
  if (actor === "system") return "система";
  return "";
}

function summarizeBattleLogDamage(log: BattleLogEntry[]): {
  userDealt: number;
  opponentDealt: number;
  userHealed: number;
  opponentHealed: number;
} {
  let userDealt = 0;
  let opponentDealt = 0;
  let userHealed = 0;
  let opponentHealed = 0;
  for (const e of log) {
    const raw = typeof e.value === "number" ? e.value : 0;
    const mag = Math.abs(raw);
    const act = e.action ?? "";
    if (act === "damage" || act === "item_damage") {
      if (e.actor === "user") userDealt += mag;
      else if (e.actor === "opponent") opponentDealt += mag;
    }
    if (act === "heal" || act === "item_heal" || act === "item_revive") {
      if (e.actor === "user") userHealed += mag;
      else if (e.actor === "opponent") opponentHealed += mag;
    }
  }
  return { userDealt, opponentDealt, userHealed, opponentHealed };
}

/** Аватар бойца в полоске отряда (локальный fallback при ошибке картинки) */
function BattleSquadMemberChip({ member }: { member: BattleSquadPreview }) {
  const [imgFailed, setImgFailed] = useState(false);
  const fromCard = member.mediaUrl?.trim();
  const fromAvatar = member.avatar ? getCoverUrls(member.avatar, "").primary : "";
  const url = fromCard || fromAvatar;
  const showImg = Boolean(url && !imgFailed);

  return (
    <div className="flex flex-col items-center gap-1 w-[4.5rem] sm:w-[5.25rem] shrink-0">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-[var(--border)] bg-[var(--muted)]/25 overflow-hidden flex items-center justify-center">
        {showImg ? (
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Users className="w-6 h-6 text-[var(--muted-foreground)]" aria-hidden />
        )}
      </div>
      <div className="text-[10px] sm:text-[11px] text-center text-[var(--foreground)] font-medium leading-tight line-clamp-2 w-full">
        {member.name ?? "—"}
      </div>
      {member.level != null ? (
        <div className="text-[10px] text-[var(--muted-foreground)]">ур.{member.level}</div>
      ) : null}
    </div>
  );
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
  battle_start: "начало",
  damage: "урон",
  heal: "лечение",
  buff: "бафф (щит)",
  debuff: "дебафф",
  movement: "уклонение",
  item_damage: "урон предметом",
  item_heal: "лечение предметом",
  item_revive: "воскрешение",
};

function battleLogPerformerDisplayName(e: BattleLogEntry): string {
  const candidates = [
    e.performerName,
    e.characterName,
    e.unitName,
    e.actorName,
    e.attackerName,
    e.defenderName,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function formatBattleLogLine(
  e: BattleLogEntry,
  getLabel: (itemId: string) => string,
): string {
  if (e.action === "battle_start") {
    return [e.message, e.opponentSummary].filter(Boolean).join(" · ");
  }
  if (e.action === "support_items") {
    return `Подготовка: ${(e.items ?? []).map((item) => item.name || getLabel(item.itemId)).join(", ")}`;
  }

  const turn = typeof e.turn === "number" ? e.turn : "—";
  const performerRaw = battleLogPerformerDisplayName(e);
  const performer = performerRaw || "Боец";
  const side = battleSideRu(e.actor);
  const tech = (e.techniqueName || getLabel(e.itemId || "")).trim() || "действие";
  const act = BATTLE_ACTION_LABELS[e.action ?? ""] ?? e.action ?? "событие";

  const absorbSuffix = `${e.absorbed ? ` · блок ${e.absorbed}` : ""}${(e as { absorbedByShield?: number }).absorbedByShield ? ` · щит ${(e as { absorbedByShield?: number }).absorbedByShield}` : ""}${(e as { shieldTotal?: number }).shieldTotal != null ? ` · щит всего ${(e as { shieldTotal?: number }).shieldTotal}` : ""}`;
  const dodgeSuffix = e.dodgeNext ? " · готов к уклонению" : "";

  const val = typeof e.value === "number" ? Math.abs(e.value) : null;
  const targetHint =
    e.targetName && e.targetActor
      ? ` → по ${targetSideRu(e.targetActor) || "цели"}: ${e.targetName}`
      : e.targetName
        ? ` → цель: ${e.targetName}`
        : "";

  if (e.action === "damage" || e.action === "item_damage") {
    return `Ход ${turn}: ${performer} (${side}) наносит урон — «${tech}»${targetHint}${val != null ? ` · −${val} ОЗ` : ""}${absorbSuffix}${dodgeSuffix}`;
  }
  if (e.action === "heal" || e.action === "item_heal") {
    return `Ход ${turn}: ${performer} (${side}) лечит — «${tech}»${targetHint}${val != null ? ` · +${val} ОЗ` : ""}${dodgeSuffix}`;
  }
  if (e.action === "buff" || e.action === "debuff") {
    return `Ход ${turn}: ${performer} (${side}) — «${tech}» (${act})${val != null ? ` · значение ${val}` : ""}${absorbSuffix}${dodgeSuffix}`;
  }
  if (e.action === "movement") {
    return `Ход ${turn}: ${performer} (${side}) — «${tech}» (уклонение / движение)${dodgeSuffix}`;
  }
  if (e.action === "item_revive") {
    return `Ход ${turn}: ${performer} (${side}) — «${tech}» (воскрешение)${val != null ? ` · +${val} ОЗ` : ""}`;
  }

  const valueSuffix =
    typeof e.value === "number" ? ` ${e.value > 0 ? `+${e.value}` : String(e.value)}` : "";
  return `Ход ${turn}: ${performer} (${side}) — «${tech}» (${act})${valueSuffix}${absorbSuffix}${dodgeSuffix}`;
}

const BATTLE_SUPPORT_ITEMS = [
  { id: "healing_pill", label: "Пилюля исцеления", description: "Авто-лечение при просадке HP" },
  { id: "basic_talisman", label: "Базовый талисман", description: "Небольшой одноразовый щит" },
  { id: "defense_talisman", label: "Талисман защиты", description: "Поглощает часть входящего урона" },
  { id: "heavenly_thunder_talisman", label: "Талисман небесной грозы", description: "Наносит стартовый урон врагу" },
  { id: "resurrection_fragment", label: "Осколок воскрешения", description: "Разово поднимает бойца после поражения" },
] as const;

function SupportItemTile({
  item,
  count,
  active,
  iconPath,
  onPick,
}: {
  item: (typeof BATTLE_SUPPORT_ITEMS)[number];
  count: number;
  active: boolean;
  iconPath?: string;
  onPick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const prim = iconPath ? getDecorationImageUrls(iconPath).primary : "";

  return (
    <button
      type="button"
      disabled={count <= 0}
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        onPick();
      }}
      title={item.description}
      className={`relative z-0 flex flex-col items-stretch gap-1 rounded-xl border p-2.5 text-left transition-all min-h-[5.75rem] pointer-events-auto touch-manipulation ${
        count <= 0
          ? "opacity-45 border-[var(--border)] bg-[var(--muted)]/10 cursor-not-allowed"
          : active
            ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30 shadow-sm"
            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/35 hover:bg-[var(--muted)]/12"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-[var(--muted)]/35 flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border)]/60">
          {prim && !imgErr ? (
            <img
              src={prim}
              alt=""
              className="w-full h-full object-contain p-0.5"
              onError={() => setImgErr(true)}
            />
          ) : (
            <Package className="w-5 h-5 text-[var(--muted-foreground)]" aria-hidden />
          )}
        </div>
        <span
          className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
            count > 0 ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
          }`}
        >
          ×{count}
        </span>
      </div>
      <span className="text-[11px] sm:text-xs font-medium text-[var(--foreground)] leading-snug line-clamp-2">
        {item.label}
      </span>
      {active ? (
        <span className="text-[10px] font-semibold text-[var(--primary)]">Взято в бой</span>
      ) : count > 0 ? (
        <span className="text-[10px] text-[var(--muted-foreground)]">Нажмите, чтобы выбрать</span>
      ) : (
        <span className="text-[10px] text-[var(--muted-foreground)]">Нет в сумке</span>
      )}
    </button>
  );
}

function BattleSupportItemGrid({
  inventory,
  selectedIds,
  onToggle,
}: {
  inventory: InventoryEntry[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {BATTLE_SUPPORT_ITEMS.map((item) => {
        const count = countInventoryForCanonicalId(inventory, item.id);
        const inv = findInventoryEntryForCanonicalId(inventory, item.id);
        return (
          <SupportItemTile
            key={item.id}
            item={item}
            count={count}
            active={selectedIds.includes(item.id)}
            iconPath={inv?.icon}
            onPick={() => onToggle(item.id)}
          />
        );
      })}
    </div>
  );
}

function MatchOpponentAvatar({ avatarPath }: { avatarPath?: string }) {
  const [failed, setFailed] = useState(false);
  const url = avatarPath ? getCoverUrls(avatarPath, "").primary : "";
  const show = Boolean(url && !failed);
  return (
    <div className="w-14 h-14 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 overflow-hidden flex items-center justify-center shrink-0">
      {show ? (
        <img src={url} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Users className="w-7 h-7 text-[var(--muted-foreground)]" aria-hidden />
      )}
    </div>
  );
}

/** Отображает число стата без лишних знаков после запятой (CP и др.) */
function formatStat(value: number | null | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.?0+$/, "");
}

function getItemLabel(itemId: string, inventoryById: Map<string, InventoryEntry>): string {
  return (
    inventoryById.get(itemId)?.name ||
    inventoryById.get(itemId.toLowerCase())?.name ||
    GAME_ITEMS_LORE.find((entry) => entry.id === itemId)?.name ||
    itemId
  );
}

function sortTechniquesForLibrary(
  available: TechniqueEntry[],
  learnedIds: Set<string>,
  libraryLevel: number,
): TechniqueEntry[] {
  return [...available].sort((a, b) => {
    const aLearned = learnedIds.has(a.id);
    const bLearned = learnedIds.has(b.id);
    if (aLearned !== bLearned) return aLearned ? -1 : 1;
    const aLock = (a.requiredLibraryLevel ?? 1) > libraryLevel;
    const bLock = (b.requiredLibraryLevel ?? 1) > libraryLevel;
    if (aLock !== bLock) return aLock ? 1 : -1;
    const ac = a.learnCostCoins ?? 0;
    const bc = b.learnCostCoins ?? 0;
    if (ac !== bc) return ac - bc;
    return (a.name || "").localeCompare(b.name || "", "ru");
  });
}

export function DisciplesSection() {
  const toast = useToast();
  const { data, isLoading, isError: isProfileError, refetch: refetchDisciples } = useGetProfileDisciplesQuery();
  const { data: profileCardsData, refetch: refetchCards } = useGetProfileCardsQuery();
  const { data: inventoryData, refetch: refetchInventory } = useGetProfileInventoryQuery();
  const [reroll, { isLoading: isRerolling }] = useDisciplesRerollMutation();
  const [recruit, { isLoading: isRecruiting }] = useDisciplesRecruitMutation();
  const [claimDuplicateReward, { isLoading: isClaimingDuplicate }] = useDisciplesClaimDuplicateRewardMutation();
  const [dismiss] = useDisciplesDismissMutation();
  const [train, { isLoading: isTraining }] = useDisciplesTrainMutation();
  const [setPrimaryMut, { isLoading: isSettingPrimary }] = useDisciplesSetPrimaryMutation();
  const [setWarehouseMut, { isLoading: isMovingWarehouse }] = useDisciplesSetWarehouseMutation();
  const { data: gameShopData } = useGetDisciplesGameShopQuery();
  const [buyShopOffer, { isLoading: isBuyingShop }] = useDisciplesGameShopBuyMutation();
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
  const [opponent, setOpponent] = useState<PvpOpponentSnapshot | null>(null);
  const [triggerWeeklyMatch, { isLoading: findingWeeklyMatch }] = useLazyDisciplesWeeklyBattleMatchQuery();
  const [weeklyOpponent, setWeeklyOpponent] = useState<PvpOpponentSnapshot | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResultState | null>(null);
  /** Снимок противника с матчмейкинга — карточки/отряд на экране результата после сброса `opponent` */
  const [lastBattleOpponent, setLastBattleOpponent] = useState<PvpOpponentSnapshot | null>(null);
  const [battleLogExpanded, setBattleLogExpanded] = useState(false);
  const [selectedSupportItems, setSelectedSupportItems] = useState<string[]>([]);
  const [selectedWeeklySupportItems, setSelectedWeeklySupportItems] = useState<string[]>([]);
  const [candidateAvatarError, setCandidateAvatarError] = useState(false);
  /** После найма/обмена дубля скрываем панель кандидата, пока бэкенд не обновит lastRerollCandidate */
  const [consumedCandidateId, setConsumedCandidateId] = useState<string | null>(null);
  const [failedDiscipleAvatarIds, setFailedDiscipleAvatarIds] = useState<Set<string>>(new Set());
  const [barracksExpanded, setBarracksExpanded] = useState(false);
  const [subTab, setSubTab] = useState<"overview" | "roster" | "arena" | "weekly" | "library" | "shop">("overview");

  const res = data?.data;
  const disciples = useMemo(() => (res?.disciples ?? []) as Disciple[], [res?.disciples]);
  const maxActive =
    res?.maxDisciples != null && res.maxDisciples > 0 ? res.maxDisciples : 3;
  const primaryId = res?.primaryDiscipleCharacterId ?? null;
  const libraryState = res?.library;
  const libraryLive = techniquesData?.data?.library ?? libraryState ?? null;
  const scrollOffer = gameShopData?.data?.offers?.find(
    (o: { offerId?: string }) => o.offerId === "library_scroll",
  );
  const shopOffersExceptScroll = (gameShopData?.data?.offers ?? []).filter(
    (o: { offerId?: string }) => o.offerId !== "library_scroll",
  );
  const activeRoster = useMemo(
    () => disciples.filter((d) => !d.inWarehouse),
    [disciples],
  );
  const warehouseRoster = useMemo(
    () => disciples.filter((d) => d.inWarehouse),
    [disciples],
  );
  const rosterItems = useMemo(() => {
    const items: Array<
      | { type: "active"; d: Disciple }
      | { type: "empty"; i: number }
      | { type: "warehouse-header" }
      | { type: "warehouse"; d: Disciple }
    > = [];
    for (let i = 0; i < maxActive; i++) {
      if (activeRoster[i]) items.push({ type: "active", d: activeRoster[i]! });
      else items.push({ type: "empty", i });
    }
    if (warehouseRoster.length > 0) {
      items.push({ type: "warehouse-header" });
      if (barracksExpanded) {
        warehouseRoster.forEach((d) => items.push({ type: "warehouse", d }));
      }
    }
    return items;
  }, [activeRoster, warehouseRoster, maxActive, barracksExpanded]);
  const profileCards = useMemo(
    () => profileCardsData?.data?.cards ?? [],
    [profileCardsData?.data?.cards],
  );
  const inventory = useMemo(() => normalizeGameInventoryList(inventoryData), [inventoryData]);
  const inventoryById = useMemo(() => {
    const m = new Map<string, InventoryEntry>();
    for (const entry of inventory) {
      m.set(entry.itemId, entry);
      m.set(entry.itemId.toLowerCase(), entry);
    }
    return m;
  }, [inventory]);

  const userSquadForResult = useMemo((): BattleSquadPreview[] => {
    if (!battleResult) return [];
    const fromApi = squadsFromResultScreen(battleResult).user;
    if (fromApi.length) return fromApi;
    return activeRoster.map((d) => ({
      name: d.name,
      avatar: d.avatar,
      characterId: d.characterId,
      level: d.level,
      mediaUrl: d.cardMedia?.mediaUrl,
    }));
  }, [battleResult, activeRoster]);

  const opponentSquadForResult = useMemo((): BattleSquadPreview[] => {
    if (!battleResult) return [];
    const fromApi = squadsFromResultScreen(battleResult).opponent;
    if (fromApi.length) return fromApi;
    const fromSnap = squadFromUnknownArray(lastBattleOpponent?.disciples);
    if (fromSnap.length) return fromSnap;
    if (lastBattleOpponent?.username) {
      return [
        {
          name: formatUsernameDisplay(lastBattleOpponent.username),
          avatar: lastBattleOpponent.avatar,
        },
      ];
    }
    return [];
  }, [battleResult, lastBattleOpponent]);

  const battleDamageSummary = useMemo(() => {
    if (!battleResult?.battleLog) return null;
    return summarizeBattleLogDamage(battleResult.battleLog);
  }, [battleResult?.battleLog]);

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
    setBattleLogExpanded(false);
  }, [battleResult]);

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
      toast.success(
        outcome === "fail"
          ? "Тренировка сорвалась: статы без прироста, но опыт распределён между всеми учениками (основной — больше)"
          : "Тренировка завершена: статы выбранного ученика растут; опыт получают все (основной — больше)",
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось потренировать"));
    }
  };

  const handleSetPrimary = async (characterId: string) => {
    try {
      await setPrimaryMut({ characterId }).unwrap();
      toast.success("Основной ученик выбран");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось назначить основного"));
    }
  };

  const handleWarehouseToggle = async (characterId: string, inWarehouse: boolean) => {
    try {
      await setWarehouseMut({ characterId, inWarehouse }).unwrap();
      toast.success(inWarehouse ? "Ученик в казарме" : "Ученик в активном отряде");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось переместить"));
    }
  };

  const handleBuyShop = async (offerId: string) => {
    try {
      const result = await buyShopOffer({ offerId }).unwrap();
      const lib = result?.data?.library;
      toast.success(
        lib
          ? `Куплено. Библиотека: ур.${lib.level}, опыт ${lib.exp}${
              typeof lib.expToNext === "number" ? `/${lib.expToNext} до след. ур.` : ""
            }`
          : "Покупка выполнена",
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось купить"));
    }
  };

  const handleFindMatch = async () => {
    try {
      const result = await triggerMatch();
      const d = result?.data?.data;
      if (d?.opponent) {
        const opp = d.opponent as PvpOpponentSnapshot & { disciples?: unknown[] };
        setOpponent({
          userId: opp.userId,
          username: opp.username,
          combatRating: opp.combatRating,
          avatar: typeof opp.avatar === "string" ? opp.avatar : undefined,
          disciples: Array.isArray(opp.disciples) ? opp.disciples : undefined,
        });
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
      if (result?.data?.resultScreen) {
        setBattleResult({
          ...(result.data.resultScreen as BattleResultState),
          outcome: result.data.win ? "win" : "lose",
        });
      }
      setLastBattleOpponent(opponent);
      setSelectedSupportItems([]);
      setOpponent(null);

      void refetchDisciples();
      void refetchInventory();

      const rd = result?.data;
      const delta = rd?.combatRatingDelta ?? rd?.ratingDelta;
      if (typeof delta === "number" && delta !== 0) {
        toast.info(
          `Рейтинг боя: ${delta > 0 ? "+" : ""}${delta}${typeof rd?.combatRating === "number" ? ` (сейчас ${rd.combatRating})` : ""}`,
          5000,
        );
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Бой не состоялся"));
    }
  };

  const handleFindWeeklyMatch = async () => {
    try {
      const result = await triggerWeeklyMatch();
      const d = result?.data?.data;
      if (d?.opponent) {
        const opp = d.opponent as PvpOpponentSnapshot & { disciples?: unknown[] };
        setWeeklyOpponent({
          userId: opp.userId,
          username: opp.username,
          weeklyRating: opp.weeklyRating,
          avatar: typeof opp.avatar === "string" ? opp.avatar : undefined,
          disciples: Array.isArray(opp.disciples) ? opp.disciples : undefined,
        });
      } else {
        toast.error("Противник не найден");
      }
    } catch {
      toast.error("Недельные схватки пока недоступны");
    }
  };

  const handleWeeklyBattle = async () => {
    if (!weeklyOpponent) return;
    const snap = weeklyOpponent;
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
      if (result?.data?.resultScreen) {
        setBattleResult({
          ...(result.data.resultScreen as BattleResultState),
          outcome: result.data.win ? "win" : "lose",
        });
      }
      setLastBattleOpponent(snap);
      setSelectedWeeklySupportItems([]);
      setWeeklyOpponent(null);

      void refetchDisciples();
      void refetchInventory();
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
      {/* Статы */}
      <div className="games-panel flex flex-wrap items-center justify-center gap-3 py-2 px-3">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-[var(--primary)]" aria-hidden />
          <strong className="text-[var(--primary)]">{res.balance}</strong>
          <span className="games-muted text-sm">монет</span>
        </span>
        <span className="games-muted text-sm">Рейтинг <strong className="text-[var(--foreground)]">{res.combatRating}</strong></span>
        <span className="games-muted text-sm">В отряде <strong className="text-[var(--foreground)]">{activeRoster.length}/{maxActive}</strong></span>
        <span className="games-muted text-sm">Всего учеников <strong className="text-[var(--foreground)]">{disciples.length}</strong></span>
        {warehouseRoster.length > 0 ? (
          <span className="games-muted text-sm">В казарме <strong className="text-[var(--foreground)]">{warehouseRoster.length}</strong></span>
        ) : null}
        <span className="games-muted text-sm">Карточки <strong className="text-[var(--foreground)]">{cardsSummary.total}</strong></span>
        <span className="games-muted text-sm">Готовы <strong className="text-[var(--foreground)]">{cardsSummary.upgradeReady}</strong></span>
        {cardsSummary.missing > 0 ? (
          <span className="games-muted text-sm">Не получено <strong className="text-[var(--foreground)]">{cardsSummary.missing}</strong></span>
        ) : null}
      </div>

      {libraryLive && (
        <div className="games-panel py-3 px-4">
          <h3 className="games-panel-title flex items-center gap-2 text-base mb-2">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" aria-hidden />
            Библиотека
          </h3>
          <p className="games-muted text-xs mb-2">
            Уровень библиотеки открывает продвинутые техники. Растёт за вылазки, изучение техник и свиток знаний (ниже).
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[var(--foreground)]">Ур. {libraryLive.level}</span>
            <span
              className="h-2 w-28 min-w-[7rem] rounded-full bg-[var(--muted)] overflow-hidden"
              role="progressbar"
              aria-valuenow={libraryLive.exp}
              aria-valuemin={0}
              aria-valuemax={libraryLive.expToNext}
            >
              <span
                className="block h-full rounded-full bg-violet-500/90"
                style={{
                  width: `${Math.min(100, (libraryLive.exp / Math.max(1, libraryLive.expToNext)) * 100)}%`,
                }}
              />
            </span>
            <span className="games-muted text-xs">
              {libraryLive.exp}/{libraryLive.expToNext} до след. уровня
            </span>
          </div>
          {scrollOffer && typeof scrollOffer.priceCoins === "number" ? (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[var(--foreground)]">Свиток знаний</div>
                <p className="games-muted text-[11px]">
                  +{(scrollOffer as { libraryExp?: number }).libraryExp ?? 0} опыта библиотеки за монеты
                </p>
              </div>
              <button
                type="button"
                disabled={isBuyingShop || (res?.balance ?? 0) < scrollOffer.priceCoins}
                onClick={() => handleBuyShop(String(scrollOffer.offerId))}
                className="games-btn games-btn-secondary games-btn-sm inline-flex items-center gap-1 shrink-0"
              >
                Купить {scrollOffer.priceCoins}
                <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {shopOffersExceptScroll.length > 0 && (
        <div className="games-panel py-3 px-4">
          <h3 className="games-panel-title flex items-center gap-2 text-base mb-2">
            <ShoppingBag className="w-4 h-4 text-[var(--primary)]" aria-hidden />
            Лавка (алхимия и бои)
          </h3>
          <p className="games-muted text-xs mb-3">Расходники для боёв и алхимии. Свиток знаний — в блоке «Библиотека».</p>
          <div className="flex flex-wrap gap-2">
            {shopOffersExceptScroll.map((offer: { offerId: string; label: string; priceCoins: number }) => (
              <button
                key={offer.offerId}
                type="button"
                disabled={isBuyingShop || (res?.balance ?? 0) < offer.priceCoins}
                onClick={() => handleBuyShop(offer.offerId)}
                className="games-btn games-btn-secondary games-btn-sm text-left inline-flex flex-col items-start gap-0.5 max-w-[220px]"
              >
                <span className="text-xs font-medium text-[var(--foreground)]">{offer.label}</span>
                <span className="text-[11px] games-muted inline-flex items-center gap-1">
                  {offer.priceCoins}
                  <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
        <p className="games-muted text-sm mb-3">
          Активный отряд участвует в боях и вылазках и получает от них опыт (основной ученик — с большей долей). Лишних можно отправить в казарму.
        </p>
        {disciples.length === 0 ? (
          <p className="games-muted text-sm">Нет учеников. Призовите кандидата выше.</p>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden /> Активный отряд (до {maxActive})
            </h4>
<div className="games-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {rosterItems.map((item) => {
              if (item.type === "warehouse-header") {
                return (
                  <div key="warehouse-header" className="col-span-full border-t border-[var(--border)] pt-4 mt-2">
                    <button
                      type="button"
                      className="w-full text-left rounded-lg -mx-1 px-1 py-1.5 hover:bg-[var(--muted)]/35 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                      onClick={() => setBarracksExpanded((v) => !v)}
                      aria-expanded={barracksExpanded}
                      aria-label={
                        barracksExpanded
                          ? `Свернуть казарму, учеников: ${warehouseRoster.length}`
                          : `Развернуть казарму, учеников: ${warehouseRoster.length}`
                      }
                    >
                      <span className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                        {barracksExpanded ? (
                          <ChevronDown className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
                        )}
                        <Warehouse className="w-4 h-4 shrink-0" aria-hidden />
                        Казарма ({warehouseRoster.length})
                      </span>
                    </button>
                    {barracksExpanded ? (
                      <p className="games-muted text-xs mt-1 mb-0 pl-6">
                        Не участвуют в боях и вылазках. Тренировка раз в день всё равно даёт им часть опыта.
                      </p>
                    ) : null}
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
              const CardWrap = "div";
              const cardClass =
                item.type === "warehouse"
                  ? "games-card games-card--compact col-span-full"
                  : "games-card games-card--compact";
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
                    <p className="font-semibold text-sm text-[var(--foreground)] truncate inline-flex items-center gap-1">
                      {d.name ?? "Ученик"}
                      {primaryId === d.characterId ? (
                        <span className="inline-flex shrink-0" title="Основной ученик">
                          <Crown className="w-3.5 h-3.5 text-amber-500" aria-hidden />
                        </span>
                      ) : null}
                    </p>
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
                  {!d.inWarehouse ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(d.characterId)}
                        disabled={primaryId === d.characterId || isSettingPrimary}
                        className="games-btn games-btn-secondary games-btn-sm"
                        title="Основной получает большую долю опыта в играх"
                      >
                        <Crown className="w-3 h-3" aria-hidden /> Основной
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWarehouseToggle(d.characterId, true)}
                        disabled={activeRoster.length <= 1 || isMovingWarehouse}
                        className="games-btn games-btn-secondary games-btn-sm"
                        title="В казарму (нужен хотя бы один активный)"
                      >
                        <Warehouse className="w-3 h-3" aria-hidden /> В казарму
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleWarehouseToggle(d.characterId, false)}
                      disabled={activeRoster.length >= maxActive || isMovingWarehouse}
                      className="games-btn games-btn-secondary games-btn-sm"
                    >
                      В отряд
                    </button>
                  )}
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
                          Ур.{d.level ?? 0}/{relatedCard.progression.nextStageRequiredLevel} ·{" "}
                          <span className="inline-flex items-center gap-0.5">
                            {relatedCard.progression.nextStageUpgradeCoins}
                            <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
                          </span>
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
                    <div className="games-muted text-[10px] font-semibold uppercase tracking-wide mb-1">
                      Техники — полный каталог по уровню и рангу; в бой до 3
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-md border border-[var(--border)]/60 bg-[var(--muted)]/10 p-1.5 space-y-1.5">
                      {sortTechniquesForLibrary(available, learned, libraryLive?.level ?? 1).map((t) => {
                        const isLearned = learned.has(t.id);
                        const isEq = equipped.has(t.id);
                        const libraryLocked = !isLearned && (t.requiredLibraryLevel ?? 1) > (libraryLive?.level ?? 1);
                        return (
                          <div
                            key={t.id}
                            className="rounded border border-[var(--border)]/80 bg-[var(--background)]/80 px-2 py-1.5"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                              <span className="text-[11px] font-medium text-[var(--foreground)] min-w-0 flex-1">
                                {t.name}
                                {typeof t.requiredLibraryLevel === "number" && t.requiredLibraryLevel > 1 ? (
                                  <span
                                    className={`ml-1 ${libraryLocked ? "text-amber-600 dark:text-amber-400" : "text-violet-500"}`}
                                    title="Минимальный уровень библиотеки для изучения"
                                  >
                                    ·Б{t.requiredLibraryLevel}
                                  </span>
                                ) : null}
                              </span>
                              {!isLearned ? (
                                <button
                                  type="button"
                                  disabled={isLearning || libraryLocked}
                                  title={
                                    libraryLocked
                                      ? `Сначала библиотека ур. ${t.requiredLibraryLevel ?? 1}`
                                      : `Изучить за ${t.learnCostCoins} монет`
                                  }
                                  onClick={async () => {
                                    try {
                                      await learnTechnique({ characterId: d.characterId, techniqueId: t.id }).unwrap();
                                      toast.success(`Изучено: ${t.name}`);
                                    } catch (e: unknown) {
                                      toast.error(getErrorMessage(e, "Не удалось изучить"));
                                    }
                                  }}
                                  className="games-btn games-btn-secondary text-[10px] py-0.5 px-1.5 inline-flex items-center gap-0.5 shrink-0 disabled:opacity-50"
                                >
                                  {libraryLocked ? "🔒" : null}
                                  {t.learnCostCoins}
                                  <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
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
                                  className={`games-btn text-[10px] py-0.5 px-1.5 shrink-0 ${isEq ? "games-btn-primary" : "games-btn-secondary"}`}
                                >
                                  {isEq ? "Снять" : "В бой"}
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] games-muted mt-0.5 flex flex-wrap gap-x-2 gap-y-0">
                              <span>{TECHNIQUE_TYPE_LABELS[t.type] ?? t.type}</span>
                              <span>сила {t.power}</span>
                              <span>кд {t.cooldownTurns}</span>
                            </div>
                            {t.description ? (
                              <details className="mt-1 text-[10px]">
                                <summary className="cursor-pointer games-muted select-none">Описание</summary>
                                <p className="mt-0.5 pl-1 border-l border-[var(--border)] text-[var(--muted-foreground)]">
                                  {t.description}
                                </p>
                              </details>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="games-muted text-[11px] mt-1.5">Нет техник по уровню и рангу ученика. Прокачайте ученика или библиотеку.</p>
                )}
                </CardWrap>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {battleResult && (() => {
        const outcomeWin = battleResult.outcome === "win";
        const serverOutcomeText =
          typeof battleResult.outcomeReason === "string" && battleResult.outcomeReason.trim()
            ? battleResult.outcomeReason.trim()
            : outcomeWin && typeof battleResult.winReason === "string" && battleResult.winReason.trim()
              ? battleResult.winReason.trim()
              : !outcomeWin && typeof battleResult.defeatReason === "string" && battleResult.defeatReason.trim()
                ? battleResult.defeatReason.trim()
                : "";
        const fullLog = Array.isArray(battleResult.battleLog) ? battleResult.battleLog : [];
        const logLimit = battleLogExpanded ? fullLog.length : Math.min(20, fullLog.length);
        const logSlice = fullLog.slice(0, logLimit);
        const getInvLabel = (id: string) => getItemLabel(id, inventoryById);

        return (
          <div
            className={`games-panel games-result-screen rounded-2xl overflow-hidden border-2 shadow-lg ${
              outcomeWin ? "games-result-win border-emerald-500/25" : "games-result-lose border-red-500/20"
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row gap-4 p-4 sm:p-5 border-b border-[var(--border)] ${
                outcomeWin ? "bg-emerald-500/[0.07]" : "bg-red-500/[0.06]"
              }`}
            >
              <div className="w-full max-w-[11rem] sm:max-w-[9.5rem] aspect-[5/4] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20 shrink-0 mx-auto sm:mx-0 shadow-inner">
                <img
                  src={outcomeWin ? GAME_ART.battle.victory : GAME_ART.battle.defeat}
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="games-panel-title mb-0 text-lg sm:text-xl">
                      {outcomeWin ? "🏆 Победа" : "💀 Поражение"}
                    </h3>
                    <p className="text-xs games-muted mt-1">Итог боя · можно закрыть и сразу искать новый матч</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBattleResult(null);
                      setLastBattleOpponent(null);
                    }}
                    className="games-btn games-btn-secondary games-btn-sm shrink-0"
                  >
                    Закрыть
                  </button>
                </div>
                {serverOutcomeText ? (
                  <p className="text-sm text-[var(--foreground)] leading-snug">{serverOutcomeText}</p>
                ) : null}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {!outcomeWin && battleDamageSummary ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/12 px-3 py-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  <p className="font-semibold text-[var(--foreground)] mb-1.5">Почему могло быть поражение</p>
                  <p className="mb-1.5">
                    По логу суммарный урон по ОЗ: ваш отряд ≈{" "}
                    <strong className="text-[var(--foreground)]">{battleDamageSummary.userDealt}</strong>
                    , противник ≈{" "}
                    <strong className="text-[var(--foreground)]">{battleDamageSummary.opponentDealt}</strong>
                    {battleDamageSummary.userHealed + battleDamageSummary.opponentHealed > 0
                      ? ` · лечение (вы +${battleDamageSummary.userHealed}, враг +${battleDamageSummary.opponentHealed})`
                      : ""}
                    .
                  </p>
                  <p>
                    Победа = чей отряд первым теряет все ОЗ, а не «кто больше настучал». Щиты, блоки и лечение сильно меняют
                    исход.
                  </p>
                  {battleDamageSummary.userDealt > battleDamageSummary.opponentDealt ? (
                    <p className="mt-2 text-[var(--foreground)] font-medium">
                      По сумме урона вы впереди, но запас ОЗ, защита и порядок ходов могли решить в пользу соперника.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {(userSquadForResult.length > 0 || opponentSquadForResult.length > 0) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
                      Ваш отряд
                    </div>
                    <div className="flex flex-wrap gap-3 justify-start">
                      {userSquadForResult.map((m, i) => (
                        <BattleSquadMemberChip key={m.characterId ?? `u-${m.name ?? i}-${i}`} member={m} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
                      Противник
                    </div>
                    <div className="flex flex-wrap gap-3 justify-start">
                      {opponentSquadForResult.length > 0 ? (
                        opponentSquadForResult.map((m, i) => (
                          <BattleSquadMemberChip key={m.characterId ?? `o-${m.name ?? i}-${i}`} member={m} />
                        ))
                      ) : (
                        <p className="games-muted text-sm">Состав не передан — смотрите лог.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {fullLog.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/8 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--border)]/60 bg-[var(--background)]/50">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Лог боя · {fullLog.length} {fullLog.length === 1 ? "событие" : "событий"}
                    </span>
                    {fullLog.length > 20 ? (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-[var(--primary)] hover:underline"
                        onClick={() => setBattleLogExpanded((v) => !v)}
                      >
                        {battleLogExpanded ? "Свернуть" : "Развернуть всё"}
                      </button>
                    ) : null}
                  </div>
                  <ul className="space-y-0 text-sm max-h-[min(22rem,50vh)] overflow-y-auto p-2 sm:p-3">
                    {logSlice.map((e: BattleLogEntry, i: number) => {
                      const buffArt = battleBuffArtForLog(e.action, e.techniqueName);
                      const line = formatBattleLogLine(e, getInvLabel);
                      return (
                        <li
                          key={`${e.turn ?? "t"}-${i}-${e.action ?? "a"}`}
                          className="text-[var(--muted-foreground)] flex items-start gap-2.5 py-2 border-b border-[var(--border)]/35 last:border-0"
                        >
                          {buffArt ? (
                            <img
                              src={buffArt}
                              alt=""
                              className="w-4 h-4 rounded-sm shrink-0 mt-0.5 object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <span className="w-4 shrink-0" aria-hidden />
                          )}
                          <span className="min-w-0 leading-snug">{line}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="games-panel overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="relative h-36 sm:h-44 md:h-48 overflow-hidden border-b border-[var(--border)]">
          <img
            src={GAME_ART.battle.arena}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
            <h3 className="games-panel-title mb-0 flex items-center gap-2 text-base sm:text-lg drop-shadow-sm">
              <Swords className="w-5 h-5 text-[var(--primary)] shrink-0" aria-hidden /> Арена
            </h3>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <p className="games-muted text-xs leading-relaxed max-w-2xl">
            В PvP выходит весь активный отряд (до {maxActive} слотов). Основной ученик сильнее влияет на опыт в тренировках и
            вылазках, но не единственный боец на арене.
          </p>
          {!opponent ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/10 px-4 py-6 sm:py-8 text-center space-y-3">
              <p className="text-sm text-[var(--foreground)] font-medium">Готовы к поединку?</p>
              <p className="text-xs games-muted max-w-md mx-auto">
                Подберём соперника по рейтингу. Перед боем можно взять до трёх расходников из сумки.
              </p>
              <button
                type="button"
                onClick={handleFindMatch}
                disabled={!res.canBattle || activeRoster.length === 0 || findingMatch || isBattling}
                className="games-btn games-btn-primary inline-flex items-center justify-center gap-2 min-w-[12rem] px-6"
              >
                {findingMatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                    Ищем…
                  </>
                ) : (
                  <>Найти противника</>
                )}
              </button>
              {!res.canBattle ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Сейчас нельзя начать бой (лимит или кулдаун).</p>
              ) : null}
              {activeRoster.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Нужен хотя бы один ученик в активном отряде.</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/[0.05] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <MatchOpponentAvatar avatarPath={opponent.avatar} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--foreground)] truncate">
                        {formatUsernameDisplay(opponent.username)}
                      </span>
                      {opponent.userId?.startsWith?.("bot:") ? (
                        <span className="games-badge-bot shrink-0">бот</span>
                      ) : null}
                    </div>
                    <p className="text-sm games-muted mt-0.5">
                      Рейтинг боя: <strong className="text-[var(--foreground)]">{opponent.combatRating ?? "—"}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpponent(null)}
                    className="games-btn games-btn-secondary games-btn-sm flex-1 sm:flex-none min-w-[6rem]"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleBattle}
                    disabled={isBattling}
                    className="games-btn games-btn-primary flex-1 sm:flex-none min-w-[7rem] inline-flex items-center justify-center gap-2"
                  >
                    {isBattling ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                    {isBattling ? "Бой…" : "В бой!"}
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--background)]/85 border border-[var(--border)] p-3 sm:p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Расходники из сумки
                  </span>
                  <span className="text-[11px] games-muted">Выберите до 3 · списываются при бое</span>
                </div>
                <BattleSupportItemGrid
                  inventory={inventory}
                  selectedIds={selectedSupportItems}
                  onToggle={(id) => toggleSupportItem(id, "normal")}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="games-panel overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
        {weekly ? (
          <>
            <div className="relative h-32 sm:h-40 md:h-44 overflow-hidden border-b border-[var(--border)]">
              <img
                src={weeklyBattleBiomeArt(typeof weekly.weeklyRating === "number" ? weekly.weeklyRating : 0)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                <h3 className="games-panel-title mb-0 flex items-center gap-2 text-base sm:text-lg drop-shadow-sm">
                  <CalendarDays className="w-5 h-5 text-[var(--primary)] shrink-0" aria-hidden /> Недельная схватка
                </h3>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="games-muted">
                  {weekly.weeklyDivision ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <Crown className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden />
                      Дивизион <strong className="text-[var(--foreground)]">{weekly.weeklyDivision}</strong>
                      {typeof weekly.weeklyRating === "number" ? (
                        <span>
                          · рейтинг <strong className="text-[var(--foreground)]">{weekly.weeklyRating}</strong>
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span>Один бой в неделю</span>
                  )}
                </div>
                {!weekly.canWeeklyBattle && weekly.nextWeeklyBattleAt ? (
                  <div className="games-muted text-xs sm:text-sm">
                    Снова:{" "}
                    <strong className="text-[var(--foreground)]">
                      {new Date(weekly.nextWeeklyBattleAt).toLocaleDateString()}
                    </strong>
                  </div>
                ) : null}
              </div>

              {!weeklyOpponent ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/10 px-4 py-6 sm:py-7 text-center space-y-3">
                  <p className="text-sm text-[var(--foreground)] font-medium">Недельный поединок</p>
                  <p className="text-xs games-muted max-w-md mx-auto">
                    Отдельный рейтинг и лимит раз в неделю. Расходники те же, что на арене.
                  </p>
                  <button
                    type="button"
                    onClick={handleFindWeeklyMatch}
                    disabled={
                      !weekly.canWeeklyBattle || activeRoster.length === 0 || findingWeeklyMatch || isWeeklyBattling
                    }
                    className="games-btn games-btn-primary inline-flex items-center justify-center gap-2 min-w-[12rem] px-6"
                  >
                    {findingWeeklyMatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                        Ищем…
                      </>
                    ) : (
                      <>Найти противника</>
                    )}
                  </button>
                  {!weekly.canWeeklyBattle ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Сейчас недельный бой недоступен.</p>
                  ) : null}
                  {activeRoster.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Нужен ученик в активном отряде.</p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.05] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <MatchOpponentAvatar avatarPath={weeklyOpponent.avatar} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)] truncate">
                            {formatUsernameDisplay(weeklyOpponent.username)}
                          </span>
                          {weeklyOpponent.userId?.startsWith?.("bot:") ? (
                            <span className="games-badge-bot shrink-0">бот</span>
                          ) : null}
                        </div>
                        {typeof weeklyOpponent.weeklyRating === "number" ? (
                          <p className="text-sm games-muted mt-0.5">
                            Недельный рейтинг:{" "}
                            <strong className="text-[var(--foreground)]">{weeklyOpponent.weeklyRating}</strong>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setWeeklyOpponent(null)}
                        className="games-btn games-btn-secondary games-btn-sm flex-1 sm:flex-none min-w-[6rem]"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleWeeklyBattle}
                        disabled={isWeeklyBattling}
                        className="games-btn games-btn-primary flex-1 sm:flex-none min-w-[7rem] inline-flex items-center justify-center gap-2"
                      >
                        {isWeeklyBattling ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                        {isWeeklyBattling ? "Бой…" : "В бой!"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[var(--background)]/85 border border-[var(--border)] p-3 sm:p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Расходники из сумки
                      </span>
                      <span className="text-[11px] games-muted">До 3 шт.</span>
                    </div>
                    <BattleSupportItemGrid
                      inventory={inventory}
                      selectedIds={selectedWeeklySupportItems}
                      onToggle={(id) => toggleSupportItem(id, "weekly")}
                    />
                  </div>
                </div>
              )}

              {leaderboard.length > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/8 p-3 sm:p-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden /> Топ недели
                  </h4>
                  <ol className="space-y-1.5 text-sm">
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <li key={entry.username} className="flex items-center justify-between gap-2">
                        <span className="games-muted text-xs w-5 shrink-0">#{i + 1}</span>
                        <span className="truncate font-medium text-[var(--foreground)] min-w-0">
                          {formatUsernameDisplay(entry.username)}
                        </span>
                        <span className="text-[var(--primary)] font-semibold shrink-0">{entry.weeklyRating}</span>
                        <span className="games-muted text-[11px] shrink-0">
                          {entry.weeklyWins}П / {entry.weeklyLosses}П
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-5">
            <h3 className="games-panel-title flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-[var(--primary)]" aria-hidden /> Недельная схватка
            </h3>
            <p className="games-muted text-sm">
              Режим появится после обновления бэкенда: 1 схватка в неделю и сезонный рейтинг.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
