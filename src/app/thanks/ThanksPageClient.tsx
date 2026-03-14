"use client";

import Link from "next/link";
import {
  Heart,
  User,
  Trophy,
  Users,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Header, Footer } from "@/widgets";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { useGetCharacterContributorsQuery } from "@/store/api/usersApi";
import AssetImage from "@/shared/ui/AssetImage";

function ContributorRow({
  user,
  index,
  label,
}: {
  user: { _id: string; username: string; avatar?: string; charactersAcceptedCount: number };
  index: number;
  label: string;
}) {
  return (
    <Link
      href={`/user/${encodeURIComponent(user.username)}`}
      className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)]/50 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
    >
      <span className="text-sm font-medium text-[var(--muted-foreground)] w-6">
        {index + 1}
      </span>
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--background)]/50 flex-shrink-0 ring-2 ring-[var(--border)]/30">
        {user.avatar ? (
          <AssetImage
            src={user.avatar}
            alt={user.username}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-5 h-5 text-[var(--muted-foreground)]" />
          </div>
        )}
      </div>
      <span className="font-medium text-[var(--foreground)] truncate flex-1 min-w-0">
        {user.username}
      </span>
      <span className="text-sm text-[var(--primary)] font-medium whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

function pluralCharacters(n: number) {
  return n === 1
    ? "персонаж"
    : n < 5
      ? "персонажа"
      : "персонажей";
}

export default function ThanksPageClient() {
  const { data, isLoading, error } = useGetCharacterContributorsQuery({
    limit: 200,
  });

  const characterUsers = data?.users ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />
      <main className="relative min-h-screen flex-1">
        <div className="container mx-auto px-4 sm:px-5 pb-24 md:pb-20">
          <div className="max-w-3xl mx-auto mt-4 sm:mt-6">
            <Breadcrumbs
              items={[
                { name: "Главная", href: "/" },
                { name: "Благодарности", href: "/thanks", isCurrent: true },
              ]}
            />

            <div className="mt-4 space-y-6">
              {/* Общий заголовок */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-6 h-6 text-[var(--primary)]" />
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">
                    Благодарности
                  </h1>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Здесь мы благодарим тех, кто помогает наполнять каталог и
                  улучшать платформу: предлагает персонажей, идеи оформления и
                  участвует в жизни сообщества.
                </p>
              </div>

              {/* Раздел: Предложенные персонажи */}
              <section
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm p-4 sm:p-5 lg:p-6"
                aria-labelledby="thanks-characters-heading"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[var(--primary)]" />
                  <h2
                    id="thanks-characters-heading"
                    className="font-semibold text-[var(--foreground)]"
                  >
                    Предложенные персонажи
                  </h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Пользователи, чьи предложения персонажей были приняты и
                  добавлены в каталог. За каждый принятый персонаж начисляется
                  50 монет и 100 опыта.
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Рейтинг вклада
                  </span>
                </div>

                {isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center gap-4 p-3 rounded-xl bg-[var(--secondary)]/50"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--background)]/50" />
                        <div className="flex-1 h-4 rounded bg-[var(--background)]/50 w-32" />
                        <div className="h-4 rounded bg-[var(--background)]/50 w-12" />
                      </div>
                    ))}
                  </div>
                )}

                {error ? (
                  <p className="text-sm text-[var(--destructive)]">
                    Не удалось загрузить список. Попробуйте позже.
                  </p>
                ) : null}

                {!isLoading && !error && characterUsers.length === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] py-6">
                    Пока ни одного принятого предложения. Станьте первым —
                    предложите персонажа на странице тайтла!
                  </p>
                )}

                {!isLoading && !error && characterUsers.length > 0 && (
                  <ul className="space-y-2">
                    {characterUsers.map((user, index) => (
                      <li key={user._id}>
                        <ContributorRow
                          user={user}
                          index={index}
                          label={`${user.charactersAcceptedCount} ${pluralCharacters(user.charactersAcceptedCount)}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Раздел: Другие благодарности (заготовка под будущие разделы) */}
              <section
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm p-4 sm:p-5 lg:p-6"
                aria-labelledby="thanks-other-heading"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                  <h2
                    id="thanks-other-heading"
                    className="font-semibold text-[var(--foreground)]"
                  >
                    Идеи, оформление и обратная связь
                  </h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]" />
                  Благодарности за предложения оформления, помощь с переводами,
                  отчёты о ошибках и другие формы участия появятся в этом разделе.
                  Следите за обновлениями!
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
