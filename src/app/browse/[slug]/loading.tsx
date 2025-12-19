import { Footer, Header } from "@/widgets";

export default function LoadingState() {
  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed max-h-screen -0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed max-h-screen inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="flex-1 relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[59vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <p className="text-[var(--muted-foreground)]">
                Загрузка данных тайтла...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}