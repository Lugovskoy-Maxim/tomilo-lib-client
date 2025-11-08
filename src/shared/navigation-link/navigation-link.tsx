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
}: NavigationLinkProps) {
  return (
    <div className="flex items-center px-4 py-2 hover:bg-[var(--popover)] bg-[var(--secondary)] rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      <Link href={href} className="" onClick={onClick}>
        {title}
      </Link>
    </div>
  );
}
