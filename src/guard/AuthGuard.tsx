"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useMounted";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  requiredRole?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/",
  requiredRole,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const hasMounted = useMounted();

  useEffect(() => {
    if (!isLoading && hasMounted) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push("/profile");
      } else if (requiredRole && user && user.role !== requiredRole) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router, hasMounted, requiredRole, user]);

  // Same outer wrapper as layout content area so server/client HTML structure matches (avoids hydration mismatch)
  const contentWrapperClass = "max-lg:pb-[var(--mobile-footer-bar-height)]";

  if (!hasMounted) {
    return (
      <div className={contentWrapperClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={contentWrapperClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <div className={contentWrapperClass} />;
  }

  if (!requireAuth && isAuthenticated) {
    return <div className={contentWrapperClass} />;
  }

  if (requiredRole && user && user.role !== requiredRole) {
    return <div className={contentWrapperClass} />;
  }

  // Без обёртки: layout уже даёт max-lg:pb, лишний div давал двойной отступ и ломал вёрстку
  return <>{children}</>;
}
