"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, User, ChevronLeft, ChevronRight, Plus, X, Search } from "lucide-react";
import { useGetCharactersQuery, charactersApi } from "@/store/api/charactersApi";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { Character, characterRoleLabels, characterRoleColors } from "@/types/character";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { Header, Footer } from "@/widgets";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { CharacterProposalForm } from "@/shared/browse/character-form/CharacterProposalForm";
import { getTitlePath } from "@/lib/title-paths";

const PAGE_SIZE = 24;

function CharacterCard({ character }: { character: Character }) {
  const [imageError, setImageError] = useState(false);
  const { data: title } = useGetTitleByIdQuery(
    { id: character.titleId, includeChapters: false },
    { skip: !character.titleId },
  );
  return (
    <Link
      href={`/characters/${character._id}`}
      className="group flex flex-col items-center gap-2 p-4 bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/40 hover:bg-[var(--secondary)]/80 hover:border-[var(--primary)]/30 transition-all duration-300 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] cursor-pointer"
    >
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--background)]/50 flex-shrink-0 ring-2 ring-[var(--border)]/30 group-hover:ring-[var(--primary)]/30 transition-all">
        {character.image && !imageError ? (
          <Image
            src={normalizeAssetUrl(character.image)}
            alt={character.name}
            fill
            sizes="80px"
            loading="lazy"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-10 h-10 text-[var(--muted-foreground)]" />
          </div>
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <h3 className="font-medium text-sm text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
          {character.name}
        </h3>
        <span
          className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${characterRoleColors[character.role]}`}
        >
          {characterRoleLabels[character.role]}
        </span>
        {title?.name && (
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)] truncate">
            из{" "}
            <Link
              href={getTitlePath(title)}
              className="text-[var(--primary)] hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {title.name}
            </Link>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CharactersListClient() {
  const [page, setPage] = useState(1);
  const [showProposalSection, setShowProposalSection] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [titleSearchTrigger, setTitleSearchTrigger] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<{ _id: string; name: string } | null>(null);

  const { data, isLoading, isError } = useGetCharactersQuery({
    page,
    limit: PAGE_SIZE,
  });
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [proposeCharacter, { isLoading: isProposingBasic }] =
    charactersApi.useProposeCharacterMutation();
  const [proposeWithImage, { isLoading: isProposingWithImage }] =
    charactersApi.useProposeCharacterWithImageMutation();
  const isProposing = isProposingBasic || isProposingWithImage;

  const { data: searchData } = useSearchTitlesQuery(
    { search: titleSearchTrigger || undefined, limit: 15 },
    { skip: titleSearchTrigger.length < 2 },
  );
  const searchResults = useMemo(() => searchData?.data?.data ?? [], [searchData?.data?.data]);

  const characters = data?.characters ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-[var(--secondary)]/50" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                  key={i}
                  className="rounded-xl bg-[var(--secondary)]/50 p-4 flex flex-col items-center gap-2"
                >
                  <div className="w-20 h-20 rounded-full bg-[var(--background)]/50" />
                  <div className="h-4 w-20 rounded bg-[var(--background)]/50" />
                  <div className="h-4 w-14 rounded bg-[var(--background)]/30" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Не удалось загрузить персонажей
            </h1>
            <Link
              href="/"
              className="text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              На главную
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          На главную
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Все персонажи</h1>
            <span className="text-sm text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
              {total}
            </span>
          </div>
          {isAuthenticated && (
            <>
              {!showProposalSection ? (
                <button
                  type="button"
                  onClick={() => setShowProposalSection(true)}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  Предложить персонажа
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalSection(false);
                    setSelectedTitle(null);
                    setTitleSearch("");
                    setTitleSearchTrigger("");
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                  Отмена
                </button>
              )}
            </>
          )}
        </div>

        {showProposalSection && isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 sm:p-5">
            {!selectedTitle ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Выберите тайтл, к которому относится персонаж
                </h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <input
                      type="text"
                      value={titleSearch}
                      onChange={e => setTitleSearch(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" &&
                        (e.preventDefault(), setTitleSearchTrigger(titleSearch.trim()))
                      }
                      placeholder="Поиск тайтла по названию..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setTitleSearchTrigger(titleSearch.trim())}
                    className="min-h-[40px] px-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--secondary)]/80 transition-colors"
                  >
                    Найти
                  </button>
                </div>
                {titleSearchTrigger.length >= 2 && (
                  <ul className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
                    {searchResults.length === 0 ? (
                      <li className="px-3 py-4 text-sm text-[var(--muted-foreground)]">
                        Ничего не найдено. Введите другое название.
                      </li>
                    ) : (
                      searchResults.map((t: { _id: string; name?: string }) => (
                        <li key={t._id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTitle({ _id: t._id, name: t.name ?? "Тайтл" });
                              setTitleSearch("");
                              setTitleSearchTrigger("");
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/70 transition-colors"
                          >
                            {t.name ?? t._id}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Тайтл: <span className="font-medium text-[var(--foreground)]">{selectedTitle.name}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedTitle(null)}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Сменить тайтл
                  </button>
                </div>
                <CharacterProposalForm
                  character={undefined}
                  forModeration={true}
                  submitLabel="Отправить на модерацию"
                  onSuccess={() => {
                    toast.success(
                      "Заявка отправлена на модерацию. После одобрения персонаж появится на странице тайтла и в каталоге.",
                    );
                    setShowProposalSection(false);
                    setSelectedTitle(null);
                  }}
                  onCancel={() => {
                    setShowProposalSection(false);
                    setSelectedTitle(null);
                  }}
                  onCreate={async (formData, image) => {
                    const payload = { ...formData, titleId: selectedTitle!._id };
                    if (image) {
                      await proposeWithImage({ data: payload, image }).unwrap();
                    } else {
                      await proposeCharacter(payload).unwrap();
                    }
                  }}
                  isSaving={isProposing}
                />
              </div>
            )}
          </div>
        )}

        {characters.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <User className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
            <p className="text-[var(--muted-foreground)]">Пока нет персонажей.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {characters.map(character => (
                <CharacterCard key={character._id} character={character} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="min-h-[44px] px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                <span className="text-sm text-[var(--muted-foreground)] px-3">
                  {page} из {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="min-h-[44px] px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
                >
                  Вперёд
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
