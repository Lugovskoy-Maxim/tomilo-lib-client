import { Period, periodLabels } from "@/hooks/usePeriodFilter";

interface PeriodFilterProps {
  activePeriod: Period;
  onPeriodChange: (period: Period) => void;
}

/**
 * Компонент фильтра периодов для топа тайтлов
 */
export default function PeriodFilter({
  activePeriod,
  onPeriodChange,
}: PeriodFilterProps) {
  return (
    <div className="flex justify-center mb-6 sm:mb-8">
      <div className="flex gap-2 p-1 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
        {(["day", "week", "month"] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activePeriod === period
                ? "bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--primary-foreground)] shadow-md"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>
    </div>
  );
}
