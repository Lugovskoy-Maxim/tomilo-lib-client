"use client";

import { Repeat } from "lucide-react";
import Link from "next/link";

export default function ProfileExchangesPage() {
  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12 text-center shadow-sm">
        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Repeat className="w-12 h-12" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Обмены
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-md mx-auto mb-6 text-sm leading-relaxed">
          Здесь вы сможете обмениваться предметами и декорациями с другими пользователями. Раздел в разработке.
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Следите за обновлениями или загляните в{" "}
          <Link href="/shop" className="text-[var(--primary)] hover:underline font-medium">
            магазин
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
