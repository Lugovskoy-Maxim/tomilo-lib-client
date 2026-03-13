"use client";

import { useGetProfileInventoryQuery } from "@/store/api/gamesApi";
import { Package } from "lucide-react";

export function InventorySection() {
  const { data, isLoading, error } = useGetProfileInventoryQuery(undefined, { skip: false });

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

  const inventory = (data?.data ?? []) as { itemId: string; count: number; name: string; icon: string }[];
  const totalItems = inventory.reduce((acc, e) => acc + e.count, 0);

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
        Всего: <strong className="text-[var(--primary)]">{totalItems}</strong> · Уникальных: <strong className="text-[var(--primary)]">{inventory.length}</strong>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {inventory.map((entry, i) => (
          <div
            key={entry.itemId}
            className="games-slot games-slot-enter"
            style={{ ["--games-slot-delay" as string]: `${Math.min(i * 30, 180)}ms` }}
          >
            <div className="games-slot-icon">
              {entry.icon ? (
                <img src={entry.icon} alt="" className="w-full h-full object-contain" />
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
    </div>
  );
}
