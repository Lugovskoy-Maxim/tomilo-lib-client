"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, ChevronRight, User } from "lucide-react";
import { useGetCharactersByTitleQuery } from "@/store/api/charactersApi";
import { Character, characterRoleLabels, characterRoleColors } from "@/types/character";
import { normalizeAssetUrl } from "@/lib/asset-url";

interface CharactersSectionProps {
  titleId: string;
}

function CharacterCard({ character }: { character: Character }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group flex flex-col items-center gap-2 p-3 bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/40 hover:bg-[var(--secondary)]/80 hover:border-[var(--primary)]/30 transition-all duration-300 min-w-[120px] max-w-[140px]">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--background)]/50 flex-shrink-0 ring-2 ring-[var(--border)]/30 group-hover:ring-[var(--primary)]/30 transition-all">
        {character.image && !imageError ? (
          <Image
            src={normalizeAssetUrl(character.image)}
            alt={character.name}
            fill
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
    </div>
  );
}

export function CharactersSection({ titleId }: CharactersSectionProps) {
  const { data, isLoading, error } = useGetCharactersByTitleQuery(titleId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Персонажи</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex flex-col items-center gap-2 p-3 min-w-[120px]">
              <div className="w-16 h-16 rounded-full bg-[var(--background)]/50" />
              <div className="w-20 h-4 rounded bg-[var(--background)]/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.characters?.length) {
    return null;
  }

  const characters = data.characters;
  const displayedCharacters = showAll ? characters : characters.slice(0, 6);
  const hasMore = characters.length > 6;

  const mainCharacters = characters.filter(c => c.role === "main");
  const supportingCharacters = characters.filter(c => c.role === "supporting");
  const antagonists = characters.filter(c => c.role === "antagonist");
  const minorCharacters = characters.filter(c => c.role === "minor");

  const sortedCharacters = [...mainCharacters, ...antagonists, ...supportingCharacters, ...minorCharacters];

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Персонажи</span>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
            {characters.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
          >
            {showAll ? "Свернуть" : "Все персонажи"}
            <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>

      <div className={`flex gap-3 ${showAll ? "flex-wrap" : "overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--primary)]/20 scrollbar-track-transparent"}`}>
        {(showAll ? sortedCharacters : displayedCharacters).map(character => (
          <CharacterCard key={character._id} character={character} />
        ))}
      </div>
    </div>
  );
}
