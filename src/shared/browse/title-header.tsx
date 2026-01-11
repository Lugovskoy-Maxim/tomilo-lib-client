import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface TitleHeaderProps {
  title: string | undefined;
}

export default function TitleHeader({ title }: TitleHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/titles"
            className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold truncate flex-1">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}