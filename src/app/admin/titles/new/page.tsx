"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { Footer, Header } from "@/widgets";
import { Plus, BookOpen, Tag, Edit, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  useCreateTitleMutation,
  useGetTitleByIdQuery,
  useUpdateTitleMutation,
  useCreateTitleWithCoverMutation,
} from "@/store/api/titlesApi";
import { TitleStatus, TitleType } from "@/types/title";
import { useRouter } from "next/navigation";

import { CreateTitleDto } from "@/types/title";
import { useToast } from "@/hooks/useToast";
import { normalizeGenres } from "@/lib/genre-normalizer";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import { VALIDATION_MESSAGES } from "@/constants/validation";
import { MESSAGES } from "@/constants/messages";
import { GENRES } from "@/constants/genres";
import { UI_ELEMENTS } from "@/constants/uiElements";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";

interface TitleFormData {
  name: string;
  slug?: string;
  altNames: string[];
  author: string;
  artist: string;
  ageLimits: number;
  description: string;
  genres: string[];
  tags: string[];
  releaseYear: number;
  status: TitleStatus;
  coverImage?: string;
  type: TitleType;
  publisher?: string;
  serialization?: string;
  relatedTitles?: string[];
  isPublished: boolean;
}

interface CoverUploadProps {
  onCoverChange: (file: File | null) => void;
}

const CoverUpload: React.FC<CoverUploadProps> = ({ onCoverChange }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onCoverChange(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCoverChange(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">{MESSAGES.ADMIN_ACTIONS.COVER}</label>

      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-[200px] max-h-[300px] rounded border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="cover-upload"
        />
        <label
          htmlFor="cover-upload"
          className="px-4 py-2 bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-lg cursor-pointer hover:bg-[var(--secondary)]/80 transition-colors inline-block"
        >
          {MESSAGES.ADMIN_ACTIONS.COVER_UPLOAD}
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {MESSAGES.ADMIN_ACTIONS.DELETE}
          </button>
        )}
      </div>
    </div>
  );
};

export default function TitleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const titleId = params.id as string | undefined;
  const isEditMode = Boolean(titleId);

  // API hooks
  const { data: existingTitle } = useGetTitleByIdQuery(
    { id: titleId! },
    {
      skip: !isEditMode,
    },
  );
  const [createTitle, { isLoading: isCreating }] = useCreateTitleMutation();
  const [updateTitle, { isLoading: isUpdating }] = useUpdateTitleMutation();
  const [createTitleWithCover, { isLoading: isCreatingWithCover }] =
    useCreateTitleWithCoverMutation();

  // local form state
  const [formData, setFormData] = useState<TitleFormData>({
    name: "",
    slug: "",
    altNames: [],
    author: "",
    artist: "",
    description: "",
    genres: [],
    tags: [],
    ageLimits: 0,
    releaseYear: new Date().getFullYear(),
    status: TitleStatus.ONGOING,
    coverImage: "",
    type: TitleType.MANGA,
    publisher: "",
    serialization: "",
    relatedTitles: [],
    isPublished: false,
  });

  const [altNameInput, setAltNameInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  useEffect(() => {
    if (existingTitle) {
      setFormData({
        name: existingTitle.name || "",
        altNames: existingTitle.altNames || [],
        author: existingTitle.author || "",
        artist: existingTitle.artist || "",
        description: existingTitle.description || "",
        genres: existingTitle.genres || [],
        tags: existingTitle.tags || [],
        ageLimits: existingTitle.ageLimit || 0,
        releaseYear: existingTitle.releaseYear || new Date().getFullYear(),
        status: existingTitle.status || TitleStatus.ONGOING,
        coverImage: existingTitle.coverImage || "",
        type: existingTitle.type || TitleType.MANGA,
        publisher: existingTitle.publisher || "",
        serialization: existingTitle.serialization || "",
        relatedTitles: existingTitle.relatedTitles || [],
        isPublished: existingTitle.isPublished || false,
      });
    }
  }, [existingTitle]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "releaseYear" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const addAltName = () => {
    if (altNameInput.trim() && !formData.altNames.includes(altNameInput.trim())) {
      setFormData(prev => ({
        ...prev,
        altNames: [...prev.altNames, altNameInput.trim()],
      }));
      setAltNameInput("");
    }
  };

  const removeAltName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      altNames: prev.altNames.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Функция нормализации жанров/тегов с уведомлениями
  const normalizeGenresTags = (
    items: string[],
  ): {
    normalized: string[];
    changes: Array<{ original: string; normalized: string }>;
  } => {
    const changes: Array<{ original: string; normalized: string }> = [];
    const normalized = items.map(item => {
      const original = item.trim();
      const normalized = normalizeGenres([original])[0];

      if (original !== normalized) {
        changes.push({ original, normalized });
      }

      return normalized;
    });

    // Удаляем дубликаты при этом сохраняя порядок
    const uniqueGenres: string[] = [];
    for (const genre of normalized) {
      if (!uniqueGenres.includes(genre)) {
        uniqueGenres.push(genre);
      }
    }

    return { normalized: uniqueGenres, changes };
  };

  // Обработчик нормализации жанров/тегов
  const handleNormalize = (field: "genres" | "tags") => {
    const result = normalizeGenresTags(formData[field]);

    // Обновляем состояние формы с нормализованными значениями
    setFormData(prev => ({
      ...prev,
      [field]: result.normalized,
    }));

    // Показываем уведомление об изменениях
    if (result.changes.length > 0) {
      const changesText = result.changes
        .slice(0, 3) // Показываем только первые 3 изменения
        .map(change => `${change.original} → ${change.normalized}`)
        .join("\n");

      const moreText = result.changes.length > 3 ? `\nи еще ${result.changes.length - 3}...` : "";

      if (field === "genres") {
        toast.success(UI_ELEMENTS.GENRES_NORMALIZED(result.changes.length, changesText, moreText));
      } else {
        toast.success(UI_ELEMENTS.TAGS_NORMALIZED(result.changes.length, changesText, moreText));
      }
    } else {
      if (field === "genres") {
        toast.info(UI_ELEMENTS.ALL_GENRES_NORMALIZED);
      } else {
        toast.info(UI_ELEMENTS.ALL_TAGS_NORMALIZED);
      }
    }
  };

  // Функция для подготовки данных к отправке
  const prepareSubmitData = (): Partial<CreateTitleDto> => {
    const data: Partial<CreateTitleDto> = {
      name: formData.name.trim(),
      slug: formData.slug?.trim() || undefined,
      altNames: formData.altNames.filter(name => name.trim() !== ""),
      author: formData.author.trim(),
      description: formData.description.trim(),
      genres: normalizeGenres(formData.genres),
      ageLimit: formData.ageLimits,
      tags: normalizeGenres(formData.tags.filter(tag => tag.trim() !== "")),
      releaseYear: formData.releaseYear,
      status: formData.status,
      type: formData.type,
      isPublished: formData.isPublished,
    };

    // Добавляем необязательные поля только если они не пустые
    if (formData.artist.trim()) {
      data.artist = formData.artist.trim();
    }

    if (formData.coverImage?.trim()) {
      data.coverImage = formData.coverImage.trim();
    }

    if (formData.publisher?.trim()) {
      data.publisher = formData.publisher.trim();
    }

    if (formData.serialization?.trim()) {
      data.serialization = formData.serialization.trim();
    }

    if (formData.relatedTitles && formData.relatedTitles.length > 0) {
      data.relatedTitles = formData.relatedTitles.filter(title => title.trim() !== "");
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация обязательных полей
    if (!formData.name.trim()) {
      toast.error(VALIDATION_MESSAGES.TITLE_REQUIRED);
      return;
    }

    if (!formData.author.trim()) {
      toast.error(VALIDATION_MESSAGES.AUTHOR_REQUIRED);
      return;
    }

    if (!formData.description.trim()) {
      toast.error(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED);
      return;
    }

    if (formData.genres.length === 0) {
      toast.error(VALIDATION_MESSAGES.GENRE_REQUIRED);
      return;
    }

    // Валидация releaseYear
    const currentYear = new Date().getFullYear();
    if (formData.releaseYear < 1900 || formData.releaseYear > currentYear) {
      toast.error(MESSAGES.ERROR_MESSAGES.YEAR_VALIDATION(currentYear));
      return;
    }

    try {
      const dataToSend = prepareSubmitData();

      if (isEditMode && titleId) {
        await updateTitle({ id: titleId, data: dataToSend }).unwrap();
      } else {
        // При создании нового тайтла используем новый эндпоинт с обложкой
        if (coverFile) {
          await createTitleWithCover({
            data: dataToSend,
            coverImage: coverFile,
          }).unwrap();
        } else {
          await createTitle(dataToSend).unwrap();
        }
      }

      router.push("/admin");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Handle error silently in production
      if (err.data?.message) {
        toast.error(
          `${MESSAGES.ERROR_MESSAGES.UNKNOWN_ERROR}: ${
            Array.isArray(err.data.message) ? err.data.message.join(", ") : err.data.message
          }`,
        );
      } else {
        toast.error(MESSAGES.ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Админка", href: "/admin" },
              { name: "Тайтлы", href: "/admin?tab=titles" },
              { name: "Новый тайтл", isCurrent: true },
            ]}
            className="mb-6"
          />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
              {isEditMode ? <Edit className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
              {isEditMode ? UI_ELEMENTS.EDIT_TITLE : UI_ELEMENTS.ADMIN_CREATE_TITLE}
            </h1>
            <p className="text-[var(--muted-foreground)]">
              {isEditMode
                ? UI_ELEMENTS.ADMIN_EDIT_DESCRIPTION
                : UI_ELEMENTS.ADMIN_CREATE_DESCRIPTION}
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Основная информация */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
              <h2 className="text-xl font-semibold text-[var(--muted-foreground)] mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {MESSAGES.ADMIN_ACTIONS.BASIC_INFO}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.NAME_REQUIRED}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.SLUG}
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug || ""}
                    onChange={handleChange}
                    placeholder={MESSAGES.PLACEHOLDERS.SLUG}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.AUTHOR_REQUIRED}
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.ARTIST}
                  </label>
                  <input
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.RELEASE_YEAR_REQUIRED}
                  </label>
                  <input
                    type="number"
                    name="releaseYear"
                    value={formData.releaseYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                  />

                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {UI_ELEMENTS.VALIDATION.YEAR_RANGE(new Date().getFullYear())}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.STATUS_REQUIRED}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                  >
                    <option value={TitleStatus.ONGOING}>
                      {translateTitleStatus(TitleStatus.ONGOING)}
                    </option>
                    <option value={TitleStatus.COMPLETED}>
                      {translateTitleStatus(TitleStatus.COMPLETED)}
                    </option>
                    <option value={TitleStatus.PAUSE}>
                      {translateTitleStatus(TitleStatus.PAUSE)}
                    </option>
                    <option value={TitleStatus.CANCELLED}>
                      {translateTitleStatus(TitleStatus.CANCELLED)}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.AGE_LIMIT}
                  </label>
                  <select
                    name="ageLimit"
                    value={formData.ageLimits}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                  >
                    <option value={0}>{MESSAGES.AGE_LIMITS.ALL_AGES}</option>
                    <option value={12}>{MESSAGES.AGE_LIMITS.PLUS_12}</option>
                    <option value={16}>{MESSAGES.AGE_LIMITS.PLUS_16}</option>
                    <option value={18}>{MESSAGES.AGE_LIMITS.PLUS_18}</option>
                  </select>
                </div>

                <div>
                  <CoverUpload onCoverChange={setCoverFile} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.TITLE_TYPE_REQUIRED}
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                  >
                    <option value={TitleType.MANGA}>{translateTitleType(TitleType.MANGA)}</option>
                    <option value={TitleType.MANHWA}>{translateTitleType(TitleType.MANHWA)}</option>
                    <option value={TitleType.MANHUA}>{translateTitleType(TitleType.MANHUA)}</option>
                    <option value={TitleType.NOVEL}>{translateTitleType(TitleType.NOVEL)}</option>
                    <option value={TitleType.LIGHT_NOVEL}>
                      {translateTitleType(TitleType.LIGHT_NOVEL)}
                    </option>
                    <option value={TitleType.COMIC}>{translateTitleType(TitleType.COMIC)}</option>
                    <option value={TitleType.OTHER}>{translateTitleType(TitleType.OTHER)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.PUBLISHER}
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {UI_ELEMENTS.FIELD_LABELS.SERIALIZATION}
                  </label>
                  <input
                    type="text"
                    name="serialization"
                    value={formData.serialization || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          isPublished: e.target.checked,
                        }))
                      }
                    />

                    <span>{MESSAGES.ADMIN_ACTIONS.PUBLISHED}</span>
                  </label>
                </div>
              </div>

              {/* Альтернативные названия */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  {UI_ELEMENTS.FIELD_LABELS.ALT_NAMES}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={altNameInput}
                    onChange={e => setAltNameInput(e.target.value)}
                    placeholder={MESSAGES.PLACEHOLDERS.ALT_NAME}
                    className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                    onKeyPress={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAltName();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={addAltName}
                    className="px-4 py-2 cursor-pointer bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--secondary)]/90"
                  >
                    {MESSAGES.ADMIN_ACTIONS.ADD}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.altNames.map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[var(--secondary)] border border-[var(--border)]"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeAltName(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Жанры */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {UI_ELEMENTS.FIELD_LABELS.GENRES_REQUIRED}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNormalize("genres")}
                    className="px-2 py-1 text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] rounded hover:bg-[var(--secondary)]/80 transition-colors"
                    title={UI_ELEMENTS.ADMIN_ACTIONS.NORMALIZE_GENRES}
                  >
                    {UI_ELEMENTS.ADMIN_ACTIONS.NORMALIZE}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <label key={genre} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="hidden peer"
                      />
                      <span className="px-3 py-1 rounded-full text-sm border border-[var(--border)] bg-[var(--accent)] text-[var(--muted-foreground)] hover:border-[var(--primary)] transition-colors peer-checked:bg-[var(--secondary)] peer-checked:text-[var(--primary-foreground)] cursor-pointer">
                        {genre}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.genres.length > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    {UI_ELEMENTS.VALIDATION.SELECTED_COUNT(formData.genres.length, formData.genres)}
                  </p>
                )}
              </div>

              {/* Теги */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    {UI_ELEMENTS.FIELD_LABELS.TAGS}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNormalize("tags")}
                    className="px-2 py-1 text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] rounded hover:bg-[var(--secondary)]/80 transition-colors"
                    title={UI_ELEMENTS.ADMIN_ACTIONS.NORMALIZE_TAGS}
                  >
                    {UI_ELEMENTS.ADMIN_ACTIONS.NORMALIZE}
                  </button>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder={MESSAGES.PLACEHOLDERS.TAG}
                    className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                    onKeyPress={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-[var(--secondary)] cursor-pointer text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--secondary)]/90"
                  >
                    {MESSAGES.ADMIN_ACTIONS.ADD}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[var(--secondary)] border border-[var(--border)]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  {UI_ELEMENTS.FIELD_LABELS.DESCRIPTION_REQUIRED}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] resize-none"
                  placeholder={MESSAGES.PLACEHOLDERS.DESCRIPTION}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-4 pt-4">
              <Link
                href="/admin"
                className="px-6 py-3 rounded-lg font-medium border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                {UI_ELEMENTS.FIELD_LABELS.CANCEL}
              </Link>
              <button
                type="submit"
                disabled={isCreating || isUpdating || isCreatingWithCover}
                className="px-8 py-3 rounded-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isEditMode ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}

                {isEditMode
                  ? isUpdating
                    ? UI_ELEMENTS.SAVING
                    : UI_ELEMENTS.SAVE_CHANGES
                  : isCreating || isCreatingWithCover
                    ? UI_ELEMENTS.ADDING
                    : UI_ELEMENTS.ADD_TITLE}
              </button>
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </AuthGuard>
  );
}
