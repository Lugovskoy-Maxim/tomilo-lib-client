interface ReadingProgress {
  id: number;
  title: string;
  type: string;
  currentChapter: number;
  totalChapters: number;
  lastRead: string;
  chaptersRead: number;
  image: string;
  rating: number;
  year: number;
  genres: string[];
}

const readingData: ReadingProgress[] = [
  {
    id: 1,
    title: "Богиня изобилия и плут апостол",
    type: "Манхва",
    currentChapter: 230,
    totalChapters: 233,
    lastRead: "на прошлой неделе",
    chaptersRead: 3,
    image: "/mokeImage/Carousel_1.webp",
    rating: 9.5,
    year: 2025,
    genres: ["Фэнтези", "Романтика"],
  },
  {
    id: 2,
    title: "Выбери меня!",
    type: "Манхва",
    currentChapter: 91,
    totalChapters: 204,
    lastRead: "3 недели назад",
    chaptersRead: 113,
    image: "/mokeImage/Carousel_2.jpg",
    rating: 9.6,
    year: 2022,
    genres: ["Фэнтези", "Приключения"],
  },
  {
    id: 3,
    title: "Врата одиночества",
    type: "Манхва",
    currentChapter: 3849,
    totalChapters: 3851,
    lastRead: "позавчера",
    chaptersRead: 2,
    image: "/mokeImage/Carousel_3.jpg",
    rating: 8.9,
    year: 2023,
    genres: ["Драма", "Психологическое"],
  },
  {
    id: 4,
    title: "Путь мечника",
    type: "Манга",
    currentChapter: 620,
    totalChapters: 631,
    lastRead: "2 года назад",
    chaptersRead: 11,
    image: "/mokeImage/Carousel_4.webp",
    rating: 9.2,
    year: 2024,
    genres: ["Боевик", "Фэнтези"],
  },
  {
    id: 5,
    title: "Тень империи",
    type: "Манхва",
    currentChapter: 1,
    totalChapters: 1,
    lastRead: "только что",
    chaptersRead: 0,
    image: "/mokeImage/Carousel_5.webp",
    rating: 8.7,
    year: 2023,
    genres: ["Исторический", "Политика"],
  },
  {
    id: 6,
    title: "Звёздный охотник",
    type: "Манга",
    currentChapter: 45,
    totalChapters: 78,
    lastRead: "вчера",
    chaptersRead: 33,
    image: "/mokeImage/Carousel_6.webp",
    rating: 9.1,
    year: 2024,
    genres: ["Научная фантастика", "Приключения"],
  },
  {
    id: 7,
    title: "Мастер магии",
    type: "Манхва",
    currentChapter: 120,
    totalChapters: 150,
    lastRead: "неделю назад",
    chaptersRead: 30,
    image: "/mokeImage/Carousel_7.webp",
    rating: 9.3,
    year: 2025,
    genres: ["Фэнтези", "Магия"],
  },
];

export default readingData;