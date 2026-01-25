"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function ProfileHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center gap-2">
        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center cursor-pointer justify-center gap-2 px-2 py-1.5 sm:px-4 sm:py-3 bg-[var(--primary-foreground)] text-[var(--primary)] rounded-xl hover:bg-[var(--primary-foreground)]/80 transition-colors font-medium border border-[var(--border)] hover:border-[var(--border)]/80"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-4 sm:py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors text-xs sm:text-sm"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Админ</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;
