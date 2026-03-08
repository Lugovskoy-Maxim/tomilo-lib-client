"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { Footer, Header } from "@/widgets";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RateLimitError from "@/shared/error-state/RateLimitError";

function RateLimitContent() {
  const searchParams = useSearchParams();
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  useEffect(() => {
    const urlSeconds = searchParams.get("seconds");
    if (urlSeconds) {
      const seconds = parseInt(urlSeconds, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setRemainingSeconds(seconds);
        return;
      }
    }
    const stored = localStorage.getItem("rateLimitRemaining");
    if (stored) {
      const seconds = parseInt(stored, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setRemainingSeconds(seconds);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("rateLimitRemaining", remainingSeconds.toString());
  }, [remainingSeconds]);

  usePageTitle("Слишком много запросов — Tomilo-lib");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex min-h-0 flex-1 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4 py-12 sm:py-16">
        <RateLimitError remainingSeconds={remainingSeconds} />
      </main>
      <Footer />
    </div>
  );
}

export default function RateLimitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--background)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      }
    >
      <RateLimitContent />
    </Suspense>
  );
}
