"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Users2, Search, X, Check, ChevronDown, Loader2, ExternalLink } from "lucide-react";
import { useGetTeamsQuery, useGetTeamsByTitleQuery } from "@/store/api/translatorsApi";
import { TranslatorTeam } from "@/types/translator";
import { normalizeAssetUrl } from "@/lib/asset-url";

interface TranslatorTeamSelectProps {
  titleId: string;
  selectedTeamId?: string;
  onSelect: (teamId: string | undefined, teamName: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function TranslatorTeamSelect({
  titleId,
  selectedTeamId,
  onSelect,
  label = "Команда перевода",
  placeholder = "Выберите команду",
}: TranslatorTeamSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: titleTeams, isLoading: loadingTitleTeams } = useGetTeamsByTitleQuery(titleId);
  const { data: allTeams, isLoading: loadingAllTeams } = useGetTeamsQuery({ page: 1, limit: 50 });

  const isLoading = loadingTitleTeams || loadingAllTeams;

  const teams: TranslatorTeam[] = [];
  const teamIds = new Set<string>();

  if (titleTeams) {
    titleTeams.forEach(team => {
      if (!teamIds.has(team._id)) {
        teams.push(team);
        teamIds.add(team._id);
      }
    });
  }

  if (allTeams?.teams) {
    allTeams.teams.forEach(team => {
      if (!teamIds.has(team._id)) {
        teams.push(team);
        teamIds.add(team._id);
      }
    });
  }

  const filteredTeams = searchQuery.trim()
    ? teams.filter(team => team.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : teams;

  const selectedTeam = teams.find(t => t._id === selectedTeamId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (team: TranslatorTeam) => {
    onSelect(team._id, team.name);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect(undefined, undefined);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">{label}</label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-left transition-colors hover:border-[var(--primary)]/50 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedTeam ? (
            <>
              {selectedTeam.avatar ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={normalizeAssetUrl(selectedTeam.avatar)}
                    alt={selectedTeam.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                  <Users2 className="w-3 h-3 text-[var(--muted-foreground)]" />
                </div>
              )}
              <span className="truncate text-[var(--foreground)]">{selectedTeam.name}</span>
              {selectedTeam.isVerified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </>
          ) : (
            <span className="text-[var(--muted-foreground)]">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedTeam && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск команды..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                {searchQuery ? "Команды не найдены" : "Нет доступных команд"}
              </div>
            ) : (
              <div className="p-1">
                {titleTeams && titleTeams.length > 0 && !searchQuery && (
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                    Команды этого тайтла
                  </div>
                )}

                {filteredTeams.map(team => {
                  const isSelected = team._id === selectedTeamId;
                  const isFromTitle = titleTeams?.some(t => t._id === team._id);

                  return (
                    <button
                      key={team._id}
                      type="button"
                      onClick={() => handleSelect(team)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "hover:bg-[var(--accent)] text-[var(--foreground)]"
                      }`}
                    >
                      {team.avatar ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={normalizeAssetUrl(team.avatar)}
                            alt={team.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                          <Users2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{team.name}</span>
                          {team.isVerified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {isFromTitle && !searchQuery && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                              этот тайтл
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {team.chaptersCount} глав · {team.members.length} участников
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedTeam && (
            <div className="p-2 border-t border-[var(--border)]">
              <a
                href={`/translators/${selectedTeam.slug || selectedTeam._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Открыть страницу команды
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
