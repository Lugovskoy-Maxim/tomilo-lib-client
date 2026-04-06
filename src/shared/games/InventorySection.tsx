"use client";

import { useState, useMemo } from "react";
import { Package, Search, SortAsc, Filter } from "lucide-react";
import { useGetProfileInventoryQuery } from "@/store/api/gamesApi";
import { normalizeGameInventoryList } from "@/lib/gameInventory";
import { GameItemExchangePanel } from "./GameItemExchangePanel";
import { getDecorationImageUrls } from "@/api/shop";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import Input from "@/shared/ui/input";
import Tooltip from "@/shared/ui/Tooltip";
import type { GameItemType, GameItemRarity } from "@/types/games";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count" | "rarity" | "type">("name");

  // Преобразование данных в инвентарь
  const rawInventory = useMemo(() => normalizeGameInventoryList(data), [data]);
  const inventory = useMemo(() => rawInventory.map(entry => {
    const lore = LORE_BY_ID.get(entry.itemId);
    return {
      ...entry,
      name: entry.name || lore?.name || entry.itemId,
      lore,
    };
  }), [rawInventory]);

  // Фильтрация и сортировка
  const filteredInventory = useMemo(() => {
    const filtered = inventory.filter(entry => {
      const lore = entry.lore;
      const itemType: GameItemType | null = lore?.type ?? null;
      const itemRarity: GameItemRarity | null = lore?.rarity ?? null;

      if (typeFilter !== "all" && itemType && itemType !== typeFilter) {
        return false;
      }
      if (rarityFilter !== "all" && itemRarity && itemRarity !== rarityFilter) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const name = entry.name?.toLowerCase() || "";
        const itemId = entry.itemId.toLowerCase();
        if (!name.includes(query) && !itemId.includes(query)) {
          return false;
        }
      }
      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      const loreA = a.lore;
      const loreB = b.lore;
      switch (sortBy) {
        case "name":
          return (a.name || a.itemId).localeCompare(b.name || b.itemId);
        case "count":
          return b.count - a.count;
        case "rarity": {
          const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
          const rarityA = loreA?.rarity ? rarityOrder[loreA.rarity] ?? 0 : 0;
          const rarityB = loreB?.rarity ? rarityOrder[loreB.rarity] ?? 0 : 0;
          return rarityB - rarityA; // по убыванию редкости
        }
        case "type": {
          const typeOrder = { material: 0, consumable: 1, special: 2 };
          const typeA = loreA?.type ? typeOrder[loreA.type] ?? 99 : 99;
          const typeB = loreB?.type ? typeOrder[loreB.type] ?? 99 : 99;
          return typeA - typeB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, typeFilter, rarityFilter, searchQuery, sortBy]);

  const totalItems = rawInventory.reduce((acc, e) => acc + e.count, 0);

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

  if (inventory.length === 0) {
    return (
      <div className="space-y-4">
        <GameItemExchangePanel
          title="Обмен предметов"
          subtitle="Соедините расходники по схеме — результат сразу попадёт в инвентарь."
        />
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GameItemExchangePanel
        title="Обмен предметов"
        subtitle="Соедините расходники по схеме — результат сразу попадёт в инвентарь."
      />
      <p className="games-muted text-sm">
        Всего: <strong className="text-[var(--primary)]">{totalItems}</strong> · Уникальных:{" "}
        <strong className="text-[var(--primary)]">{inventory.length}</strong>
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            type="search"
            placeholder="Поиск по названию или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            className="text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Tooltip content="Сортировка по названию" position="top" trigger="hover">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === "name"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setSortBy("name")}
            >
              <SortAsc className="w-3 h-3" />
              Название
            </button>
          </Tooltip>
          <Tooltip content="Сортировка по количеству (убывание)" position="top" trigger="hover">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === "count"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setSortBy("count")}
            >
              <SortAsc className="w-3 h-3" />
              Количество
            </button>
          </Tooltip>
          <Tooltip content="Сортировка по редкости (легендарные сначала)" position="top" trigger="hover">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === "rarity"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setSortBy("rarity")}
            >
              <Filter className="w-3 h-3" />
              Редкость
            </button>
          </Tooltip>
          <Tooltip content="Сортировка по типу" position="top" trigger="hover">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === "type"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)]/60 hover:bg-[var(--accent)]"
              }`}
              onClick={() => setSortBy("type")}
            >
              <Filter className="w-3 h-3" />
              Тип
            </button>
          </Tooltip>
        </div>
      </div>
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
<div className="games-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
<div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg bg-[var(--muted)] flex items-center justify-center overflow-hidden">
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
