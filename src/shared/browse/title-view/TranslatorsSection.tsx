"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users2, ChevronRight, Crown, ExternalLink, Heart } from "lucide-react";
import { useGetTeamsByTitleQuery } from "@/store/api/translatorsApi";
import { TranslatorTeam, translatorRoleLabels, translatorRoleColors } from "@/types/translator";
import { normalizeAssetUrl } from "@/lib/asset-url";

interface TranslatorsSectionProps {
  titleId: string;
}

function TeamCard({ team }: { team: TranslatorTeam }) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const leader = team.members.find(m => m.role === "leader");
  const otherMembers = team.members.filter(m => m.role !== "leader");

  return (
    <div className="bg-[var(--background)]/60 rounded-xl p-4 border border-[var(--border)]/30 hover:border-[var(--primary)]/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--secondary)]/50 flex-shrink-0">
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
              <Users2 className="w-6 h-6 text-[var(--muted-foreground)]" />
            </div>
          )}
          {team.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[var(--background)]">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[var(--foreground)] truncate">
              {team.name}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-1">
            <span>{team.chaptersCount} глав</span>
            <span>{team.subscribersCount} подписчиков</span>
          </div>
        </div>

        {team.slug && (
          <Link
            href={`/team/${team.slug}`}
            className="p-2 rounded-lg bg-[var(--secondary)]/50 hover:bg-[var(--primary)]/10 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {team.description && (
        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
          {team.description}
        </p>
      )}

      {team.members.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Команда ({team.members.length})</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>

          {expanded && (
            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {leader && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-medium text-[var(--foreground)]">{leader.name}</span>
                </div>
              )}
              {otherMembers.map(member => (
                <div
                  key={member._id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${translatorRoleColors[member.role]}`}
                >
                  <span className="text-xs font-medium">{member.name}</span>
                  <span className="text-[10px] opacity-70">({translatorRoleLabels[member.role]})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {team.donationLinks && Object.keys(team.donationLinks).some(k => team.donationLinks?.[k as keyof typeof team.donationLinks]) && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--muted-foreground)]">Поддержать:</span>
            {team.donationLinks.boosty && (
              <a
                href={team.donationLinks.boosty}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors"
              >
                <Heart className="w-3 h-3" />
                Boosty
              </a>
            )}
            {team.donationLinks.patreon && (
              <a
                href={team.donationLinks.patreon}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Heart className="w-3 h-3" />
                Patreon
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TranslatorsSection({ titleId }: TranslatorsSectionProps) {
  const { data: teams, isLoading, error } = useGetTeamsByTitleQuery(titleId);

  if (isLoading) {
    return (
      <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
        <div className="flex items-center gap-2 mb-4">
          <Users2 className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Команда перевода</span>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-[var(--background)]/60 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/50" />
                <div className="flex-1">
                  <div className="w-32 h-4 rounded bg-[var(--secondary)]/50 mb-2" />
                  <div className="w-24 h-3 rounded bg-[var(--secondary)]/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !teams?.length) {
    return null;
  }

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center gap-2 mb-4">
        <Users2 className="w-5 h-5 text-[var(--primary)]" />
        <span className="font-medium text-[var(--foreground)]">Команда перевода</span>
        {teams.length > 1 && (
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
            {teams.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {teams.map(team => (
          <TeamCard key={team._id} team={team} />
        ))}
      </div>
    </div>
  );
}
