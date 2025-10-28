import Link from "next/link";
import { Footer, Header } from "@/widgets";

export default function ErrorState() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Пользователь не найден
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Не удалось загрузить данные профиля
          </p>
          <Link 
            href="/"
            className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}