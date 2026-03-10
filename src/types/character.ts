export type CharacterRole = "main" | "supporting" | "antagonist" | "minor" | "other";

export interface Character {
  _id: string;
  name: string;
  altNames?: string[];
  description?: string;
  image?: string;
  role: CharacterRole;
  titleId: string;
  voiceActor?: string;
  age?: string;
  gender?: string;
  guild?: string;
  clan?: string;
  notes?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterListResponse {
  characters: Character[];
  total: number;
}

export type CreateCharacterDto = Omit<Character, "_id" | "createdAt" | "updatedAt">;
export type UpdateCharacterDto = Partial<CreateCharacterDto>;

export const characterRoleLabels: Record<CharacterRole, string> = {
  main: "Главный",
  supporting: "Второстепенный",
  antagonist: "Антагонист",
  minor: "Эпизодический",
  other: "Другое",
};

export const characterRoleColors: Record<CharacterRole, string> = {
  main: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  supporting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  antagonist: "bg-red-500/20 text-red-400 border-red-500/30",
  minor: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  other: "bg-[var(--muted)]/20 text-[var(--muted-foreground)] border-[var(--border)]",
};
