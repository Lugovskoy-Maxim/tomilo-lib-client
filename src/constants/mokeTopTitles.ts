interface TopTitle {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  rank: number;
  views?: number;
  period: 'day' | 'week' | 'month';
}

const topTitlesData: TopTitle[] = [
  // Топ за день
  {
    id: "1",
    title: "Богиня изобилия и плут апостол",
    type: "Манхва",
    year: 2025,
    rating: 9.5,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Романтика"],
    rank: 1,
    views: 15420,
    period: 'day'
  },
  {
    id: "2",
    title: "Выбери меня!",
    type: "Манхва",
    year: 2022,
    rating: 9.6,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Фэнтези", "Приключения"],
    rank: 2,
    views: 12850,
    period: 'day'
  },
  {
    id: "3",
    title: "Врата одиночества",
    type: "Манхва",
    year: 2023,
    rating: 8.9,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Драма", "Психологическое"],
    rank: 3,
    views: 11200,
    period: 'day'
  },
  {
    id: "4",
    title: "Путь мечника",
    type: "Манга",
    year: 2024,
    rating: 9.2,
    image: "/mokeImage/Carousel_4.webp",
    genres: ["Боевик", "Фэнтези"],
    rank: 4,
    views: 9800,
    period: 'day'
  },
  {
    id: "5",
    title: "Тень империи",
    type: "Манхва",
    year: 2023,
    rating: 8.7,
    image: "/mokeImage/Carousel_5.webp",
    genres: ["Исторический", "Политика"],
    rank: 5,
    views: 8750,
    period: 'day'
  },
  {
    id: "6",
    title: "Звёздный охотник",
    type: "Манга",
    year: 2024,
    rating: 9.1,
    image: "/mokeImage/Carousel_6.webp",
    genres: ["Научная фантастика", "Приключения"],
    rank: 6,
    views: 7600,
    period: 'day'
  },
  {
    id: "7",
    title: "Мастер магии",
    type: "Манхва",
    year: 2025,
    rating: 9.3,
    image: "/mokeImage/Carousel_7.webp",
    genres: ["Фэнтези", "Магия"],
    rank: 7,
    views: 6900,
    period: 'day'
  },
  {
    id: "8",
    title: "Легенда о драконе",
    type: "Манга",
    year: 2023,
    rating: 8.8,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Приключения"],
    rank: 8,
    views: 6200,
    period: 'day'
  },
  {
    id: "9",
    title: "История о том, как я решил проучить свою нахальную сестру",
    type: "Манга",
    year: 2023,
    rating: 8.5,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Комедия", "Романтика"],
    rank: 9,
    views: 5800,
    period: 'day'
  },
  {
    id: "10",
    title: "Я буду главной героиней в этом заточении",
    type: "Манхва",
    year: 2024,
    rating: 9.0,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Фэнтези", "Романтика"],
    rank: 10,
    views: 5400,
    period: 'day'
  },

  // Топ за неделю (немного другие позиции)
  {
    id: "11",
    title: "Выбери меня!",
    type: "Манхва",
    year: 2022,
    rating: 9.6,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Фэнтези", "Приключения"],
    rank: 1,
    views: 89200,
    period: 'week'
  },
  {
    id: "12",
    title: "Богиня изобилия и плут апостол",
    type: "Манхва",
    year: 2025,
    rating: 9.5,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Романтика"],
    rank: 2,
    views: 87650,
    period: 'week'
  },
  {
    id: "13",
    title: "Путь мечника",
    type: "Манга",
    year: 2024,
    rating: 9.2,
    image: "/mokeImage/Carousel_4.webp",
    genres: ["Боевик", "Фэнтези"],
    rank: 3,
    views: 75400,
    period: 'week'
  },
  {
    id: "14",
    title: "Звёздный охотник",
    type: "Манга",
    year: 2024,
    rating: 9.1,
    image: "/mokeImage/Carousel_6.webp",
    genres: ["Научная фантастика", "Приключения"],
    rank: 4,
    views: 68900,
    period: 'week'
  },
  {
    id: "15",
    title: "Мастер магии",
    type: "Манхва",
    year: 2025,
    rating: 9.3,
    image: "/mokeImage/Carousel_7.webp",
    genres: ["Фэнтези", "Магия"],
    rank: 5,
    views: 62300,
    period: 'week'
  },
  {
    id: "16",
    title: "Врата одиночества",
    type: "Манхва",
    year: 2023,
    rating: 8.9,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Драма", "Психологическое"],
    rank: 6,
    views: 59800,
    period: 'week'
  },
  {
    id: "17",
    title: "Тень империи",
    type: "Манхва",
    year: 2023,
    rating: 8.7,
    image: "/mokeImage/Carousel_5.webp",
    genres: ["Исторический", "Политика"],
    rank: 7,
    views: 54200,
    period: 'week'
  },
  {
    id: "18",
    title: "Легенда о драконе",
    type: "Манга",
    year: 2023,
    rating: 8.8,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Приключения"],
    rank: 8,
    views: 49800,
    period: 'week'
  },
  {
    id: "19",
    title: "Я буду главной героиней в этом заточении",
    type: "Манхва",
    year: 2024,
    rating: 9.0,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Фэнтези", "Романтика"],
    rank: 9,
    views: 45600,
    period: 'week'
  },
  {
    id: "20",
    title: "История о том, как я решил проучить свою нахальную сестру",
    type: "Манга",
    year: 2023,
    rating: 8.5,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Комедия", "Романтика"],
    rank: 10,
    views: 41200,
    period: 'week'
  },

  // Топ за месяц (ещё другие позиции)
  {
    id: "21",
    title: "Богиня изобилия и плут апостол",
    type: "Манхва",
    year: 2025,
    rating: 9.5,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Романтика"],
    rank: 1,
    views: 345600,
    period: 'month'
  },
  {
    id: "22",
    title: "Выбери меня!",
    type: "Манхва",
    year: 2022,
    rating: 9.6,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Фэнтези", "Приключения"],
    rank: 2,
    views: 312400,
    period: 'month'
  },
  {
    id: "23",
    title: "Путь мечника",
    type: "Манга",
    year: 2024,
    rating: 9.2,
    image: "/mokeImage/Carousel_4.webp",
    genres: ["Боевик", "Фэнтези"],
    rank: 3,
    views: 298700,
    period: 'month'
  },
  {
    id: "24",
    title: "Звёздный охотник",
    type: "Манга",
    year: 2024,
    rating: 9.1,
    image: "/mokeImage/Carousel_6.webp",
    genres: ["Научная фантастика", "Приключения"],
    rank: 4,
    views: 276500,
    period: 'month'
  },
  {
    id: "25",
    title: "Мастер магии",
    type: "Манхва",
    year: 2025,
    rating: 9.3,
    image: "/mokeImage/Carousel_7.webp",
    genres: ["Фэнтези", "Магия"],
    rank: 5,
    views: 254800,
    period: 'month'
  },
  {
    id: "26",
    title: "Врата одиночества",
    type: "Манхва",
    year: 2023,
    rating: 8.9,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Драма", "Психологическое"],
    rank: 6,
    views: 238900,
    period: 'month'
  },
  {
    id: "27",
    title: "Тень империи",
    type: "Манхва",
    year: 2023,
    rating: 8.7,
    image: "/mokeImage/Carousel_5.webp",
    genres: ["Исторический", "Политика"],
    rank: 7,
    views: 221600,
    period: 'month'
  },
  {
    id: "28",
    title: "Легенда о драконе",
    type: "Манга",
    year: 2023,
    rating: 8.8,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Приключения"],
    rank: 8,
    views: 198400,
    period: 'month'
  },
  {
    id: "29",
    title: "Я буду главной героиней в этом заточении",
    type: "Манхва",
    year: 2024,
    rating: 9.0,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Фэнтези", "Романтика"],
    rank: 9,
    views: 187500,
    period: 'month'
  },
  {
    id: "30",
    title: "История о том, как я решил проучить свою нахальную сестру",
    type: "Манга",
    year: 2023,
    rating: 8.5,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Комедия", "Романтика"],
    rank: 10,
    views: 176200,
    period: 'month'
  },
];

export default topTitlesData;
