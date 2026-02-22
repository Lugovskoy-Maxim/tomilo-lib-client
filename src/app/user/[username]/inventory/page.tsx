"use client";

import { useParams } from "next/navigation";
import { useGetProfileByIdQuery, useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { Package } from "lucide-react";
import { UserProfile } from "@/types/user";
import Image from "next/image";
import { isMongoObjectId } from "@/lib/isMongoObjectId";
import { getDecorationImageUrl } from "@/api/shop";

export default function UserInventoryPage() {
  const params = useParams();
  const userParam = typeof params.username === "string" ? params.username : "";
  const loadById = isMongoObjectId(userParam);

  const usernameQuery = useGetProfileByUsernameQuery(userParam, {
    skip: !userParam || loadById,
  });
  const idQuery = useGetProfileByIdQuery(userParam, {
    skip: !userParam || !loadById,
  });
  const activeQuery = loadById ? idQuery : usernameQuery;
  const { data, isSuccess } = activeQuery;

  const userProfile = isSuccess && data?.success && data?.data ? data.data : null;
  const equipped = (userProfile as { equippedDecorations?: UserProfile["equippedDecorations"] })
    ?.equippedDecorations;

  if (!userProfile) return null;

  const frameUrl = equipped?.frame ?? equipped?.avatar;
  const hasAny =
    frameUrl || equipped?.background || equipped?.card;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border)]/60">
          <div className="p-2 rounded-xl bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Инвентарь
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Надетые декорации
            </p>
          </div>
        </div>

        {!hasAny ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Пользователь пока не надел декорации</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipped?.background && (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--secondary)]">
                <div className="aspect-video relative">
                  <Image
                    src={equipped.background}
                    alt="Фон профиля"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 text-sm font-medium text-[var(--foreground)]">
                  Фон профиля
                </div>
              </div>
            )}
            {frameUrl && (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--secondary)]">
                <div className="aspect-square relative">
                  <Image
                    src={frameUrl.startsWith("http") ? frameUrl : getDecorationImageUrl(frameUrl) || frameUrl}
                    alt="Рамка аватара"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 text-sm font-medium text-[var(--foreground)]">
                  Рамка аватара
                </div>
              </div>
            )}
            {equipped?.card && (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--secondary)]">
                <div className="aspect-[3/4] relative">
                  <Image
                    src={equipped.card.startsWith("http") ? equipped.card : getDecorationImageUrl(equipped.card) || equipped.card}
                    alt="Карточка"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 text-sm font-medium text-[var(--foreground)]">
                  Карточка
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
