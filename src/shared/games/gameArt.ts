/** Статика из `public/games` — латинские имена файлов для стабильных URL */

export const GAME_ART = {
  alchemy: {
    cauldronTier: (tier: number) => {
      const t = Math.min(5, Math.max(1, Math.floor(Number(tier) || 1)));
      return `/games/alchemy/cauldron-tier-${t}.jpeg`;
    },
    amulet: "/games/alchemy/amulet.jpeg",
    mishap: "/games/alchemy/mishap.jpeg",
    recipe: "/games/alchemy/recipe.jpeg",
  },
  battle: {
    arena: "/games/battle/arena.jpeg",
    victory: "/games/battle/victory.jpeg",
    defeat: "/games/battle/defeat.jpeg",
    buffFire: "/games/battle/buff-fire.jpeg",
    buffHaste: "/games/battle/buff-haste.jpeg",
    buffShield: "/games/battle/buff-shield.jpeg",
    buffPoison: "/games/battle/buff-poison.jpeg",
    biomeForest: "/games/battle/biome-forest.jpeg",
    biomeDesert: "/games/battle/biome-desert.jpeg",
    biomeTemple: "/games/battle/biome-temple.jpeg",
  },
  raids: {
    ambushEyes: "/games/raids/ambush-eyes.jpeg",
    lootExplosion: "/games/raids/loot-explosion.jpeg",
    difficultyEasy: "/games/raids/difficulty-easy.jpeg",
    difficultyNormal: "/games/raids/difficulty-normal.jpeg",
    difficultyHard: "/games/raids/difficulty-hard.jpeg",
  },
} as const;

/** Иконки баффов для строк лога боя (по типу действия / ключевым словам техники) */
export function battleBuffArtForLog(action: string | undefined, techniqueName: string | undefined): string | null {
  if (action !== "buff" && action !== "debuff") return null;
  const n = (techniqueName ?? "").toLowerCase();
  if (n.includes("яд") || n.includes("poison")) return GAME_ART.battle.buffPoison;
  if (n.includes("огн") || n.includes("fire")) return GAME_ART.battle.buffFire;
  if (n.includes("ускор") || n.includes("haste") || n.includes("скорост")) return GAME_ART.battle.buffHaste;
  if (n.includes("щит") || n.includes("shield")) return GAME_ART.battle.buffShield;
  return action === "buff" ? GAME_ART.battle.buffShield : GAME_ART.battle.buffPoison;
}

const BIOMES = [GAME_ART.battle.biomeForest, GAME_ART.battle.biomeDesert, GAME_ART.battle.biomeTemple] as const;

export function weeklyBattleBiomeArt(seed: number): string {
  const i = Math.abs(Math.floor(seed)) % BIOMES.length;
  return BIOMES[i]!;
}
