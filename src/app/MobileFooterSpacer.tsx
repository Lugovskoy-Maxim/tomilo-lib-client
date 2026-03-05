"use client";

/**
 * Wraps layout children in a div that adds bottom padding on mobile (for fixed footer).
 * Implemented as a client component so the same wrapper is present in both server and
 * client trees, avoiding hydration mismatch when RSC streams page content.
 */
export function MobileFooterSpacer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-footer-spacer" suppressHydrationWarning>
      {children}
    </div>
  );
}
