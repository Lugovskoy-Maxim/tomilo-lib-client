import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";

interface NavigationFooterProps {
  title: Title;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}

export default function NavigationFooter({ title, prevChapter, nextChapter }: NavigationFooterProps) {
  return (
    <div className="bg-[var(--background)] border-t border-[var(--border)] py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {prevChapter ? (
              <Link
                href={`/titles/${title.slug || title._id}/chapter/${prevChapter._id || prevChapter.number}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <div className="text-sm text-[var(--muted-foreground)]">Предыдущая</div>
                  <div className="font-medium">Глава {prevChapter.number}</div>
                </div>
              </Link>
            ) : (
              <div className="opacity-50">
                <div className="text-sm text-[var(--muted-foreground)]">Предыдущая</div>
                <div className="font-medium">Нет главы</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-center">
            <Link
              href={`/titles/${title.slug || title._id}`}
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)]"
            >
              <Home className="w-4 h-4" />
              <span>К тайтлу</span>
            </Link>
          </div>

          <div className="flex-1 flex justify-end">
            {nextChapter ? (
              <Link
                href={`/titles/${title.slug || title._id}/chapter/${nextChapter._id || nextChapter.number}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group ml-auto"
              >
                <div className="text-right">
                  <div className="text-sm text-[var(--muted-foreground)]">Следующая</div>
                  <div className="font-medium">Глава {nextChapter.number}</div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href={`/titles/${title.slug || title._id}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group ml-auto"
              >
                <div className="text-right">
                  <div className="text-sm text-[var(--muted-foreground)]">Следующая</div>
                  <div className="font-medium">К тайтлу</div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
