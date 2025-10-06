import Link from "next/link";

interface NavigationLinkProps {
  href: string;
  isActive: boolean;
  title: string;
  onClick?: () => void;
  vertical?: boolean;
}

export default function NavigationLink({
  href,
  title,
  onClick,
}: NavigationLinkProps) {
  return (
    <div className="flex items-center px-4 py-2 hover:bg-[var(--popover)] bg-[var(--secondary)] rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
      <Link href={href} className="" onClick={onClick}>
        {title}
      </Link>
    </div>
  );
}
