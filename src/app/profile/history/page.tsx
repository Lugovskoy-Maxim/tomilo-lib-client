"use client";

import { Clock } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { default as ReadingHistorySection } from "@/widgets/profile-reading/ProfileReading";

export default function ProfileHistoryPage() {
  const { userProfile } = useProfile();

  if (!userProfile) return null;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 min-h-[400px] flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border)]/60">
          <div className="p-2 rounded-xl bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              История чтения
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Все прочитанные главы
            </p>
          </div>
        </div>
        <ReadingHistorySection
          readingHistory={userProfile.readingHistory}
          showAll={true}
          showSectionHeader={false}
        />
      </div>
    </div>
  );
}
