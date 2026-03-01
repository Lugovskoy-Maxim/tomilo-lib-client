"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users2, Heart, ExternalLink, ChevronDown } from "lucide-react";
import { useGetTeamsByTitleQuery } from "@/store/api/translatorsApi";
import { TranslatorTeam, translatorRoleLabels } from "@/types/translator";
import { normalizeAssetUrl } from "@/lib/asset-url";

interface ChapterTranslatorInfoProps {
  titleId: string;
  chapterTranslator?: string;
}

function TeamMiniCard({ team }: { team: TranslatorTeam }) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasDonationLinks = team.donationLinks && 
    Object.keys(team.donationLinks).some(k => team.donationLinks?.[k as keyof typeof team.donationLinks]);

  return (
    <div className="bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl p-3 border border-[var(--border)]/30">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--background)]/50 flex-shrink-0">
          {team.avatar && !imageError ? (
            <Image
              src={normalizeAssetUrl(team.avatar)}
              alt={team.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users2 className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--foreground)] truncate">
              {team.name}
            </span>
            {team.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span>{team.chaptersCount} глав</span>
            {team.subscribersCount > 0 && (
              <>
                <span>•</span>
                <span>{team.subscribersCount} подписчиков</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {team.slug && (
            <Link
              href={`/team/${team.slug}`}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
              title="Страница команды"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          {(hasDonationLinks || team.members.length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {team.members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {team.members.slice(0, 5).map(member => (
                <span
                  key={member._id}
                  className="text-xs px-2 py-1 bg-[var(--background)]/50 rounded-lg text-[var(--muted-foreground)]"
                >
                  {member.name}
                  <span className="text-[10px] opacity-60 ml-1">
                    ({translatorRoleLabels[member.role]})
                  </span>
                </span>
              ))}
              {team.members.length > 5 && (
                <span className="text-xs px-2 py-1 text-[var(--muted-foreground)]">
                  +{team.members.length - 5}
                </span>
              )}
            </div>
          )}

          {hasDonationLinks && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--muted-foreground)]">Поддержать:</span>
              {team.donationLinks?.boosty && (
                <a
                  href={team.donationLinks.boosty}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
                >
                  <Heart className="w-3 h-3" />
                  Boosty
                </a>
              )}
              {team.donationLinks?.patreon && (
                <a
                  href={team.donationLinks.patreon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Heart className="w-3 h-3" />
                  Patreon
                </a>
              )}
              {team.donationLinks?.donationalerts && (
                <a
                  href={team.donationLinks.donationalerts}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
                >
                  <Heart className="w-3 h-3" />
                  DA
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChapterTranslatorInfo({ titleId, chapterTranslator }: ChapterTranslatorInfoProps) {
  const { data: teams, isLoading } = useGetTeamsByTitleQuery(titleId);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-[var(--secondary)]/60 rounded-xl p-3 h-16" />
    );
  }

  if (!teams?.length && !chapterTranslator) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
        <Users2 className="w-3.5 h-3.5" />
        <span>Перевод</span>
      </div>

      {teams && teams.length > 0 ? (
        <div className="space-y-2">
          {teams.map(team => (
            <TeamMiniCard key={team._id} team={team} />
          ))}
        </div>
      ) : chapterTranslator ? (
        <div className="bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl p-3 border border-[var(--border)]/30">
          <span className="text-sm text-[var(--foreground)]">{chapterTranslator}</span>
        </div>
      ) : null}
    </div>
  );
}
