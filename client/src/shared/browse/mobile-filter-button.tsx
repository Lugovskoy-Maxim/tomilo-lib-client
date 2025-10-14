import { Filter } from "lucide-react";

interface MobileFilterButtonProps {
  onClick: () => void;
}

export default function MobileFilterButton({ onClick }: MobileFilterButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="lg:hidden bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-[var(--accent)] transition-colors cursor-pointer"
    >
      <Filter className="w-4 h-4" />
      Фильтры
    </button>
  );
}