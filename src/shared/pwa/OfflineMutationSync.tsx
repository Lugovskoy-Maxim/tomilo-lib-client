"use client";

import { useEffect } from "react";
import { flushOfflineMutationQueue } from "@/lib/offlineMutationQueue";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function OfflineMutationSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flush = () => {
      void flushOfflineMutationQueue(API_BASE);
    };

    const onOnline = () => {
      flush();
    };

    window.addEventListener("online", onOnline);
    if (navigator.onLine) {
      flush();
    }

    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}

