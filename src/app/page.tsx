import cardData from "@/constants/mokeCarousel";
import collectionsWithImages from "@/constants/mokeCollections";
import latestUpdatesData from "@/constants/mokeLastUpdates";

import readingData from "@/constants/mokeReadingData";
import { CarouselCard, CollectionCard, ReadingCard } from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/last-updates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";

import {
  BookOpen,
  Clock,
  LibraryIcon,
  SquareArrowOutUpRight,
  Trophy,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
        <Carousel
          title="Популярные тайтлы"
          type="browse"
          icon={<Trophy className="w-6 h-6" />}
          data={cardData}
          cardComponent={CarouselCard}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
          cardWidth="w-30 sm:w-30 md:w-35 lg:w-40"
        />

        <Carousel
          title="Коллекции по темам"
          description="Здесь подобраны самые популярные коллекции, которые вы можете прочитать."
          type="collection"
          href="/collections"
          data={collectionsWithImages}
          cardComponent={CollectionCard}
          // idField="link"
          cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
          icon={<LibraryIcon className="w-6 h-6" />}
          showNavigation={false}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
        />

        <Carousel
          title="Продолжить чтение"
          description="Это главы, которые вы ещё не прочитали. Данный список генерируется на основании ваших закладок."
          type="browse"
          icon={<BookOpen className="w-6 h-6" />}
          data={readingData}
          cardComponent={ReadingCard}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
          descriptionLink={{
            text: "закладок",
            href: "/bookmarks",
          }}
          showNavigation={false}
          cardWidth="w-68 sm:w-72 md:w-80 lg:w-96"
        />

        <GridSection
          title="Последние обновления"
          description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
          type="browse"
          href="/updates"
          icon={<Clock className="w-6 h-6" />}
          data={latestUpdatesData}
          cardComponent={LatestUpdateCard}
          // descriptionLink={{
          //   text: "все обновления",
          //   href: "/updates"
          // }}
        />
      </main>
      <Footer />
    </>
  );
}
