"use client";

import { Gamepad2, Sparkles } from "lucide-react";

const QUICK_CHIPS = [
  "Инвентарь и предметы",
  "Ежедневные квесты",
  "Ученики и арена",
  "Колесо и алхимия",
] as const;

export function GamesHubHero() {
  return (
    <section className="games-hero" aria-labelledby="games-hub-title">
      <div className="games-hero-glow" aria-hidden />
      <div className="max-w-7xl mx-auto px-3 pt-6 pb-5 sm:px-4 sm:pt-8 sm:pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 mb-3 flex-wrap">
              <span className="games-hero-icon" aria-hidden>
                <Gamepad2 className="w-5 h-5" />
              </span>
              <span className="games-hero-beta">бета</span>
            </div>
            <h1 id="games-hub-title" className="games-hero-title">
              Арена наставника
            </h1>
            <p className="games-hero-lead">
              Игровой хаб читателя: награды за активность, коллекция, походы и мини-сражения — в одном месте.
            </p>
          </div>
          <div className="games-hero-aside shrink-0 mx-auto sm:mx-0 sm:max-w-[280px] w-full">
            <p className="games-hero-aside-label">
              <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 align-text-bottom opacity-90" aria-hidden />
              С чего начать
            </p>
            <p className="games-hero-aside-text">
              Зайдите в «Квесты» и «Колесо», проверьте «Инвентарь». Учеников и экспедиции откройте, когда появятся монеты.
            </p>
          </div>
        </div>
        <ul className="games-hero-chips mt-5 sm:mt-6" role="list">
          {QUICK_CHIPS.map(label => (
            <li key={label}>
              <span className="games-hero-chip">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
