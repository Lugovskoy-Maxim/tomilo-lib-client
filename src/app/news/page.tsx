"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Megaphone } from "lucide-react";
import { useGetAnnouncementsQuery } from "@/store/api/announcementsApi";
import { Header, Footer } from "@/widgets";
import Pagination from "@/shared/browse/pagination";

const PER_PAGE = 10;

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetAnnouncementsQuery({
    page,
    limit: PER_PAGE,
  });

  const announcements = data?.data?.announcements ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const total = data?.data?.total ?? 0;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[var(--header-height)] pb-12">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            На главную
          </Link>

          <div className="flex items-center gap-2 mb-6">
            <Megaphone className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Новости и объявления</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-[var(--muted)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-[var(--muted-foreground)]">Не удалось загрузить новости.</p>
          ) : announcements.length === 0 ? (
            <p className="text-[var(--muted-foreground)]">Пока нет объявлений.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {announcements.map(a => (
                  <li key={a.id}>
                    <Link
                      href={`/news/${encodeURIComponent(a.slug)}`}
                      className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--accent)]/30 transition-colors"
                    >
                      <span className="font-medium text-[var(--foreground)]">{a.title}</span>
                      {a.shortDescription && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                          {a.shortDescription}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
