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
  "соль",
  "закладк",
  "кладмен",
  "барыг",
  "дилер",
  "порох",
  "терроризм",
  "террорист",
  "взрыв",
  "бомб",
  "убийств",
  "убить",
  "суицид",
  "самоубийств",
  "порно",
  "педофил",
  "детское порн",
  "cp",
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
  "даркнет",
  "даркмаркет",
  "hydra",
  "гидра",
  "rutor",
  "рутор",
  "silk road",
  "казино",
  "ставк",
  "букмекер",
  "1xbet",
  "мелбет",
  "фонбет",
  "пинап",
  "пин ап",
  "леон бет",
  "криптовалют",
  "биткоин",
  "эфириум",
  "крипт",
  "инвестиц",
  "заработ",
  "пассивный доход",
  "финансовая пирамид",
  "млм",
  "сетевой маркетинг",
];

export interface ContentValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: "url" | "prohibited_word";
}

export function validateContent(text: string): ContentValidationResult {
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
