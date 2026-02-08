import { SlidersHorizontal } from "lucide-react";

interface MobileFilterButtonProps {
  onClick: () => void;
}

export default function MobileFilterButton({ onClick }: MobileFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden group bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
    >
      <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
      <span className="text-sm font-medium text-[var(--foreground)]">Фильтры</span>
    </button>
  );
}
