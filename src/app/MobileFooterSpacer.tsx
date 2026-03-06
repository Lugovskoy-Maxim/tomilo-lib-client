/**
 * Wraps layout children in a div that adds bottom padding on mobile (for fixed footer).
 * Kept as a Server Component so the wrapper is rendered in the same order on server and
 * client, avoiding hydration mismatch when RSC streams page content.
 */
export function MobileFooterSpacer({ children }: { children: React.ReactNode }) {
  return <div className="mobile-footer-spacer">{children}</div>;
}
