"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function ProfileHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();

  return (
    <div className="w-full flex justify-between items-center">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-[var(--foreground)] bg-[var(--card)]/90 hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
        aria-label="Назад"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад</span>
      </button>
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-[var(--card)]/90 hover:bg-red-500/10 border border-[var(--border)] transition-colors"
        >
          <Shield className="w-4 h-4" />
          Админ
        </Link>
      )}
    </div>
  );
}

export default ProfileHeader;
