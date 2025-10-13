export interface Title {
  id: number;
  title: string;
  originalTitle?: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  description: string;
  status: "Онгоинг" | "Завершен" | "Приостановлен";
  author: string;
  artist: string;
  totalChapters: number;
  totalVolumes?: number;
  views: number;
  followers: number;
  lastUpdate: string;
  chapters: Chapter[];
  alternativeTitles?: string[];
  sources?: {
    name: string;
    url: string;
  }[];
}

export interface Chapter {
  id: number;
  number: number;
  title: string;
  date: string;
  views: number;
  images: string[];
}

const generateChapterImages = (
  titleId: number,
  chapterId: number,
  count: number = 15
): string[] => {
  const images = [];
  for (let i = 1; i <= count; i++) {
    // Используем внешний сервис для разнообразия изображений
    images.push(
      `https://baconmockup.com/720/1280?random=${titleId}_${chapterId}_${i}`
    );
  }
  return images;
};


export const mockTitle: Title[] = [
  {
    id: 1,
    title: "Богиня изобилия и плут апостол",
    originalTitle: "Goddess of Abundance and the Rogue Apostle",
    type: "Манхва",
    year: 2025,
    rating: 9.5,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Романтика", "Приключения", "Драма"],
    description:
      "В мире, где боги и смертные сосуществуют, обычная девушка внезапно обнаруживает, что является реинкарнацией богини изобилия. Вместе с загадочным апостолом, обладающим темным прошлым, она отправляется в путешествие, чтобы восстановить баланс в мире и раскрыть тайны своего происхождения.",
    status: "Онгоинг",
    author: "Чон Ми-хо",
    artist: "Ким Джи-вон",
    totalChapters: 233,
    totalVolumes: 12,
    views: 2450000,
    followers: 125000,
    lastUpdate: "2 часа назад",
    chapters: [
      {
        id: 1,
        number: 233,
        title: "Финал арки: Откровение",
        date: "2 часа назад",
        views: 15400,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 232,
        title: "Битва с древним злом",
        date: "1 день назад",
        views: 18200,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 231,
        title: "Пробуждение силы",
        date: "3 дня назад",
        views: 19500,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 230,
        title: "Встреча с союзником",
        date: "5 дней назад",
        views: 21000,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 229,
        title: "Заговор при дворе",
        date: "1 неделю назад",
        views: 22300,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: [
      "Goddess of Abundance and the Rogue Apostle",
      "豊穣の女神と悪徳の使徒",
    ],
    sources: [
      { name: "Senkuro", url: "#" },
      { name: "reManga", url: "#" },
      {
        name: "Original Publisher",
        url: "#",
      },
    ],
  },
  {
    id: 2,
    title: "Выбери меня!",
    originalTitle: "Choose Me!",
    type: "Манхва",
    year: 2022,
    rating: 9.6,
    image: "/mokeImage/Carousel_2.jpg",
    genres: ["Фэнтези", "Приключения", "Романтика", "Комедия"],
    description:
      "Обычная школьница попадает в мир видеоигры, где должна сделать выбор между тремя загадочными принцами. Каждый из них скрывает темные секреты, и от ее выбора зависит не только ее судьба, но и будущее всего королевства.",
    status: "Онгоинг",
    author: "Пак Со-ён",
    artist: "Ли Джи-хён",
    totalChapters: 204,
    totalVolumes: 10,
    views: 3120000,
    followers: 189000,
    lastUpdate: "5 часов назад",
    chapters: [
      {
        id: 1,
        number: 204,
        title: "Решающий выбор",
        date: "5 часов назад",
        views: 19800,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 203,
        title: "Испытание верности",
        date: "1 день назад",
        views: 21500,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 202,
        title: "Тайна темного принца",
        date: "2 дня назад",
        views: 23100,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 201,
        title: "Бал маскарад",
        date: "4 дня назад",
        views: 24500,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 200,
        title: "Юбилейная глава",
        date: "1 неделю назад",
        views: 26700,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: ["Choose Me!", "私を選んで！"],
    sources: [
      { name: "Senkuro", url: "#" },
      { name: "MangaHub", url: "#" },
    ],
  },
  {
    id: 3,
    title: "Врата одиночества",
    originalTitle: "Gates of Solitude",
    type: "Манхва",
    year: 2023,
    rating: 8.9,
    image: "/mokeImage/Carousel_3.jpg",
    genres: ["Драма", "Психологическое", "Повседневность", "Слайс оф жизни"],
    description:
      "История молодого человека, который после трагического события закрывается от мира. Его путь к исцелению начинается с неожиданной встречи с девушкой, которая сама борется с внутренними демонами.",
    status: "Завершен",
    author: "Ким Тэ-хён",
    artist: "Чой Мин-джун",
    totalChapters: 3851,
    totalVolumes: 15,
    views: 4780000,
    followers: 312000,
    lastUpdate: "2 дня назад",
    chapters: [
      {
        id: 1,
        number: 3851,
        title: "Эпилог: Новое начало",
        date: "2 дня назад",
        views: 32400,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 3850,
        title: "Финальное решение",
        date: "1 неделю назад",
        views: 35600,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 3849,
        title: "Прощание с прошлым",
        date: "2 недели назад",
        views: 37800,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 3848,
        title: "Исповедь",
        date: "3 недели назад",
        views: 39200,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 3847,
        title: "Момент истины",
        date: "1 месяц назад",
        views: 41500,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: ["Gates of Solitude", "孤独の門"],
    sources: [
      { name: "reManga", url: "#" },
      { name: "MangaZone", url: "#" },
    ],
  },
  {
    id: 4,
    title: "Путь мечника",
    originalTitle: "Swordmaster's Path",
    type: "Манга",
    year: 2024,
    rating: 9.2,
    image: "/mokeImage/Carousel_4.webp",
    genres: ["Боевик", "Фэнтези", "Приключения", "Сёнэн"],
    description:
      "Бывший офисный работник перерождается в мире меча и магии как ученик легендарного мечника. Чтобы выжить в жестоком мире, он должен освоить древние техники и раскрыть тайну своего перерождения.",
    status: "Онгоинг",
    author: "Танака Кэн",
    artist: "Сато Хироси",
    totalChapters: 631,
    totalVolumes: 8,
    views: 5670000,
    followers: 445000,
    lastUpdate: "1 день назад",
    chapters: [
      {
        id: 1,
        number: 631,
        title: "Техника тысячелетнего меча",
        date: "1 день назад",
        views: 28700,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 630,
        title: "Схватка с королем демонов",
        date: "3 дня назад",
        views: 31200,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 629,
        title: "Пробуждение крови",
        date: "5 дней назад",
        views: 33400,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 628,
        title: "Наследие предков",
        date: "1 неделю назад",
        views: 35600,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 627,
        title: "Тренировка в святилище",
        date: "2 недели назад",
        views: 37800,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: ["Swordmaster's Path", "剣豪の道"],
    sources: [
      { name: "MangaDex", url: "#" },
      { name: "Original Publisher", url: "#" },
    ],
  },
  {
    id: 5,
    title: "Тень империи",
    originalTitle: "Shadow of the Empire",
    type: "Манхва",
    year: 2023,
    rating: 8.7,
    image: "/mokeImage/Carousel_5.webp",
    genres: ["Исторический", "Политика", "Драма", "Детектив"],
    description:
      "В расцвете великой империи молодой чиновник низкого ранга становится ключевой фигурой в дворцовых интригах. Используя только свой ум и наблюдательность, он должен выжить в мире, где одно неверное слово может стоить жизни.",
    status: "Онгоинг",
    author: "Юн Джи-хун",
    artist: "Кан Дэ-щён",
    totalChapters: 156,
    totalVolumes: 4,
    views: 1890000,
    followers: 123000,
    lastUpdate: "3 дня назад",
    chapters: [
      {
        id: 1,
        number: 156,
        title: "Заговор раскрыт",
        date: "3 дня назад",
        views: 15600,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 155,
        title: "Ночной визит",
        date: "6 дней назад",
        views: 17200,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 154,
        title: "Свидетель из прошлого",
        date: "1 неделю назад",
        views: 18900,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 153,
        title: "Тайная встреча",
        date: "2 недели назад",
        views: 20100,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 152,
        title: "Письмо с фронта",
        date: "3 недели назад",
        views: 21500,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: ["Shadow of the Empire", "帝国の影"],
    sources: [
      { name: "Senkuro", url: "#" },
      { name: "MangaHub", url: "#" },
    ],
  },
  {
    id: 6,
    title: "Звёздный охотник",
    originalTitle: "Star Hunter",
    type: "Манга",
    year: 2024,
    rating: 9.1,
    image: "/mokeImage/Carousel_6.webp",
    genres: ["Научная фантастика", "Приключения", "Космос", "Экшен"],
    description:
      "В далеком будущем человечество освоило межзвездные путешествия. Экипаж корабля 'Звездный охотник' занимается поиском артефактов древних цивилизаций, но однажды они находят нечто, что может изменить судьбу всей галактики.",
    status: "Онгоинг",
    author: "Ода Ясуси",
    artist: "Кобаяси Макото",
    totalChapters: 78,
    totalVolumes: 3,
    views: 2340000,
    followers: 178000,
    lastUpdate: "6 часов назад",
    chapters: [
      {
        id: 1,
        number: 78,
        title: "За пределами туманности",
        date: "6 часов назад",
        views: 19800,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 2,
        number: 77,
        title: "Сигнал из глубин",
        date: "2 дня назад",
        views: 21500,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 3,
        number: 76,
        title: "Первая встреча",
        date: "4 дня назад",
        views: 23100,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 4,
        number: 75,
        title: "Загадка черной дыры",
        date: "1 неделю назад",
        views: 24500,
        images: generateChapterImages(1, 233, 18),
      },
      {
        id: 5,
        number: 74,
        title: "Космическая буря",
        date: "2 недели назад",
        views: 25600,
        images: generateChapterImages(1, 233, 18),
      },
    ],
    alternativeTitles: ["Star Hunter", "スター·ハンター"],
    sources: [
      { name: "MangaDex", url: "#" },
      { name: "Original Publisher", url: "#" },
    ],
  },
  {
    id: 7,
    title: "Мастер магии",
    originalTitle: "Magic Master",
    type: "Манхва",
    year: 2025,
    rating: 9.3,
    image: "/mokeImage/Carousel_7.webp",
    genres: ["Фэнтези", "Магия", "Приключения", "Сёнэн"],
    description:
      "В академии магии, где сила определяется количеством заклинаний, появляется студент, который может создавать магию с нуля. Его уникальный дар привлекает внимание как друзей, так и врагов, готовых на все, чтобы заполучить его секрет.",
    status: "Онгоинг",
    author: "Ли Хён-джу",
    artist: "Пак Чжи-мин",
    totalChapters: 150,
    totalVolumes: 5,
    views: 2980000,
    followers: 234000,
    lastUpdate: "12 часов назад",
    chapters: [
      {
        id: 1,
        number: 150,
        title: "Экзамен мастера",
        date: "12 часов назад",
        views: 22300,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 2,
        number: 149,
        title: "Дуэль с профессором",
        date: "2 дня назад",
        views: 24500,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 3,
        number: 148,
        title: "Запретное заклинание",
        date: "4 дня назад",
        views: 26700,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 4,
        number: 147,
        title: "Тайная организация",
        date: "1 неделю назад",
        views: 27800,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 5,
        number: 146,
        title: "Пробуждение таланта",
        date: "2 недели назад",
        views: 28900,
        images: generateChapterImages(1, 233, 18)

      },
    ],
    alternativeTitles: ["Magic Master", "魔法大師"],
    sources: [
      { name: "reManga", url: "#" },
      { name: "MangaZone", url: "#" },
    ],
  },
  {
    id: 8,
    title: "Легенда о драконе",
    originalTitle: "Dragon Legend",
    type: "Манга",
    year: 2023,
    rating: 8.8,
    image: "/mokeImage/Carousel_1.webp",
    genres: ["Фэнтези", "Приключения", "Дракон", "Эпическое"],
    description:
      "В мире, где драконы считаются вымершими, молодой сирота обнаруживает, что является последним из рода драконьих всадников. Его путешествие к восстановлению древнего наследия приведет его к встрече с последним драконом.",
    status: "Онгоинг",
    author: "Фудзимото Хироси",
    artist: "Ямамото Такэси",
    totalChapters: 89,
    totalVolumes: 4,
    views: 1670000,
    followers: 134000,
    lastUpdate: "4 дня назад",
    chapters: [
      {
        id: 1,
        number: 89,
        title: "Пробуждение дракона",
        date: "4 дня назад",
        views: 14500,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 2,
        number: 88,
        title: "Древний договор",
        date: "1 неделю назад",
        views: 16200,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 3,
        number: 87,
        title: "Битва за гнездо",
        date: "2 недели назад",
        views: 17800,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 4,
        number: 86,
        title: "Слёзы феникса",
        date: "3 недели назад",
        views: 18900,
        images: generateChapterImages(1, 233, 18)

      },
      {
        id: 5,
        number: 85,
        title: "Путь к вершине",
        date: "1 месяц назад",
        views: 19500,
        images: generateChapterImages(1, 233, 18)

      },
    ],
    alternativeTitles: ["Dragon Legend", "ドラゴン·レジェンド"],
    sources: [
      { name: "MangaDex", url: "#" },
      { name: "Original Publisher", url: "#" },
    ],
  },
];

// Функция для получения тайтла по ID
export const getTitleById = (id: number): Title | undefined => {
  return mockTitle.find((title) => title.id === id);
};

// Функция для получения похожих тайтлов по жанрам - ИСПРАВЛЕННАЯ
export const getSimilarTitles = (
  currentTitle: Title,
  limit: number = 4
): Title[] => {
  const similarTitles = mockTitle
    .filter(
      (title) =>
        title.id !== currentTitle.id && // Здесь title - элемент массива, а не массив
        title.genres.some((genre) => currentTitle.genres.includes(genre))
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);

  return similarTitles;
};

// Функция для получения главы по ID тайтла и номеру главы
export const getChapterByNumber = (
  titleId: number,
  chapterNumber: number
): Chapter | undefined => {
  const title = getTitleById(titleId);
  return title?.chapters.find((chapter) => chapter.number === chapterNumber);
};

// Функция для получения всех глав тайтла
export const getChaptersByTitleId = (titleId: number): Chapter[] => {
  const title = getTitleById(titleId);
  return title?.chapters || [];
};
