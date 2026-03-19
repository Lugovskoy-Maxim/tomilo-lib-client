"use client";

import type { GamesTabId } from "./GamesTabs";
import { Package, Users, FlaskConical, CircleDot, ClipboardList, LibraryBig, Compass } from "lucide-react";

const INTROS: Record<
  GamesTabId,
  { title: string; description: string; tip: string; icon: React.ComponentType<{ className?: string }> }
> = {
  inventory: {
    title: "Сумка",
    description: "Предметы, полученные за чтение глав, квесты и колесо судьбы.",
    tip: "Читайте главы и выполняйте ежедневные задания — предметы появятся здесь.",
    icon: Package,
  },
  quests: {
    title: "Ежедневные квесты",
    description: "Явные награды, статусы выполнения и быстрый claim без поиска по профилю.",
    tip: "Здесь удобно забирать квестовые награды и сразу видеть, какие предметы могут выпасть дополнительно.",
    icon: ClipboardList,
  },
  disciples: {
    title: "Учитель и ученики",
    description: "Призывайте персонажей за монеты, тренируйте их, изучайте техники и сражайтесь на арене.",
    tip: "Учеников призывают за игровые монеты (призыв кандидата). Тренировка и арена — за монеты. Недельная схватка даёт больше наград.",
    icon: Users,
  },
  expedition: {
    title: "Экспедиция",
    description: "Отправляйте отряд в поход: лёгкая, обычная или тяжёлая сложность. Риск засады и награды.",
    tip: "Нужен хотя бы один ученик. Талисман экспедиции защитит от засады. Монеты и предметы — вам, опыт — первому в отряде.",
    icon: Compass,
  },
  cards: {
    title: "Карточки персонажей",
    description: "Коллекция, этапы F → SSS, апгрейды и прогресс по ученикам в одном месте.",
    tip: "Собирайте копии, конвертируйте дубликаты в осколки и усиливайте карточки, когда персонаж дорастёт до нужного уровня.",
    icon: LibraryBig,
  },
  alchemy: {
    title: "Алхимия пилюль",
    description: "Собирайте ингредиенты и варите пилюли раз в день.",
    tip: "Ингредиенты падают за чтение и из колеса. Качество варки влияет на награды.",
    icon: FlaskConical,
  },
  wheel: {
    title: "Колесо судьбы",
    description: "Один спин в день — монеты, опыт или редкие предметы.",
    tip: "Копите монеты на призыв учеников и тренировки. Колесо помогает пополнить запас.",
    icon: CircleDot,
  },
};

interface GamesHubIntroProps {
  activeTab: GamesTabId;
}

export function GamesHubIntro({ activeTab }: GamesHubIntroProps) {
  const { title, description, tip, icon: Icon } = INTROS[activeTab];
  return (
    <div className="games-intro mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="games-intro-icon shrink-0">
        <Icon className="w-4 h-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="games-section-title m-0 inline">{title}</h2>
        <span className="games-muted text-sm ml-1.5">— {description}</span>
      </div>
      <p className="games-tip text-xs w-full mt-0.5 mb-0">{tip}</p>
    </div>
  );
}
