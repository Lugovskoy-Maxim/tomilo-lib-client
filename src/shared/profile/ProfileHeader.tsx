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
    <div className="mb-2 w-full">
      <div className="flex justify-between items-center gap-3">
        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="group flex items-center cursor-pointer justify-center gap-1.5 sm:gap-2 px-2 py-2 min-[360px]:px-3 sm:px-4 sm:py-3 bg-[var(--card)]/90 backdrop-blur-sm text-[var(--foreground)] rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all duration-300 font-medium border border-[var(--border)] hover:border-[var(--primary)] shadow-sm hover:shadow-md hover:shadow-[var(--primary)]/20"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline text-sm">Назад</span>
          </button>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="group flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 rounded-xl font-semibold hover:from-red-500/20 hover:to-orange-500/20 transition-all duration-300 text-xs sm:text-sm border border-red-500/30 hover:border-red-500/50 shadow-sm hover:shadow-lg hover:shadow-red-500/20"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="hidden sm:inline">Админ</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;
