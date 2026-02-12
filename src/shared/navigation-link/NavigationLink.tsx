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

export default function NavigationLink({ href, title, onClick, icon: Icon }: NavigationLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex cursor-pointer items-center justify-center gap-2 min-h-[40px] min-w-[40px] px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95"
    >
      {Icon && <Icon className="w-4 h-4 xs:w-5 xs:h-5" />}
      {title}
    </Link>
  );
}
