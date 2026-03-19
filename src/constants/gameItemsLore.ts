/**
 * Примеры предметов для мини-игр в духе манхвы/маньхуа (культивация, алхимия, секты).
 * Можно использовать как референс при создании предметов в админке.
 */
import type { GameItemType, GameItemRarity } from "@/types/games";

export interface GameItemLoreEntry {
  id: string;
  name: string;
  type: GameItemType;
  rarity: GameItemRarity;
  description?: string;
}

export const GAME_ITEMS_LORE: GameItemLoreEntry[] = [
  // --- Материалы (для крафта пилюль, улучшений) ---
  { id: "spirit_grass", name: "Духовная трава", type: "material", rarity: "common", description: "Базовая трава с слабым духом ци" },
  { id: "iron_ore", name: "Железная руда", type: "material", rarity: "common", description: "Обычная руда для закалки оружия" },
  { id: "beast_core_low", name: "Ядро зверя (низшее)", type: "material", rarity: "common", description: "Ядро обычного духозверя" },
  { id: "hundred_year_herb", name: "Столетняя трава", type: "material", rarity: "uncommon", description: "Трава, вобравшая ци за сто лет" },
  { id: "spirit_stone_fragment", name: "Осколок духовного камня", type: "material", rarity: "uncommon", description: "Обломок камня, хранящего дух ци" },
  { id: "wolf_king_core", name: "Ядро Короля волков", type: "material", rarity: "uncommon", description: "Ядро вожака стаи духо-волков" },
  { id: "thousand_year_ginseng", name: "Тысячелетний женьшень", type: "material", rarity: "rare", description: "Редкий корень, накопленный за тысячу лет" },
  { id: "heavenly_iron", name: "Небесное железо", type: "material", rarity: "rare", description: "Металл, упавший со звёзд" },
  { id: "phoenix_feather", name: "Перо феникса", type: "material", rarity: "rare", description: "Остаток священной птицы возрождения" },
  { id: "dragon_scale", name: "Чешуя дракона", type: "material", rarity: "epic", description: "Чешуя истинного дракона" },
  { id: "immortal_herb", name: "Трава бессмертия", type: "material", rarity: "epic", description: "Легендарная трава из глубин тайного мира" },
  { id: "void_crystal", name: "Кристалл пустоты", type: "material", rarity: "epic", description: "Сгусток законов пространства" },
  { id: "world_tree_leaf", name: "Лист Мирового древа", type: "material", rarity: "legendary", description: "Лист древа, связующего миры" },
  { id: "chaos_stone", name: "Камень хаоса", type: "material", rarity: "legendary", description: "Осколок изначального хаоса" },
  { id: "divine_beast_core", name: "Ядро божественного зверя", type: "material", rarity: "legendary", description: "Ядро существа, достигшего предела пути" },

  // --- Расходники (пилюли, талисманы, одноразовые) ---
  { id: "healing_pill", name: "Пилюля исцеления", type: "consumable", rarity: "common", description: "Восстанавливает лёгкие раны и ци" },
  { id: "energy_restoration_pill", name: "Пилюля восстановления ци", type: "consumable", rarity: "common", description: "Быстро восполняет запас духовной силы" },
  { id: "basic_talisman", name: "Базовый талисман", type: "consumable", rarity: "common", description: "Одноразовая защита от слабых атак" },
  { id: "spirit_condensation_pill", name: "Пилюля сгущения ци", type: "consumable", rarity: "uncommon", description: "Помогает уплотнить ци в даньтяне" },
  { id: "body_tempering_elixir", name: "Отвар закалки тела", type: "consumable", rarity: "uncommon", description: "Укрепляет плоть и кости" },
  { id: "movement_talisman", name: "Талисман перемещения", type: "consumable", rarity: "uncommon", description: "Мгновенный рывок на короткое расстояние" },
  { id: "breakthrough_pill", name: "Пилюля прорыва", type: "consumable", rarity: "rare", description: "Увеличивает шанс прорыва в следующий слой" },
  { id: "soul_nourishing_pill", name: "Пилюля питания души", type: "consumable", rarity: "rare", description: "Укрепляет душу и душевную силу" },
  { id: "defense_talisman", name: "Талисман защиты", type: "consumable", rarity: "rare", description: "Создаёт барьер, поглощающий один удар" },
  { id: "heavenly_thunder_talisman", name: "Талисман небесной грозы", type: "consumable", rarity: "epic", description: "Призывает удар небесной молнии" },
  { id: "resurrection_fragment", name: "Осколок воскрешения", type: "consumable", rarity: "epic", description: "Восстанавливает часть жизненной силы в критический момент" },
  { id: "tribulation_passing_pill", name: "Пилюля прохождения tribulation", type: "consumable", rarity: "legendary", description: "Повышает шанс пережить небесную кару" },
  { id: "space_escape_talisman", name: "Талисман пространственного бегства", type: "consumable", rarity: "legendary", description: "Телепортирует в безопасное место один раз" },

  // --- Особые (ключи, знаки отличия, квестовые) ---
  { id: "sect_token", name: "Знак секты", type: "special", rarity: "common", description: "Подтверждение принадлежности к секте" },
  { id: "mission_scroll", name: "Свиток задания", type: "special", rarity: "common", description: "Описание миссии от павильона заданий" },
  { id: "bronze_medal", name: "Бронзовая медаль", type: "special", rarity: "common", description: "Награда за малые заслуги перед сектой" },
  { id: "inner_sect_token", name: "Знак внутреннего круга", type: "special", rarity: "uncommon", description: "Доступ во внутренние земли секты" },
  { id: "realm_key_copy", name: "Копия ключа тайного мира", type: "special", rarity: "uncommon", description: "Одноразовый вход в малый тайный мир" },
  { id: "silver_medal", name: "Серебряная медаль", type: "special", rarity: "uncommon", description: "Награда за значительные заслуги" },
  { id: "elders_token", name: "Знак старейшины", type: "special", rarity: "rare", description: "Благословение одного из старейшин" },
  { id: "mysterious_fragment", name: "Таинственный осколок", type: "special", rarity: "rare", description: "Загадочный фрагмент неизвестного происхождения. Назначение неясно — возможно, пригодится для ритуалов, крафта или обмена у странствующих торговцев." },
  { id: "ancient_map_fragment", name: "Фрагмент древней карты", type: "special", rarity: "rare", description: "Часть карты сокровищницы древних" },
  { id: "gold_medal", name: "Золотая медаль", type: "special", rarity: "rare", description: "Высокая награда секты" },
  { id: "patriarch_seal", name: "Печать патриарха", type: "special", rarity: "epic", description: "Прямое распоряжение главы секты" },
  { id: "realm_heart_fragment", name: "Осколок сердца мира", type: "special", rarity: "epic", description: "Частица ядра павшего тайного мира" },
  { id: "divine_quest_token", name: "Знак небесного квеста", type: "special", rarity: "epic", description: "Признание Небесной воли за выполнение судьбоносного задания" },
  { id: "heavenly_dao_fragment", name: "Фрагмент Небесного пути", type: "special", rarity: "legendary", description: "Осколок постижения Великого пути" },
  { id: "world_will_recognition", name: "Признание воли мира", type: "special", rarity: "legendary", description: "Мир запомнил твоё имя" },
  { id: "legendary_title_scroll", name: "Свиток легендарного титула", type: "special", rarity: "legendary", description: "Дарует титул, известный во всех мирах" },
];
