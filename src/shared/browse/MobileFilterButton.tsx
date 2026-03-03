import { SlidersHorizontal } from "lucide-react";

interface MobileFilterButtonProps {
  onClick: () => void;
}

export default function MobileFilterButton({ onClick }: MobileFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
    >
      <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
      Фильтры
    </button>
  );
}
