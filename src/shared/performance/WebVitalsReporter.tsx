"use client";

import { useReportWebVitals } from "next/web-vitals";

const LOG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_WEB_VITALS_LOG === "1";

/**
 * Логирует Core Web Vitals в консоль (FCP, LCP, CLS, INP, TTFB).
 * В dev — всегда; в prod — только при NEXT_PUBLIC_WEB_VITALS_LOG=1.
 */
export default function WebVitalsReporter() {
  useReportWebVitals(metric => {
    if (!LOG) return;
    const display =
      metric.name === "CLS" ? metric.value.toFixed(3) : `${Math.round(metric.value)} ms`;
    console.info(`[Web Vitals] ${metric.name}: ${display} (${metric.rating})`, metric);
  });
  return null;
}
