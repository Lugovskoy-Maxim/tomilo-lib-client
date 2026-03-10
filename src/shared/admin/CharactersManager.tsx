"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  User,
  Loader2,
  ChevronDown,
  Upload,
} from "lucide-react";
import {
  useGetCharactersByTitleQuery,
  useCreateCharacterMutation,
  useCreateCharacterWithImageMutation,
  useUpdateCharacterMutation,
  useUpdateCharacterImageMutation,
  useDeleteCharacterMutation,
} from "@/store/api/charactersApi";
import {
  Character,
  CharacterRole,
  characterRoleLabels,
  characterRoleColors,
} from "@/types/character";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { useToast } from "@/hooks/useToast";

interface CharactersManagerProps {
  titleId: string;
}

interface CharacterFormData {
  name: string;
  altNames: string[];
  description: string;
  role: CharacterRole;
  voiceActor: string;
}

const ROLES: CharacterRole[] = ["main", "supporting", "antagonist", "minor"];

function CharacterCard({
  character,
  onEdit,
  onDelete,
  isDeleting,
}: {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-start gap-3 p-3 sm:p-4 bg-[var(--background)]/50 rounded-xl border border-[var(--border)]/50 hover:border-[var(--primary)]/30 hover:bg-[var(--background)]/70 transition-colors">
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[var(--secondary)] flex-shrink-0">
        {character.image && !imageError ? (
          <Image
            src={normalizeAssetUrl(character.image)}
            alt={character.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--muted-foreground)]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm text-[var(--foreground)] truncate">
            {character.name}
          </h4>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${characterRoleColors[character.role]}`}
          >
            {characterRoleLabels[character.role]}
          </span>
        </div>
        {character.description && (
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
            {character.description}
          </p>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
          title="Редактировать"
          aria-label="Редактировать"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2"
          title="Удалить"
          aria-label="Удалить"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function CharacterForm({
  character,
  onSave,
  onCancel,
  isSaving,
}: {
  character?: Character;
  onSave: (data: CharacterFormData, image?: File) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: character?.name || "",
    altNames: character?.altNames || [],
    description: character?.description || "",
    role: character?.role || "supporting",
    voiceActor: character?.voiceActor || "",
  });
  const [altNamesInput, setAltNamesInput] = useState(character?.altNames?.join(", ") || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    character?.image ? normalizeAssetUrl(character.image) : null,
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const altNames = altNamesInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    onSave({ ...formData, altNames }, imageFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--secondary)] border border-[var(--border)] flex-shrink-0">
            {imagePreview ? (
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <span className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Загрузить
            </span>
          </label>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
              Имя персонажа *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
              placeholder="Имя персонажа"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Роль</label>
            <select
              value={formData.role}
              onChange={e =>
                setFormData(prev => ({ ...prev, role: e.target.value as CharacterRole }))
              }
              className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>
                  {characterRoleLabels[role]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
          Альтернативные имена (через запятую)
        </label>
        <input
          type="text"
          value={altNamesInput}
          onChange={e => setAltNamesInput(e.target.value)}
          className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
          placeholder="Другие имена персонажа"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Описание</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full min-h-[80px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] resize-y transition-colors"
          placeholder="Краткое описание персонажа"
          rows={3}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
          Сейю / Голос
        </label>
        <input
          type="text"
          value={formData.voiceActor}
          onChange={e => setFormData(prev => ({ ...prev, voiceActor: e.target.value }))}
          className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
          placeholder="Имя актёра озвучки"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSaving || !formData.name.trim()}
          className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {character ? "Сохранить" : "Добавить"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function CharactersManager({ titleId }: CharactersManagerProps) {
  const toast = useToast();
  const { data, isLoading, error } = useGetCharactersByTitleQuery(titleId);
  const [createCharacter, { isLoading: isCreatingBasic }] = useCreateCharacterMutation();
  const [createWithImage, { isLoading: isCreatingWithImage }] =
    useCreateCharacterWithImageMutation();
  const [updateCharacter, { isLoading: isUpdating }] = useUpdateCharacterMutation();
  const [updateImage] = useUpdateCharacterImageMutation();
  const [deleteCharacter] = useDeleteCharacterMutation();

  const isCreating = isCreatingBasic || isCreatingWithImage;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const characters = data?.characters || [];

  const handleCreate = async (formData: CharacterFormData, image?: File) => {
    try {
      const characterData = {
        ...formData,
        titleId,
      };

      if (image) {
        await createWithImage({
          data: characterData,
          image,
        }).unwrap();
      } else {
        await createCharacter(characterData).unwrap();
      }

      toast.success("Персонаж добавлен");
      setIsFormOpen(false);
    } catch (err) {
      toast.error("Ошибка при добавлении персонажа");
      console.error(err);
    }
  };

  const handleUpdate = async (formData: CharacterFormData, image?: File) => {
    if (!editingCharacter) return;

    try {
      await updateCharacter({
        id: editingCharacter._id,
        data: formData,
      }).unwrap();

      if (image) {
        await updateImage({
          id: editingCharacter._id,
          image,
        }).unwrap();
      }

      toast.success("Персонаж обновлён");
      setEditingCharacter(null);
    } catch (err) {
      toast.error("Ошибка при обновлении персонажа");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этого персонажа?")) return;

    setDeletingId(id);
    try {
      await deleteCharacter({ id, titleId }).unwrap();
      toast.success("Персонаж удалён");
    } catch (err) {
      toast.error("Ошибка при удалении персонажа");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const openFormAndExpand = () => {
    setIsExpanded(true);
    setIsFormOpen(true);
    setEditingCharacter(null);
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 hover:bg-[var(--accent)]/50 transition-colors rounded-lg -m-2 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-inset"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <h2 className="text-lg font-semibold text-[var(--foreground)] truncate">Персонажи</h2>
            {characters.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                {characters.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[var(--muted-foreground)] shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={openFormAndExpand}
          className="shrink-0 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary)]/90 active:scale-[0.98] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Добавить персонажа
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              Ошибка загрузки персонажей
            </div>
          ) : (
            <>
              {characters.length > 0 && (
                <div className="space-y-2">
                  {characters.map(character => (
                    <CharacterCard
                      key={character._id}
                      character={character}
                      onEdit={() => setEditingCharacter(character)}
                      onDelete={() => handleDelete(character._id)}
                      isDeleting={deletingId === character._id}
                    />
                  ))}
                </div>
              )}

              {characters.length === 0 && !isFormOpen && (
                <div className="text-center py-8 px-4 text-[var(--muted-foreground)]">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-[var(--foreground)]/80">Персонажи не добавлены</p>
                  <p className="text-xs mt-1">Нажмите «Добавить персонажа» выше, чтобы создать первого</p>
                </div>
              )}

              {(isFormOpen || editingCharacter) && (
                <div className="bg-[var(--background)]/50 rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {editingCharacter ? "Редактировать персонажа" : "Новый персонаж"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingCharacter(null);
                      }}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                      aria-label="Закрыть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CharacterForm
                    character={editingCharacter || undefined}
                    onSave={editingCharacter ? handleUpdate : handleCreate}
                    onCancel={() => {
                      setIsFormOpen(false);
                      setEditingCharacter(null);
                    }}
                    isSaving={isCreating || isUpdating}
                  />
                </div>
              )}

              {!isFormOpen && !editingCharacter && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить персонажа
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
