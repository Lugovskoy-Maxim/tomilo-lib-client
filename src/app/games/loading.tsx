export default function GamesLoading() {
  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="text-center mb-3 sm:mb-4 animate-pulse">
          <div className="h-7 bg-[var(--muted)] rounded-lg mx-auto max-w-[200px]" />
          <div className="h-4 bg-[var(--muted)]/70 rounded mt-2 mx-auto max-w-[280px]" />
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
        <div className="h-16 bg-[var(--accent)] border border-[var(--border)] rounded-[var(--radius)] animate-pulse mb-4" />
        <div className="h-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] animate-pulse" />
      </div>
    </main>
  );
}
