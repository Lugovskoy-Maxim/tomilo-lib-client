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
      <div className="flex justify-between items-center">
        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center cursor-pointer justify-center gap-2 px-4 py-3 bg-[var(--primary-foreground)] text-[var(--primary)] rounded-xl hover:bg-[var(--primary-foreground)]/80 transition-colors font-medium border border-[var(--border)] hover:border-[var(--border)]/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        {isAdmin && (
          <Link
            href="admin/titles/new"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить тайтл
          </Link>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;
