import { Footer, Header } from "@/widgets";

export default function LoadingState() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="w-24 h-24 bg-[var(--border)] rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-[var(--border)] rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-[var(--border)] rounded w-32 mx-auto"></div>
        </div>
      </div>
      <Footer />
    </main>
  );
}