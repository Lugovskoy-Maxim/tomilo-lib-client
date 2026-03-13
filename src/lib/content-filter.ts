const URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|ru|org|net|io|me|co|info|biz|xyz|online|site|club|top|shop|store|app|dev|tech|pro|live|tv|cc|ws|su|рф|онлайн|сайт|рус|москва)[^\s]*/gi,
  /t\.me\/[^\s]+/gi,
  /vk\.com\/[^\s]+/gi,
  /discord\.(gg|com)\/[^\s]+/gi,
  /bit\.ly\/[^\s]+/gi,
  /goo\.gl\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
];

const PROHIBITED_WORDS = [
  // Наркотики и закладки (без "соль" — обычное слово)
  "наркот",
  "кокаин",
  "героин",
  "марихуан",
  "гашиш",
  "амфетамин",
  "метамфетамин",
  "экстази",
  "лсд",
  "мефедрон",
  "спайс",
  "закладк",
  "кладмен",
  "барыг",
  "дилер",
  // Терроризм (без "взрыв"/"бомб"/"убийств"/"убить"/"порох" — обычные слова и сюжеты)
  "терроризм",
  "террорист",
  "суицид",
  "самоубийств",
  "порно",
  "педофил",
  "детское порн",
  "нацизм",
  "нацист",
  "фашизм",
  "фашист",
  "хайль",
  "зиг хайль",
  "свастик",
  "расизм",
  "расист",
  "негр",
  "чурк",
  "хач",
  "жид",
  "хохол",
  "москал",
  "кацап",
  // Даркнет (без "гидра" — миф. существо в манге/играх; hydra оставлен как маркетплейс)
  "даркнет",
  "даркмаркет",
  "hydra",
  "rutor",
  "рутор",
  "silk road",
  // Казино и букмекеры (без "ставк" — входит в "поставка")
  "казино",
  "букмекер",
  "1xbet",
  "мелбет",
  "фонбет",
  "пинап",
  "пин ап",
  "леон бет",
  // Крипто/пирамиды (без "крипт" — криптография/криптид; без "заработ" — "заработал достижение"; без "cp" — аббревиатура)
  "криптовалют",
  "биткоин",
  "эфириум",
  "инвестиц",
  "пассивный доход",
  "финансовая пирамид",
  "млм",
  "сетевой маркетинг",
];

/** Минимальная длина комментария (символов после trim) */
export const MIN_COMMENT_LENGTH = 2;

export interface ContentValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: "url" | "prohibited_word" | "min_length";
}

export function validateContent(text: string): ContentValidationResult {
  const trimmed = text.trim();
  if (trimmed.length < MIN_COMMENT_LENGTH) {
    return {
      isValid: false,
      error: `Минимум ${MIN_COMMENT_LENGTH} символа`,
      errorType: "min_length",
    };
  }

  const lowerText = text.toLowerCase();

  for (const pattern of URL_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return {
        isValid: false,
        error: "Ссылки запрещены в комментариях",
        errorType: "url",
      };
    }
  }

  for (const word of PROHIBITED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        isValid: false,
        error: "Комментарий содержит запрещённый контент",
        errorType: "prohibited_word",
      };
    }
  }

  return { isValid: true };
}

export function sanitizeContent(text: string): string {
  let sanitized = text;

  for (const pattern of URL_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, "[ссылка удалена]");
  }

  return sanitized;
}
