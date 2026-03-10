"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AssetImage from "@/shared/ui/AssetImage";
import Link from "next/link";
import { Users, User, ChevronLeft, Plus, X } from "lucide-react";
import { useGetTitleBySlugQuery } from "@/store/api/titlesApi";
import {
  useGetCharactersByTitleQuery,
  useCreateCharacterMutation,
  useCreateCharacterWithImageMutation,
  useProposeCharacterMutation,
  useProposeCharacterWithImageMutation,
} from "@/store/api/charactersApi";
import { Character, characterRoleLabels, characterRoleColors } from "@/types/character";
import { Header, Footer } from "@/widgets";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { CharacterProposalForm } from "@/shared/browse/character-form/CharacterProposalForm";

function CharacterCard({ character }: { character: Character }) {
  const [imageError, setImageError] = useState(false);
  return (
    <Link
      href={`/characters/${character._id}`}
      className="group flex flex-col items-center gap-2 p-4 bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/40 hover:bg-[var(--secondary)]/80 hover:border-[var(--primary)]/30 transition-all duration-300 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] cursor-pointer"
    >
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--background)]/50 flex-shrink-0 ring-2 ring-[var(--border)]/30 group-hover:ring-[var(--primary)]/30 transition-all">
        {character.image && !imageError ? (
          <AssetImage
            src={character.image}
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
      </div>
    </Link>
  );
}

export default function TitleCharactersPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin";

  const { data: title, isLoading: titleLoading, isError: titleError } = useGetTitleBySlugQuery(
    { slug, includeChapters: false },
    { skip: !slug },
  );
  const titleId = title?._id ?? "";
  const { data, isLoading: charsLoading, isError: charsError } = useGetCharactersByTitleQuery(
    titleId,
    { skip: !titleId },
  );

  const [createCharacter, { isLoading: isCreatingBasic }] = useCreateCharacterMutation();
  const [createWithImage, { isLoading: isCreatingWithImage }] =
    useCreateCharacterWithImageMutation();
  const [proposeCharacter, { isLoading: isProposingBasic }] = useProposeCharacterMutation();
  const [proposeWithImage, { isLoading: isProposingWithImage }] =
    useProposeCharacterWithImageMutation();

  const isCreating = isCreatingBasic || isCreatingWithImage;
  const isProposing = isProposingBasic || isProposingWithImage;

  const characters = data?.characters ?? [];
  const isLoading = titleLoading || charsLoading;
  const isError = titleError || charsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 rounded bg-[var(--secondary)]/50" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-xl bg-[var(--secondary)]/50 p-4 flex flex-col items-center gap-2">
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

  if (isError || !title) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Тайтл или персонажи не найдены
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

  const mainCharacters = characters.filter(c => c.role === "main");
  const supporting = characters.filter(c => c.role === "supporting");
  const antagonists = characters.filter(c => c.role === "antagonist");
  const minor = characters.filter(c => c.role === "minor");
  const other = characters.filter(c => c.role === "other" || !c.role);
  const sortedCharacters = [
    ...mainCharacters,
    ...antagonists,
    ...supporting,
    ...minor,
    ...other,
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Тайтлы", href: "/titles" },
            { name: title.name || "Тайтл", href: `/titles/${title.slug}` },
            { name: "Персонажи", isCurrent: true },
          ]}
          className="mb-6"
        />
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/titles/${title.slug}`}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]"
          >
            <ChevronLeft className="w-4 h-4" />
            К тайтлу
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Персонажи — {title.name}
            </h1>
            <span className="text-sm text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
              {characters.length}
            </span>
          </div>
          {isAuthenticated && titleId && (
            <>
              {!showForm ? (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  {isAdmin ? "Добавить персонажа" : "Предложить персонажа"}
                </button>
              ) : (
                <div className="w-full mt-2 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      {isAdmin ? "Новый персонаж" : "Новый персонаж (на модерацию)"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                      aria-label="Закрыть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CharacterProposalForm
                    character={undefined}
                    forModeration={!isAdmin}
                    submitLabel={isAdmin ? "Добавить" : "Отправить на модерацию"}
                    onSuccess={() => {
                      if (isAdmin) {
                        toast.success("Персонаж добавлен");
                      } else {
                        toast.success(
                          "Заявка отправлена на модерацию. После одобрения персонаж появится на странице.",
                        );
                      }
                      setShowForm(false);
                    }}
                    onCancel={() => setShowForm(false)}
                    onCreate={async (formData, image) => {
                      const payload = { ...formData, titleId };
                      if (isAdmin) {
                        if (image) {
                          await createWithImage({ data: payload, image }).unwrap();
                        } else {
                          await createCharacter(payload).unwrap();
                        }
                      } else {
                        if (image) {
                          await proposeWithImage({ data: payload, image }).unwrap();
                        } else {
                          await proposeCharacter(payload).unwrap();
                        }
                      }
                    }}
                    isSaving={isAdmin ? isCreating : isProposing}
                  />
                </div>
              )}
            </>
          )}
        </div>
        {characters.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <User className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
            <p className="text-[var(--muted-foreground)]">Пока нет добавленных персонажей.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedCharacters.map(character => (
              <CharacterCard key={character._id} character={character} />
            ))}
          </div>
        )}
        {characters.length === 0 && showForm && (
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            После добавления персонаж появится в списке выше.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
