"use client";

import { useId, useState } from "react";
import { useGetDisciplesItemExchangeRecipesQuery, useDisciplesItemExchangeMutation } from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { ArrowRightLeft, ChevronDown, ChevronRight } from "lucide-react";

export function GameItemExchangePanel({
  title = "Обмен предметов",
  subtitle = "Соедините лишние расходники по схеме и получите нужный предмет.",
  defaultExpanded = false,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  /** Развёрнуто при первом показе (например, на вкладке алхимии). */
  defaultExpanded?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const contentId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data, isLoading, isError, refetch } = useGetDisciplesItemExchangeRecipesQuery();
  const [runExchange, { isLoading: isExchanging }] = useDisciplesItemExchangeMutation();
  const recipes = data?.data?.recipes ?? [];
  const affordableCount = recipes.filter((r) => r.canAfford).length;

  if (isLoading && !data) {
    return (
      <div
        className={`rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-3 py-2.5 sm:px-4 ${className}`}
      >
        <p className="games-muted text-sm">Загрузка схем обмена…</p>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div
        className={`rounded-xl border border-[var(--border)] px-3 py-2.5 sm:px-4 text-[var(--destructive)] text-sm ${className}`}
      >
        <p>Не удалось загрузить обмен.</p>
        <button
          type="button"
          className="games-btn games-btn-secondary games-btn-sm mt-2"
          onClick={() => void refetch()}
        >
          Повторить
        </button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--background)]/80 shadow-sm overflow-hidden ${className}`}
      aria-label={title}
    >
      <button
        type="button"
        id={`${contentId}-trigger`}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-2 sm:gap-3 px-3 py-3 sm:px-4 text-left hover:bg-[var(--muted)]/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <span className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)]">
          <ArrowRightLeft className="w-4 h-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 gap-y-1">
            <span className="font-semibold text-sm sm:text-base text-[var(--foreground)]">{title}</span>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)]/25 px-2 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
              Схем: {recipes.length}
              {affordableCount > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 ml-1.5">
                  · хватает ресурсов: {affordableCount}
                </span>
              ) : null}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)] leading-snug line-clamp-2 sm:line-clamp-none">
            {subtitle}
          </span>
        </span>
      </button>

      {expanded ? (
        <div
          id={contentId}
          role="region"
          aria-labelledby={`${contentId}-trigger`}
          className="border-t border-[var(--border)] px-3 pb-3 pt-2 sm:px-4 sm:pb-4"
        >
          <ul className="space-y-2.5">
            {recipes.map((r) => (
              <li
                key={r.recipeId}
                className={`rounded-lg border p-3 sm:p-3.5 ${
                  r.canAfford
                    ? "border-emerald-500/35 bg-emerald-500/[0.06]"
                    : "border-[var(--border)] bg-[var(--muted)]/10"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-medium text-sm text-[var(--foreground)]">{r.label}</div>
                    {r.description ? (
                      <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {r.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] sm:text-xs">
                      <span className="text-[var(--muted-foreground)] shrink-0">Отдаёте</span>
                      {r.inputs.map((inp) => (
                        <span
                          key={`${r.recipeId}-${inp.itemId}`}
                          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-medium ${
                            inp.have >= inp.count
                              ? "border-emerald-500/40 bg-emerald-500/10 text-[var(--foreground)]"
                              : "border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted-foreground)]"
                          }`}
                        >
                          {inp.name ?? inp.itemId}
                          <span className="text-[var(--muted-foreground)] font-normal mx-0.5">×</span>
                          {inp.count}
                          <span className="text-[var(--muted-foreground)] font-normal ml-1">({inp.have})</span>
                        </span>
                      ))}
                      <span className="text-[var(--muted-foreground)] px-0.5" aria-hidden>
                        →
                      </span>
                      <span className="inline-flex flex-wrap gap-1">
                        {r.outputs.map((o) => (
                          <span
                            key={o.itemId}
                            className="inline-flex items-center rounded-md border border-[var(--primary)]/35 bg-[var(--primary)]/10 px-1.5 py-0.5 font-medium text-[var(--foreground)]"
                          >
                            {o.name ?? o.itemId} ×{o.count}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!r.canAfford || isExchanging}
                    className="games-btn games-btn-secondary games-btn-sm w-full sm:w-auto shrink-0 sm:min-w-[6.5rem]"
                    onClick={async () => {
                      try {
                        await runExchange({ recipeId: r.recipeId }).unwrap();
                        toast.success(`Обмен: ${r.label}`);
                      } catch (e: unknown) {
                        toast.error(getErrorMessage(e, "Обмен не выполнен"));
                      }
                    }}
                  >
                    Обменять
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
