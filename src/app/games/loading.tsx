export default function GamesLoading() {
  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <div className="border-b border-[var(--border)] bg-[color-mix(in_oklch,var(--primary)_8%,var(--background))]">
        <div className="max-w-7xl mx-auto px-3 pt-6 pb-5 sm:px-4 sm:pt-8 sm:pb-6">
          <div className="flex justify-center sm:justify-start gap-2 mb-4 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-[var(--muted)]/80" />
            <div className="h-6 w-14 rounded-full bg-[var(--muted)]/70 self-center" />
          </div>
          <div className="h-8 bg-[var(--muted)] rounded-lg mx-auto sm:mx-0 max-w-[280px] animate-pulse mb-3" />
          <div className="h-4 bg-[var(--muted)]/70 rounded mx-auto sm:mx-0 max-w-[min(100%,420px)] animate-pulse mb-6" />
          <div className="h-24 max-w-md mx-auto sm:mx-0 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] animate-pulse" />
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-7 w-28 rounded-full bg-[var(--muted)]/60 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-b border-[var(--border)] bg-[color-mix(in_oklch,var(--background)_88%,transparent)]">
        <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="h-3 w-16 bg-[var(--muted)]/50 rounded mx-auto sm:mx-0 mb-2 animate-pulse" />
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-9 w-[4.5rem] sm:w-24 bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
        <div className="h-16 bg-[var(--accent)] border border-[var(--border)] rounded-[var(--radius)] animate-pulse mb-4" />
        <div className="h-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] animate-pulse" />
      </div>
    </main>
  );
}
