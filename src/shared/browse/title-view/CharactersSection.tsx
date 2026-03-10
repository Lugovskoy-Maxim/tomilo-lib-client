"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, ChevronRight, User, Plus, X } from "lucide-react";
import { charactersApi } from "@/store/api/charactersApi";
import { Character, characterRoleLabels, characterRoleColors } from "@/types/character";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { CharacterProposalForm } from "@/shared/browse/character-form/CharacterProposalForm";

interface CharactersSectionProps {
  titleId: string;
  /** Slug тайтла для ссылки на страницу «Все персонажи тайтла» */
  titleSlug?: string;
}

function CharacterCard({ character }: { character: Character }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/characters/${character._id}`}
      className="group flex flex-col items-center gap-2 p-3 bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/40 hover:bg-[var(--secondary)]/80 hover:border-[var(--primary)]/30 transition-all duration-300 min-w-[120px] max-w-[140px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] cursor-pointer"
    >
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--background)]/50 flex-shrink-0 ring-2 ring-[var(--border)]/30 group-hover:ring-[var(--primary)]/30 transition-all">
        {character.image && !imageError ? (
          <Image
            src={normalizeAssetUrl(character.image)}
            alt={character.name}
            fill
            sizes="64px"
            loading="eager"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
        )}
      </div>

      <div className="text-center min-w-0 w-full">
        <h4 className="font-medium text-sm text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
          {character.name}
        </h4>
        <span
          className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${characterRoleColors[character.role]}`}
        >
          {characterRoleLabels[character.role]}
        </span>
      </div>
    </Link>
  );
}

export function CharactersSection({ titleId, titleSlug }: CharactersSectionProps) {
  const { data, isLoading, error } = charactersApi.useGetCharactersByTitleQuery(titleId);
  const [showAll, setShowAll] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [proposeCharacter, { isLoading: isProposingBasic }] =
    charactersApi.useProposeCharacterMutation();
  const [proposeWithImage, { isLoading: isProposingWithImage }] =
    charactersApi.useProposeCharacterWithImageMutation();
  const isProposing = isProposingBasic || isProposingWithImage;

  if (isLoading) {
    return (
      <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Персонажи</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="animate-pulse flex flex-col items-center gap-2 p-3 min-w-[120px]"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--background)]/50" />
              <div className="w-20 h-4 rounded bg-[var(--background)]/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const characters = data?.characters ?? [];
  const displayedCharacters = showAll ? characters : characters.slice(0, 6);
  const hasMore = characters.length > 6;

  const mainCharacters = characters.filter(c => c.role === "main");
  const supportingCharacters = characters.filter(c => c.role === "supporting");
  const antagonists = characters.filter(c => c.role === "antagonist");
  const minorCharacters = characters.filter(c => c.role === "minor");
  const otherCharacters = characters.filter(c => c.role === "other" || !c.role);

  const sortedCharacters = [
    ...mainCharacters,
    ...antagonists,
    ...supportingCharacters,
    ...minorCharacters,
    ...otherCharacters,
  ];

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Персонажи</span>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
            {characters.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {titleSlug && characters.length > 0 && (
            <Link
              href={`/titles/${titleSlug}/characters`}
              className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            >
              Страница персонажей
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            >
              {showAll ? "Свернуть" : "Развернуть"}
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex gap-3 ${showAll ? "flex-wrap" : "overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--primary)]/20 scrollbar-track-transparent"}`}
      >
        {(showAll ? sortedCharacters : displayedCharacters).map(character => (
          <CharacterCard key={character._id} character={character} />
        ))}
      </div>

      {isAuthenticated && (
        <>
          {!showProposalForm ? (
            <button
              type="button"
              onClick={() => setShowProposalForm(true)}
              className="mt-4 w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              Предложить персонажа
            </button>
          ) : (
            <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Новый персонаж (на модерацию)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CharacterProposalForm
                character={undefined}
                forModeration={true}
                onSuccess={() => {
                  toast.success(
                    "Заявка отправлена на модерацию. После одобрения персонаж появится на странице.",
                  );
                  setShowProposalForm(false);
                }}
                onCancel={() => setShowProposalForm(false)}
                onCreate={async (formData, image) => {
                  const payload = { ...formData, titleId };
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
        </>
      )}
    </div>
  );
}
