"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { useGetProfileInventoryQuery } from "@/store/api/gamesApi";
import { getDecorationImageUrls } from "@/api/shop";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import type { InventoryEntry, GameItemType, GameItemRarity } from "@/types/games";

const RARITY_LABEL: Record<GameItemRarity, string> = {
  common: "Обычный",
  uncommon: "Необычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

const RARITY_CLASS: Record<GameItemRarity, string> = {
  common: "bg-[var(--secondary)]/60 text-[var(--muted-foreground)] border-[var(--border)]/60",
  uncommon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  rare: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  epic: "bg-purple-500/10 text-purple-400 border-purple-500/40",
  legendary: "bg-amber-500/15 text-amber-400 border-amber-500/40",
};

type TypeFilter = GameItemType | "all";
type RarityFilter = GameItemRarity | "all";

const LORE_BY_ID = new Map(GAME_ITEMS_LORE.map(entry => [entry.id, entry]));

export function InventorySection() {
  const { data, isLoading, error } = useGetProfileInventoryQuery(undefined, { skip: false });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="games-empty">
        <div className="games-muted animate-pulse">Загрузка инвентаря...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        Не удалось загрузить инвентарь.
      </div>
    );
  }

  const rawInventory = (data?.data ?? []) as InventoryEntry[];

  const inventory = rawInventory.map(entry => {
    const lore = LORE_BY_ID.get(entry.itemId);
    return {
      ...entry,
      name: entry.name || lore?.name || entry.itemId,
      lore,
    };
  });

  const filteredInventory = inventory.filter(entry => {
    const lore = entry.lore;
    const itemType: GameItemType | null = lore?.type ?? null;
    const itemRarity: GameItemRarity | null = lore?.rarity ?? null;

    if (typeFilter !== "all" && itemType && itemType !== typeFilter) {
      return false;
    }
    if (rarityFilter !== "all" && itemRarity && itemRarity !== rarityFilter) {
      return false;
    }
    return true;
  });

  const totalItems = rawInventory.reduce((acc, e) => acc + e.count, 0);

  if (inventory.length === 0) {
    return (
      <div className="games-panel games-empty">
        <Package className="games-empty-icon mx-auto block" />
        <p className="games-muted mb-2">
          Сумка пуста. Собирайте предметы за чтение глав, квесты и колесо судьбы.
        </p>
        <ul className="games-muted text-sm text-left max-w-sm mx-auto space-y-1">
          <li>📖 Чтение глав — шанс дропа</li>
          <li>✅ Ежедневные квесты — награды</li>
          <li>🎡 Колесо судьбы — спин раз в день</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="games-muted text-sm">
        Всего: <strong className="text-[var(--primary)]">{totalItems}</strong> · Уникальных:{" "}
        <strong className="text-[var(--primary)]">{inventory.length}</strong>
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="px-2 py-1 rounded-full bg-[var(--secondary)]/60 border border-[var(--border)]/60">
          Фильтры:
        </span>
        <div className="flex flex-wrap gap-1">
          {(["all", "material", "consumable", "special"] as TypeFilter[]).map(value => (
            <button
              key={value}
              type="button"
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                typeFilter === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setTypeFilter(value)}
            >
              {value === "all"
                ? "Все типы"
                : value === "material"
                  ? "Материалы"
                  : value === "consumable"
                    ? "Расходники"
                    : "Особые"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "common", "uncommon", "rare", "epic", "legendary"] as RarityFilter[]).map(value => (
            <button
              key={value}
              type="button"
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                rarityFilter === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setRarityFilter(value)}
            >
              {value === "all" ? "Любая редкость" : RARITY_LABEL[value]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredInventory.map((entry, i) => (
          <div
            key={entry.itemId}
            className="games-slot games-slot-enter"
            style={{ ["--games-slot-delay" as string]: `${Math.min(i * 30, 180)}ms` }}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedItemId(entry.itemId)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedItemId(entry.itemId);
              }
            }}
          >
            <div className="games-slot-icon">
              {entry.icon ? (
                (() => {
                  const { primary, fallback } = getDecorationImageUrls(entry.icon);
                  return (
                    <img
                      src={primary}
                      onError={e => {
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  );
                })()
              ) : (
                <Package className="w-6 h-6 text-[var(--muted-foreground)]" aria-hidden />
              )}
            </div>
            <div className="games-slot-name truncate w-full block" title={entry.name || entry.itemId}>
              {entry.name || entry.itemId}
            </div>
            <div className="games-slot-count">×{entry.count}</div>
          </div>
        ))}
      </div>
      {selectedItemId && (
        (() => {
          const entry = inventory.find(e => e.itemId === selectedItemId);
          if (!entry) return null;
          const lore = entry.lore;
          const rarity = lore?.rarity ?? "common";
          const type = lore?.type;
          const rarityLabel = RARITY_LABEL[rarity as GameItemRarity];
          const rarityClass = RARITY_CLASS[rarity as GameItemRarity];

          return (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4 flex gap-3 sm:gap-4 items-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[var(--muted)] flex items-center justify-center overflow-hidden">
                {entry.icon ? (
                  (() => {
                    const { primary, fallback } = getDecorationImageUrls(entry.icon);
                    return (
                      <img
                        src={primary}
                        onError={e => {
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    );
                  })()
                ) : (
                  <Package className="w-7 h-7 text-[var(--muted-foreground)]" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)] truncate">
                    {entry.name || entry.itemId}
                  </h3>
                  {lore && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${rarityClass}`}
                    >
                      {rarityLabel}
                    </span>
                  )}
                  {type && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--secondary)]/60 text-[11px] text-[var(--muted-foreground)] border border-[var(--border)]/60">
                      {type === "material"
                        ? "Материал"
                        : type === "consumable"
                          ? "Расходник"
                          : "Особый предмет"}
                    </span>
                  )}
                </div>
                {lore?.description && (
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">{lore.description}</p>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
