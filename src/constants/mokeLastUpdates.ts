interface LatestUpdate {
  id: number;
  title: string;
  chapterNumber: number;
  timeAgo: string;
  newChapters?: number;
  image: string;
  type?: string;
}

const latestUpdatesData: LatestUpdate[] = [
  {
    id: 1,
    title: "Выживание бракованного целителя",
    chapterNumber: 119,
    timeAgo: "11 минут назад",
    image: "/mokeImage/Carousel_1.webp",
    type: "Манхва"
  },
  {
    id: 2,
    title: "Даже скрывая силу, герцогиня — сильнейшая",
    chapterNumber: 16,
    timeAgo: "26 минут назад",
    newChapters: 1,
    image: "/mokeImage/Carousel_2.jpg",
    type: "Манхва"
  },
  {
    id: 3,
    title: "Вернувшись с властью короля",
    chapterNumber: 111,
    timeAgo: "32 минуты назад",
    image: "/mokeImage/Carousel_3.jpg",
    type: "Манхва"
  },
  {
    id: 4,
    title: "Тайная гардеробная герцогини",
    chapterNumber: 100,
    timeAgo: "11 минут назад",
    newChapters: 1,
    image: "/mokeImage/Carousel_4.webp",
    type: "Манга"
  },
  {
    id: 5,
    title: "Сбережение восьмидесяти тысяч золотых монет в другом мире к моей старости",
    chapterNumber: 86,
    timeAgo: "27 минут назад",
    image: "/mokeImage/Carousel_5.webp",
    type: "Манхва"
  },
  {
    id: 6,
    title: "Перерождение ублюдка из клана Меча",
    chapterNumber: 64,
    timeAgo: "32 минуты назад",
    image: "/mokeImage/Carousel_6.webp",
    type: "Манга"
  },
  {
    id: 7,
    title: "Укротитель зверей: Шаньхайцзин!",
    chapterNumber: 76,
    timeAgo: "12 минут назад",
    image: "/mokeImage/Carousel_7.webp",
    type: "Манхва"
  },
  {
    id: 8,
    title: "История о том, как я решил проучить свою нахальную сестру",
    chapterNumber: 27,
    timeAgo: "29 минут назад",
    image: "/mokeImage/Carousel_1.webp",
    type: "Манга"
  },
  {
    id: 9,
    title: "Я буду главной героиней в этом заточении",
    chapterNumber: 54,
    timeAgo: "44 минуты назад",
    newChapters: 3,
    image: "/mokeImage/Carousel_2.jpg",
    type: "Манхва"
  },
  {
    id: 10,
    title: "Богиня изобилия и плут апостол",
    chapterNumber: 231,
    timeAgo: "2 часа назад",
    image: "/mokeImage/Carousel_3.jpg",
    type: "Манхва"
  },
  {
    id: 11,
    title: "Выбери меня!",
    chapterNumber: 205,
    timeAgo: "5 часов назад",
    newChapters: 1,
    image: "/mokeImage/Carousel_4.webp",
    type: "Манхва"
  },
  {
    id: 12,
    title: "Врата одиночества",
    chapterNumber: 3852,
    timeAgo: "Вчера",
    image: "/mokeImage/Carousel_5.webp",
    type: "Манхва"
  }
];

export default latestUpdatesData;