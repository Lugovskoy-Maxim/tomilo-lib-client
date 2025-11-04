interface LatestUpdate {
  id: string;
  title: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  newChapters?: number;
  cover: string;
  type?: string;
}

const latestUpdatesData: LatestUpdate[] = [
  {
    id: "1",
    title: "Выживание бракованного целителя",
    chapter: "Глава 119",
    chapterNumber: 119,
    timeAgo: "11 минут назад",
    cover: "/mokeImage/Carousel_1.webp",
    type: "Манхва"
  },
  {
    id: "2",
    title: "Даже скрывая силу, герцогиня — сильнейшая",
    chapter: "Глава 16",
    chapterNumber: 16,
    timeAgo: "26 минут назад",
    newChapters: 1,
    cover: "/mokeImage/Carousel_2.jpg",
    type: "Манхва"
  },
  {
    id: "3",
    title: "Вернувшись с властью короля",
    chapter: "Глава 111",
    chapterNumber: 111,
    timeAgo: "32 минуты назад",
    cover: "/mokeImage/Carousel_3.jpg",
    type: "Манхва"
  },
  {
    id: "4",
    title: "Тайная гардеробная герцогини",
    chapter: "Глава 100",
    chapterNumber: 100,
    timeAgo: "11 минут назад",
    newChapters: 1,
    cover: "/mokeImage/Carousel_4.webp",
    type: "Манга"
  },
  {
    id: "5",
    title: "Сбережение восьмидесяти тысяч золотых монет в другом мире к моей старости",
    chapter: "Глава 86",
    chapterNumber: 86,
    timeAgo: "27 минут назад",
    cover: "/mokeImage/Carousel_5.webp",
    type: "Манхва"
  },
  {
    id: "6",
    title: "Перерождение ублюдка из клана Меча",
    chapter: "Глава 64",
    chapterNumber: 64,
    timeAgo: "32 минуты назад",
    cover: "/mokeImage/Carousel_6.webp",
    type: "Манга"
  },
  {
    id: "7",
    title: "Укротитель зверей: Шаньхайцзин!",
    chapter: "Глава 76",
    chapterNumber: 76,
    timeAgo: "12 минут назад",
    cover: "/mokeImage/Carousel_7.webp",
    type: "Манхва"
  },
  {
    id: "8",
    title: "История о том, как я решил проучить свою нахальную сестру",
    chapter: "Глава 27",
    chapterNumber: 27,
    timeAgo: "29 минут назад",
    cover: "/mokeImage/Carousel_1.webp",
    type: "Манга"
  },
  {
    id: "9",
    title: "Я буду главной героиней в этом заточении",
    chapter: "Глава 54",
    chapterNumber: 54,
    timeAgo: "44 минуты назад",
    newChapters: 3,
    cover: "/mokeImage/Carousel_2.jpg",
    type: "Манхва"
  },
  {
    id: "10",
    title: "Богиня изобилия и плут апостол",
    chapter: "Глава 231",
    chapterNumber: 231,
    timeAgo: "2 часа назад",
    cover: "/mokeImage/Carousel_3.jpg",
    type: "Манхва"
  },
  {
    id: "11",
    title: "Выбери меня!",
    chapter: "Глава 205",
    chapterNumber: 205,
    timeAgo: "5 часов назад",
    newChapters: 1,
    cover: "/mokeImage/Carousel_4.webp",
    type: "Манхва"
  },
  {
    id: "12",
    title: "Врата одиночества",
    chapter: "Глава 3852",
    chapterNumber: 3852,
    timeAgo: "Вчера",
    cover: "/mokeImage/Carousel_5.webp",
    type: "Манхва"
  }
];

export default latestUpdatesData;