"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Upload, Save, Loader2 } from "lucide-react";
import {
  Character,
  CharacterRole,
  characterRoleLabels,
} from "@/types/character";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { useToast } from "@/hooks/useToast";

const ROLES: CharacterRole[] = ["main", "supporting", "antagonist", "minor", "other"];
const DESCRIPTION_MAX_LENGTH = 500;

export interface CharacterFormData {
  name: string;
  altNames: string[];
  description: string;
  role: CharacterRole;
  voiceActor: string;
  age: string;
  gender: string;
  guild: string;
  clan: string;
  notes: string;
  sortOrder: number;
}

const defaultFormData: CharacterFormData = {
  name: "",
  altNames: [],
  description: "",
  role: "supporting",
  voiceActor: "",
  age: "",
  gender: "",
  guild: "",
  clan: "",
  notes: "",
  sortOrder: 0,
};

interface CharacterProposalFormProps {
  character?: Character;
  onSuccess: () => void;
  onCancel: () => void;
  submitLabel?: string;
  /** При true показывается подпись про модерацию и поле «Комментарий к заявке» */
  forModeration?: boolean;
  onCreate: (data: CharacterFormData, image?: File) => Promise<void>;
  onUpdate?: (data: CharacterFormData, image?: File) => Promise<void>;
  isSaving: boolean;
}

export function CharacterProposalForm({
  character,
  onSuccess,
  onCancel,
  submitLabel,
  forModeration = true,
  onCreate,
  onUpdate,
  isSaving,
}: CharacterProposalFormProps) {
  const isEdit = !!character;
  const toast = useToast();
  const [formData, setFormData] = useState<CharacterFormData>({
    ...defaultFormData,
    name: character?.name ?? "",
    altNames: character?.altNames ?? [],
    description: character?.description ?? "",
    role: character?.role ?? "supporting",
    voiceActor: character?.voiceActor ?? "",
    age: character?.age ?? "",
    gender: character?.gender ?? "",
    guild: character?.guild ?? "",
    clan: character?.clan ?? "",
    notes: character?.notes ?? "",
    sortOrder: character?.sortOrder ?? 0,
  });
  const [altNamesInput, setAltNamesInput] = useState(
    character?.altNames?.join(", ") ?? "",
  );
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const altNames = altNamesInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const data = { ...formData, altNames };
    if ((data.description?.length ?? 0) > DESCRIPTION_MAX_LENGTH) {
      toast.error(`Описание должно быть не длиннее ${DESCRIPTION_MAX_LENGTH} символов`);
      return;
    }
    try {
      if (isEdit && onUpdate) {
        await onUpdate(data, imageFile ?? undefined);
      } else {
        await onCreate(data, imageFile ?? undefined);
      }
      onSuccess();
    } catch {
      // ошибка обрабатывается в родителе через toast
    }
  };

  const label =
    submitLabel ??
    (forModeration
      ? isEdit
        ? "Отправить правки на модерацию"
        : "Отправить на модерацию"
      : isEdit
        ? "Сохранить"
        : "Добавить");

  return (
    <div className="space-y-4" role="form" aria-label={isEdit ? "Правки персонажа" : "Новый персонаж"}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--secondary)] border border-[var(--border)] flex-shrink-0">
            {imagePreview ? (
              <Image src={imagePreview} alt="" fill className="object-cover" />
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
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="w-full min-h-[80px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] resize-y transition-colors"
          placeholder="Краткое описание персонажа"
          rows={3}
        />
        <div className="mt-1 flex items-center justify-end text-[11px] text-[var(--muted-foreground)]">
          {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Возраст</label>
          <input
            type="text"
            value={formData.age}
            onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
            placeholder="Напр. 18, неизвестно"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Пол</label>
          <input
            type="text"
            value={formData.gender}
            onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
            placeholder="Напр. мужской, женский"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
            Гильдия / Организация
          </label>
          <input
            type="text"
            value={formData.guild}
            onChange={e => setFormData(prev => ({ ...prev, guild: e.target.value }))}
            className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
            placeholder="Опционально"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
            Клан / Семья
          </label>
          <input
            type="text"
            value={formData.clan}
            onChange={e => setFormData(prev => ({ ...prev, clan: e.target.value }))}
            className="w-full min-h-[42px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] transition-colors"
            placeholder="Опционально"
          />
        </div>
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

      {forModeration && (
        <div>
          <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
            Комментарий к заявке (для модераторов)
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full min-h-[60px] px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 text-[var(--foreground)] resize-y transition-colors"
            placeholder="Опционально: укажите источник или причину правок"
            rows={2}
          />
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSaving || !formData.name.trim()}
          className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {label}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
