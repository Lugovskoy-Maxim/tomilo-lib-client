import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface NavigationLinkProps {
  href: string;
  isActive: boolean;
  title: string;
  onClick?: () => void;
  vertical?: boolean;
  icon?: LucideIcon;
}

export default function NavigationLink({ href, title, onClick, icon: Icon, isActive }: NavigationLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`nav-link-modern group relative flex items-center justify-center gap-2 min-h-10 min-w-10 px-4 py-2 rounded-xl overflow-hidden text-sm font-medium no-underline bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-colors duration-200 ${isActive ? "nav-link-modern--active" : ""}`}
    >
      {Icon && <Icon className="nav-link-modern__icon w-4 h-4 shrink-0 transition-transform duration-300" />}
      <span className="nav-link-modern__text relative z-[1]">{title}</span>
      <span className="nav-link-modern__glow absolute inset-0 -z-0 opacity-0 transition-opacity duration-300" aria-hidden />
    </Link>
  );
}
