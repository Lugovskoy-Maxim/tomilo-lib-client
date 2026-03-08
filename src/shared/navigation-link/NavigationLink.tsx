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

export default function NavigationLink({
  href,
  title,
  onClick,
  icon: Icon,
  isActive,
}: NavigationLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center justify-center gap-2 min-h-10 min-w-10 px-4 py-2 rounded-xl overflow-hidden text-sm font-medium no-underline bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-[color,border-color,box-shadow,transform] duration-200 hover:text-[var(--foreground)] hover:border-[var(--primary)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${isActive ? "text-[var(--foreground)] border-[var(--primary)] bg-gradient-to-br from-[rgba(var(--primary-rgb),0.1)] to-[rgba(var(--primary-rgb),0.05)]" : ""}`}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? "text-[var(--primary)]" : "group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)]"}`}
        />
      )}
      <span className="relative z-[1]">{title}</span>
      <span
        className={`absolute inset-0 -z-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] transition-opacity duration-300 ${isActive ? "opacity-10" : "opacity-0 group-hover:opacity-10"}`}
        aria-hidden
      />
    </Link>
  );
}
