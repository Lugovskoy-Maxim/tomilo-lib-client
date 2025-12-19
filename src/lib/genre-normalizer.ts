// Нормализатор жанров для приведения к стандартному виду и перевода

// Маппинг английских названий жанров к русским
export const genreTranslations: Record<string, string> = {
  // Базовые жанры
  "action": "Боевое",
  "adventure": "Приключения",
  "comedy": "Комедия",
  "drama": "Драма",
  "fantasy": "Фэнтези",
  "horror": "Хоррор",
  "romance": "Романтика",
  "sci-fi": "Научная фантастика",
  "slice of life": "Повседневность",
  "thriller": "Триллер",
  "mystery": "Мистика",
  "psychological": "Психологическое",
  "supernatural": "Сверхъестественное",
  "historical": "Исторический",
  "military": "Военный",
  "school": "Школа",
  "sports": "Спорт",
  "martial arts": "Боевые искусства",
  "demons": "Демоны",
  "monsters": "Монстры",
  "monster girls": "Девушки-монстры",
  "harem": "Гарем",
  "ecchi": "Этти",
  "seinen": "Сэйнэн",
  "shoujo": "Сёдзё",
  "shoujo ai": "Сёдзё-ай",
  "shounen": "Сёнэн",
  "shounen ai": "Сёнэн-ай",
  "yaoi": "Яой",
  "yuri": "Юри",
  "adult": "Для взрослых",
  "mature": "Зрелые темы",
  "smut": "Смт",
  "cruel world": "Жестокий мир",
  "dragon": "Драконы",
  "female protagonist": "Главная героиня",
  "friendship": "Дружба",
  "game elements": "Игровые элементы",
  "murim": "Мурим",
  "overpowered protagonist": "Всесильный главный герой",
  "sentient races": "Разумные расы",
  "video games": "Видеоигры",
  "isekai": "Исэкай",
  "reincarnation": "Перерождение",
  "system": "Система",
  "level up": "Повышение уровня",
  "cultivation": "Культивация",
  "transmigration": "Трансмиграция",
  "villainess": "Злодейка",
  "reverse harem": "Обратный гарем",
  "time travel": "Путешествия во времени",
  "virtual reality": "Виртуальная реальность",
  "post apocalyptic": "Постапокалипсис",
  "cyberpunk": "Киберпанк",
  "steampunk": "Стимпанк",
  "dystopia": "Дистопия",
  "utopia": "Утопия",
  "crossdressing": "Переодевание",
  "incest": "Инцест",
  "netorare": "Нетораре",
  "netorase": "Неторазе",
  "animal companions": "Животные компаньоны",
  "another world memory": "Память другого мира",
  "artifacts": "Артефакты",
  "beastmen": "Звериолюди",
  "erotica": "Эротика",
  "female harem": "Гарем девушек",
  "games": "Игры",
  "god": "Бог",
  "hiding identity": "Скрытие личности",
  "magic": "Магия",
  "magic academy": "Магическая академия",
  "magical creatures": "Магические существа",
  "male protagonist": "Главный герой мужчина",
  "middle ages": "Средневековье",
  "power ranks": "Ранги силы",
  "power struggle": "Борьба за власть",
  "primarily adult cast": "В основном взрослые персонажи",
  "quests": "Квесты",
  "revenge": "Месть",
  "skills": "Навыки",
  "smart protagonist": "Умный главный герой",
  "survival": "Выживание",
  "swordplay": "Фехтование",
  "teacher": "Учитель",
  "territory management": "Управление территорией",
  "time manipulation": "Манипуляция временем",
  "tragedy": "Трагедия",
  "violence": "Насилие",
  "xianxia": "Сянься",
  "detective": "Детектив",
  "mecha": "Меха",
  "manhwa": "Манхва",
  "manhua": "Манхва",
  "op mc": "ГГ имба",
  "weak mc": "ГГ слабый",
  "rom-com": "Ромком",
  "zombies": "Зомби",
  "vampires": "Вампиры",
  "isekai world": "Попадание в другой мир",
  "work": "Работа",
  "music": "Музыка",
  "cooking": "Кулинария",
  "apocalyptic": "Апокалиптический",
  "apocalypticgame": "Апокалиптический игровой мир",
  "elements": "Элементы",
  "БОЕВИК": "Боевик",
  "БОЕВЫЕ ИСКУУССТВА": "Боевые искусства",
  "ДЕМОНЫ": "Демоны",
  "ДРАМА": "Драма",
  "СЁНЭН": "Сёнэн",
  "СВЕРХЪЕСТЕСТВЕННОЕ": "Сверхъестественное",
  "СПОРТ": "Спорт",
};

// Функция для нормализации названия жанра
export function normalizeGenre(genre: string): string {
  const normalized = genre.toLowerCase().trim();
  
  // Проверяем точные совпадения
  if (genreTranslations[normalized]) {
    return genreTranslations[normalized];
  }
  
  // Проверяем частичные совпадения для составных жанров
  for (const [englishGenre, russianGenre] of Object.entries(genreTranslations)) {
    if (normalized.includes(englishGenre) || englishGenre.includes(normalized)) {
      return russianGenre;
    }
  }
  
  // Если ничего не найдено, возвращаем оригинальное название с первой заглавной буквой
  return genre.trim();
}

// Функция для нормализации массива жанров
export function normalizeGenres(genres: string[]): string[] {
  const normalized = genres.map(normalizeGenre);
  
  // Удаляем дубликаты при этом сохраняя порядок
  const uniqueGenres: string[] = [];
  for (const genre of normalized) {
    if (!uniqueGenres.includes(genre)) {
      uniqueGenres.push(genre);
    }
  }
  
  return uniqueGenres;
}

// Функция для перевода жанра с английского на русский
export function translateGenre(genre: string): string {
  const normalized = genre.toLowerCase().trim();
  return genreTranslations[normalized] || genre;
}

// Проверка, является ли жанр взрослым
export function isAdultGenre(genre: string): boolean {
  const normalized = genre.toLowerCase().trim();
  const adultGenres = [
    'adult', 'mature', 'smut', 'ecchi', 'harem', 'incest', 
    'netorare', 'netorase', 'cuckold', 'yaoi', 'yuri'
  ];
  
  return adultGenres.some(adultGenre => 
    normalized.includes(adultGenre) || adultGenre.includes(normalized)
  );
}

// Фильтрация жанров по типу
export function filterGenresByType(
  genres: string[], 
  options: {
    includeAdult?: boolean;
    language?: 'original' | 'russian' | 'both';
  } = {}
): string[] {
  const { includeAdult = false, language = 'russian' } = options;
  
  let filteredGenres = genres;
  
  // Фильтруем взрослые жанры если нужно
  if (!includeAdult) {
    filteredGenres = filteredGenres.filter(genre => !isAdultGenre(genre));
  }
  
  // Применяем нормализацию в зависимости от языковых предпочтений
  switch (language) {
    case 'russian':
      return normalizeGenres(filteredGenres);
    case 'original':
      return filteredGenres;
    case 'both':
      // Возвращаем массив с оригинальными и переведенными жанрами
      const translated = filteredGenres.map(genre => 
        translateGenre(genre) !== genre ? `${translateGenre(genre)} (${genre})` : genre
      );
      return normalizeGenres(translated);
    default:
      return normalizeGenres(filteredGenres);
  }
}
