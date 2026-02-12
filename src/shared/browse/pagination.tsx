interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav className="flex justify-center items-center gap-2 flex-wrap" aria-label="Пагинация">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2.5 text-sm font-medium bg-[var(--card)] border border-[var(--border)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] hover:border-[var(--border)] transition-colors cursor-pointer text-[var(--foreground)]"
      >
        Назад
      </button>

      <div className="flex gap-1.5">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page =
            currentPage <= 3
              ? i + 1
              : currentPage >= totalPages - 2
                ? totalPages - 4 + i
                : currentPage - 2 + i;

          if (page < 1 || page > totalPages) return null;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[2.5rem] h-10 px-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                currentPage === page
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2.5 text-sm font-medium bg-[var(--card)] border border-[var(--border)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors cursor-pointer text-[var(--foreground)]"
      >
        Вперед
      </button>
    </nav>
  );
}
