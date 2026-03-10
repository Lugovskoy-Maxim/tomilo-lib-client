"use client";

import { useParams } from "next/navigation";
import AssetImage from "@/shared/ui/AssetImage";
import Link from "next/link";
import { Users2, BookOpen, Eye, Heart, ExternalLink, MessageCircle, Info } from "lucide-react";
import { useGetTeamBySlugQuery } from "@/store/api/translatorsApi";
import {
  translatorRoleLabels,
  translatorRoleColors,
  type TranslatorTeam,
  type TranslatorRole,
} from "@/types/translator";
import { getTitlePath } from "@/lib/title-paths";
import { Header } from "@/widgets";

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  if (!href?.trim()) return null;
  return (
    <a
      href={href.startsWith("http") ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)]/50 hover:bg-[var(--primary)]/10 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors text-sm"
    >
      {icon}
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>
  );
}

export default function TranslatorTeamPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: team,
    isLoading,
    isError,
  } = useGetTeamBySlugQuery(slug, {
    skip: !slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-xl bg-[var(--secondary)]/50" />
            <div className="h-8 w-2/3 rounded bg-[var(--secondary)]/50" />
            <div className="h-4 w-full rounded bg-[var(--secondary)]/30" />
            <div className="h-4 w-full rounded bg-[var(--secondary)]/30" />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Users2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Команда не найдена
            </h1>
            <p className="text-[var(--muted-foreground)] mb-4">
              Такой команды переводчиков не существует или страница удалена.
            </p>
            <Link href="/" className="text-[var(--primary)] hover:underline">
              На главную
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const t = team as TranslatorTeam & {
    titles?: {
      _id: string;
      name: string;
      slug: string;
      coverImage?: string;
      totalChapters?: number;
    }[];
  };
  const socialLinks = t.socialLinks || {};
  const donationLinks = t.donationLinks || {};
  const titles = t.titles && t.titles.length > 0 ? t.titles : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Banner */}
        {t.banner && (
          <div className="relative w-full h-40 sm:h-52 rounded-xl overflow-hidden bg-[var(--secondary)]/50 mb-6">
            <AssetImage
              src={t.banner}
              alt=""
              fill
              className="object-cover"
              loading="eager"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[var(--secondary)]/50 border-2 border-[var(--border)]">
              {t.avatar ? (
                <AssetImage
                  src={t.avatar}
                  alt={t.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users2 className="w-12 h-12 text-[var(--muted-foreground)]" />
                </div>
              )}
              {t.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[var(--background)]">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
              {t.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
              {typeof t.chaptersCount === "number" && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {t.chaptersCount} глав
                </span>
              )}
              {typeof t.subscribersCount === "number" && (
                <span className="inline-flex items-center gap-1.5">
                  <Users2 className="w-4 h-4" />
                  {t.subscribersCount} подписчиков
                </span>
              )}
              {typeof t.totalViews === "number" && t.totalViews > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {t.totalViews.toLocaleString()} просмотров
                </span>
              )}
            </div>
          </div>
        </div>

        {t.description && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              О команде
            </h2>
            <p className="text-[var(--foreground)] whitespace-pre-wrap">{t.description}</p>
          </div>
        )}

        {/* Members */}
        {t.members && t.members.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Участники
            </h2>
            <ul className="space-y-2">
              {t.members.map(member => (
                <li key={member._id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{member.name}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${translatorRoleColors[member.role as TranslatorRole] || ""}`}
                  >
                    {translatorRoleLabels[member.role as TranslatorRole] || member.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Social links */}
        {(socialLinks.telegram || socialLinks.discord || socialLinks.vk || socialLinks.website) && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Ссылки
            </h2>
            <div className="flex flex-wrap gap-2">
              {socialLinks.telegram && (
                <SocialLink
                  href={socialLinks.telegram}
                  label="Telegram"
                  icon={<MessageCircle className="w-4 h-4" />}
                />
              )}
              {socialLinks.discord && (
                <SocialLink
                  href={socialLinks.discord}
                  label="Discord"
                  icon={<MessageCircle className="w-4 h-4" />}
                />
              )}
              {socialLinks.vk && (
                <SocialLink
                  href={socialLinks.vk}
                  label="VK"
                  icon={<ExternalLink className="w-4 h-4" />}
                />
              )}
              {socialLinks.website && (
                <SocialLink
                  href={socialLinks.website}
                  label="Сайт"
                  icon={<ExternalLink className="w-4 h-4" />}
                />
              )}
            </div>
          </div>
        )}

        {/* Donation links */}
        {(donationLinks.boosty ||
          donationLinks.patreon ||
          donationLinks.donationalerts ||
          donationLinks.yoomoney) && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Поддержать
            </h2>
            <div className="flex flex-wrap gap-2">
              {donationLinks.boosty && (
                <SocialLink
                  href={donationLinks.boosty}
                  label="Boosty"
                  icon={<Heart className="w-4 h-4" />}
                />
              )}
              {donationLinks.patreon && (
                <SocialLink
                  href={donationLinks.patreon}
                  label="Patreon"
                  icon={<Heart className="w-4 h-4" />}
                />
              )}
              {donationLinks.donationalerts && (
                <SocialLink
                  href={donationLinks.donationalerts}
                  label="DonationAlerts"
                  icon={<Heart className="w-4 h-4" />}
                />
              )}
              {donationLinks.yoomoney && (
                <SocialLink
                  href={donationLinks.yoomoney}
                  label="ЮMoney"
                  icon={<Heart className="w-4 h-4" />}
                />
              )}
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Кнопка «Подписаться» на команду и встроенная поддержка донатами пока в разработке.
                Ссылки выше ведут на внешние страницы команды.
              </span>
            </p>
          </div>
        )}

        {/* Subscribers note when no donation block */}
        {!donationLinks.boosty &&
          !donationLinks.patreon &&
          !donationLinks.donationalerts &&
          !donationLinks.yoomoney && (
            <p className="mt-4 flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Функции «Подписаться на команду» и «Поддержать» пока в разработке.</span>
            </p>
          )}

        {/* Titles list with covers */}
        {titles && titles.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Переводы
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">
              Тайтлы, в переводе которых участвует команда.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {titles.map(title => (
                <Link
                  key={title._id}
                  href={getTitlePath(title)}
                  className="group block rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
                >
                  <div className="relative aspect-[3/4] bg-[var(--secondary)]/50">
                    {title.coverImage ? (
                      <AssetImage
                        src={title.coverImage}
                        alt={title.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-[var(--muted-foreground)]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="font-medium text-sm text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)]">
                      {title.name}
                    </div>
                    {typeof title.totalChapters === "number" && (
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {title.totalChapters} глав
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fallback when no titles from API but has titleIds */}
        {(!titles || titles.length === 0) && Array.isArray(t.titleIds) && t.titleIds.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              Переводы
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Команда участвует в переводе {t.titleIds.length} тайтл
              {t.titleIds.length === 1 ? "а" : "ов"}. Список отображается на страницах тайтлов.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
