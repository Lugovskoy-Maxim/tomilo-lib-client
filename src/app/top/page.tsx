"use client";
import { useMemo } from "react";
import { Trophy } from "lucide-react";

import { Carousel, Footer, GridSection, Header } from "@/widgets";
import {
  CarouselCard,
  CollectionCard,
  LatestUpdateCard,
  TopTitleCard,
  PeriodFilter,
  PeriodFilter,
} from "@/shared";
import { useHomeData } from "@/hooks/useHomeData";
import { useStaticData } from "@/hooks/useStaticData";
import { useSEO } from "@/hooks/useSEO";

type Period = "day" | "week" | "month";



export default function TopPage() {
  const mounted = useMounted();
  const { activePeriod, setActivePeriod, periodLabels } = usePeriodFilter();
  const { collections, latestUpdates } = useStaticData();
  const { topTitlesDay, topTitlesWeek, topTitlesMonth } = useHomeData();

  useSEO({
    title: `Топ тайтлов ${periodLabels[activePeriod]} - Tomilo-lib.ru`,
    description: `Самые популярные тайтлы ${periodLabels[activePeriod]}. Рейтинг лучшей манги и маньхуа по просмотрам.`,
    keywords: "топ тайтлов, рейтинг, популярные, манга, маньхуа, просмотры",
    type: "website",
  });

