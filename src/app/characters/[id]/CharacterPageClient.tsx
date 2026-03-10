"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AssetImage from "@/shared/ui/AssetImage";
import Link from "next/link";
import {
  User,
  Mic,
  BookOpen,
  Sparkles,
  ChevronLeft,
  Edit2,
  X,
} from "lucide-react";
import {
  useGetCharacterByIdQuery,
  useProposeCharacterUpdateMutation,
  useProposeCharacterImageMutation,
} from "@/store/api/charactersApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import {
  characterRoleLabels,
  characterRoleColors,
} from "@/types/character";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Header, Footer } from "@/widgets";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { CharacterProposalForm } from "@/shared/browse/character-form/CharacterProposalForm";

export default function CharacterPageClient() {
  const params = useParams();
  const id = params.id as string;
  const [showEditForm, setShowEditForm] = useState(false);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const { data: character, isLoading, isError } = useGetCharacterByIdQuery(id, {
    skip: !id,
  });
  const { data: title } = useGetTitleByIdQuery(
    { id: character?.titleId ?? "" },
    { skip: !character?.titleId },
  );
  const [proposeUpdate, { isLoading: isProposingUpdate }] =
    useProposeCharacterUpdateMutation();
  const [proposeImage] = useProposeCharacterImageMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 rounded bg-[var(--secondary)]/50" />
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl bg-[var(--secondary)]/50" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-3/4 rounded bg-[var(--secondary)]/50" />
                <div className="h-4 w-20 rounded bg-[var(--secondary)]/30" />
              </div>
            </div>
            <div className="h-4 w-full rounded bg-[var(--secondary)]/30" />
            <div className="h-4 w-full rounded bg-[var(--secondary)]/30" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <User className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Персонаж не найден
            </h1>
            <p className="text-[var(--muted-foreground)] mb-4">
              Такого персонажа не существует или страница удалена.
            </p>
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

  const hasDetails =
    character.description ||
    (character.altNames?.length ?? 0) > 0 ||
    character.voiceActor ||
    character.age ||
    character.gender ||
    character.guild ||
    character.clan;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
        <Link
          href={title?.slug ? `/titles/${title.slug}` : "/"}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {title?.name ?? "К тайтлу"}
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[var(--secondary)] flex-shrink-0">
                {character.image ? (
                  <AssetImage
                    src={character.image}
                    alt={character.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-[var(--foreground)] truncate">
                  {character.name}
                </h1>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${characterRoleColors[character.role]}`}
                >
                  {characterRoleLabels[character.role]}
                </span>
              </div>
            </div>

            {character.description && (
              <div>
                <h2 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Описание
                </h2>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {character.description}
                </p>
              </div>
            )}

            {(character.altNames?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Другие имена
                </h2>
                <p className="text-sm text-[var(--foreground)]">
                  {character.altNames!.join(", ")}
                </p>
              </div>
            )}

            {(character.voiceActor || character.age || character.gender) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {character.voiceActor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                    <span className="text-[var(--foreground)]">
                      {character.voiceActor}
                    </span>
                  </div>
                )}
                {character.age && (
                  <div className="text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      Возраст:{" "}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {character.age}
                    </span>
                  </div>
                )}
                {character.gender && (
                  <div className="text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      Пол:{" "}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {character.gender}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(character.guild || character.clan) && (
              <div className="flex flex-wrap gap-2 text-sm">
                {character.guild && (
                  <span className="text-[var(--muted-foreground)]">
                    Гильдия:{" "}
                    <span className="text-[var(--foreground)]">
                      {character.guild}
                    </span>
                  </span>
                )}
                {character.clan && (
                  <span className="text-[var(--muted-foreground)]">
                    Клан:{" "}
                    <span className="text-[var(--foreground)]">
                      {character.clan}
                    </span>
                  </span>
                )}
              </div>
            )}

            {!hasDetails && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Дополнительная информация о персонаже пока не добавлена.
              </p>
            )}

            <div className="pt-4 border-t border-[var(--border)]">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-3">
                <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                Тайтлы
              </h2>
              {title ? (
                <Link
                  href={getTitlePath(title)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/70 border border-[var(--border)]/50 transition-colors"
                >
                  {title.coverImage ? (
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--background)]">
                      <AssetImage
                        src={title.coverImage}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-[var(--muted-foreground)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--foreground)] line-clamp-1">
                      {title.name}
                    </span>
                    {(title.type != null || title.releaseYear != null || title.rating != null || title.totalChapters != null) && (
                      <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">
                        {[
                          title.type != null ? translateTitleType(String(title.type)) : null,
                          title.releaseYear != null ? String(title.releaseYear) : null,
                          title.rating != null && title.rating > 0 ? title.rating.toFixed(1) : null,
                          title.totalChapters != null && title.totalChapters > 0 ? `${title.totalChapters} гл.` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Тайтл не найден.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-3">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                Декорации
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Связанных декораций пока нет. Если в магазине появятся рамки или
                аватарки с этим персонажем, они отобразятся здесь.
              </p>
            </div>

            {isAuthenticated && (
              <div className="pt-4 border-t border-[var(--border)]">
                {!showEditForm ? (
                  <button
                    type="button"
                    onClick={() => setShowEditForm(true)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/70 text-[var(--foreground)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Предложить правки
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]/50">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        Правки (на модерацию)
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowEditForm(false)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                        aria-label="Закрыть"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <CharacterProposalForm
                      character={character}
                      forModeration={true}
                      submitLabel="Отправить правки на модерацию"
                      onSuccess={() => {
                        toast.success(
                          "Правки отправлены на модерацию. После одобрения изменения отобразятся на странице.",
                        );
                        setShowEditForm(false);
                      }}
                      onCancel={() => setShowEditForm(false)}
                      onCreate={async () => {}}
                      onUpdate={async (formData, image) => {
                        await proposeUpdate({ id: character._id, data: formData }).unwrap();
                        if (image) {
                          await proposeImage({ id: character._id, image }).unwrap();
                        }
                      }}
                      isSaving={isProposingUpdate}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
