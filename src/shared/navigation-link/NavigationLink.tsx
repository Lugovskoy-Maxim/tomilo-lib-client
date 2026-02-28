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
      className={`nav-link-modern group ${isActive ? "nav-link-modern--active" : ""}`}
    >
      {Icon && <Icon className="nav-link-modern__icon" />}
      <span className="nav-link-modern__text">{title}</span>
      <span className="nav-link-modern__glow" aria-hidden />
    </Link>
  );
}
