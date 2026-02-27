"use client";

import { AuthGuard } from "@/guard/AuthGuard";

import { Footer, Header } from "@/widgets";
import {
  BookOpen,
  User,
  Tag,
  Calendar,
  FileText,
  Edit,
  Save,
  AlertCircle,
  AlertTriangle,
  Globe,
  LucideIcon,
  Wand2,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { Title, TitleStatus, TitleType } from "@/types/title";
import { updateTitle } from "@/store/slices/titlesSlice";
import { useParams } from "next/navigation";
import {
  useGetTitleByIdQuery,
  useUpdateTitleCoverMutation,
  useUpdateTitleMutation,
} from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { UpdateTitleDto } from "@/types/title";

import { useToast } from "@/hooks/useToast";
// import Image from "next/image";
import { CoverUploadSection } from "@/shared/admin/CoverUploadSection";
import { normalizeGenres } from "@/lib/genre-normalizer";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { GENRES } from "@/constants/genres";

// Теги для тайтлов (дополнительные метки)
const TAGS_LIST = [
  "Магия",
  "Боевые искусства",
  "ГГ имба",
  "ГГ слабый",
  "Ромком",
  "Гарем",
  "Обратный гарем",
  "Трагедия",
  "Меха",
  "Зомби",
  "Вампиры",
  "Перерождение",
  "Попадание в другой мир",
  "Система",
  "Виртуальная реальность",
  "Школа",
  "Работа",
  "Музыка",
  "Спорт",
  "Кулинария",
] as const;

// Конфигурация API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  genres: [...GENRES],
  tags: [...TAGS_LIST],
  ageLimits: [
    { value: 0, label: "0+ Для всех возрастов" },
    { value: 12, label: "12+ Для детей старше 12" },
    { value: 16, label: "16+ Для детей старше 16" },
    { value: 18, label: "18+ Только для взрослых" },
  ],
};

// Функция генерации slug из названия
const generateSlug = (name: string): string => {
  if (!name) return "unknown-title";

  // Транслитерация кириллических символов
  const translitMap: { [key: string]: string } = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "y",
    ы: "y",
    ь: "'",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  let result = "";
  for (let i = 0; i < name.length; i++) {
    const char = name[i].toLowerCase();
    if (translitMap[char]) {
      result += translitMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (/[а-яё]/.test(char)) {
      result += translitMap[char] || char;
    } else if (/\s/.test(char)) {
      result += "-";
    }
  }

  // Удаляем множественные дефисы и дефисы в начале/конце
  result = result.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return result || "unknown-title";
};

// Функция нормализации жанров/тегов с улучшенной обработкой капса
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

// Типы для пропсов компонентов

interface BasicInfoSectionProps {
  formData: Title;
  titleId: string;
  handleInputChange: (
    field: keyof Title,
  ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleArrayFieldChange: (field: "genres" | "tags") => (value: string, isChecked: boolean) => void;
  handleNormalize: (field: "genres" | "tags") => (values: string[]) => {
    normalized: string[];
    changes: Array<{ original: string; normalized: string }>;
  };
  handleAltNamesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  onCoverUpdate: (newCover: string) => void;
  onSlugGenerate: () => void;
}

interface ChaptersSectionProps {
  titleId: string;
  chaptersCount: number;
}

interface FormActionsProps {
  isSaving: boolean;
}

interface InputFieldProps {
  label: string;
  icon?: LucideIcon;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  required?: boolean;
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

interface SelectFieldProps {
  label: string;
  icon?: LucideIcon;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string | number; label: string }>;
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Пропсы для секции «Жанры и теги»
interface GenresTagsSectionProps {
  genres: string[];
  tags: string[];
  onGenresChange: (value: string, isChecked: boolean) => void;
  onTagsChange: (value: string, isChecked: boolean) => void;
  onNormalizeGenres: (values: string[]) => {
    normalized: string[];
    changes: Array<{ original: string; normalized: string }>;
  };
  onNormalizeTags: (values: string[]) => {
    normalized: string[];
    changes: Array<{ original: string; normalized: string }>;
  };
}

// interface ImageUploadFieldProps {
//   label: string;
//   image?: string;
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
//   selectedFile: File | null;
// }

interface ErrorStateProps {
  error: string;
}

export default function TitleEditorPage() {
  const params = useParams();
  const titleId = params.id as string;
  const toast = useToast();

  const dispatch = useDispatch();

  // Используем хук для получения данных тайтла
  const {
    data: titleResponse,
    isLoading,
    error: apiError,
  } = useGetTitleByIdQuery(
    { id: titleId },
    {
      skip: !titleId,
    },
  );

  // Получаем главы тайтла для подсчета количества
  const { data: chaptersData } = useGetChaptersByTitleQuery({ titleId }, { skip: !titleId });

  // Хук для обновления тайтла
  const [updateTitleMutation, { isLoading: isUpdating }] = useUpdateTitleMutation();
  const [updateTitleCoverMutation] = useUpdateTitleCoverMutation();

  const [formData, setFormData] = useState<Title>({
    _id: "",
    name: "",
    altNames: [],
    description: "",
    genres: [],
    tags: [],
    artist: "",
    coverImage: "",
    status: TitleStatus.ONGOING,
    author: "",
    views: 0,
    totalChapters: 0,
    rating: 0,
    averageRating: undefined,
    releaseYear: new Date().getFullYear(),
    ageLimit: 0,
    isAdult: false,
    chapters: [],
    isPublished: false,
    createdAt: "",
    updatedAt: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  // preview tab removed
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Вычисляем количество глав из данных
  const chaptersCount = chaptersData?.chapters?.length || 0;

  // Обработка данных тайтла из API
  useEffect(() => {
    if (titleResponse) {
      const titleData = titleResponse;

      // Преобразуем числовые поля и обеспечиваем, что genres и tags всегда массивы
      const processedData = {
        ...titleData,
        ageLimit: Number(titleData.ageLimit) || 0,
        releaseYear: Number(titleData.releaseYear) || new Date().getFullYear(),
        views: Number(titleData.views) || 0,
        totalChapters: Number(titleData.totalChapters) || 0,
        rating: Number(titleData.rating) || 0,
        genres: Array.isArray(titleData.genres) ? titleData.genres : [],
        tags: Array.isArray(titleData.tags) ? titleData.tags : [],
      };

      setFormData(processedData);
    } else if (apiError) {
      setError("Ошибка при загрузке данных тайтла");
    }
  }, [titleResponse, apiError, titleId, chaptersData]);

  // Обработчики
  const handleInputChange =
    (field: keyof Title) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target as HTMLInputElement;
      let value: string | number | boolean = target.value;

      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = parseInt(target.value) || 0;
      } else if (field === "releaseYear" || field === "ageLimit") {
        value = parseInt(target.value) || 0;
      }

      setFormData(prev => ({ ...prev, [field]: value }));
    };

  const handleArrayFieldChange =
    (field: "genres" | "tags") => (value: string, isChecked: boolean) => {
      setFormData(prev => {
        // Обеспечиваем, что prev[field] всегда является массивом
        const currentArray = Array.isArray(prev[field]) ? prev[field] : [];

        return {
          ...prev,
          [field]: isChecked
            ? [...currentArray, value]
            : currentArray.filter(item => item !== value),
        };
      });
    };

  // Обработчик нормализации жанров/тегов с уведомлениями
  const handleNormalize = (field: "genres" | "tags") => (values: string[]) => {
    const result = normalizeGenresTags(values);

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

      toast.success(
        `Нормализовано ${result.changes.length} ${
          field === "genres" ? "жанров" : "тегов"
        }:\n${changesText}${moreText}`,
      );
    } else {
      toast.info(`Все ${field === "genres" ? "жанры" : "теги"} уже в нормальном формате`);
    }

    return result;
  };

  const handleAltNamesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const names = e.target.value
      .split(",")
      .map(name => name.trim())
      .filter(name => name);
    setFormData(prev => ({ ...prev, altNames: names }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Конвертируем файл в base64 для отправки на сервер
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        // Извлекаем base64 данные из data URL
        const base64 = result.split(",")[1];
        setFormData(prev => ({
          ...prev,
          coverImage: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Обновляем обложку отдельно, если файл выбран
      if (selectedFile) {
        await updateTitleCoverMutation({
          id: titleId,
          coverImage: selectedFile,
        }).unwrap();
      }

      // Обновляем остальную информацию тайтла
      const updateData: Partial<UpdateTitleDto> = {
        name: formData.name,
        slug: formData.slug,
        altNames: formData.altNames,
        description: formData.description,
        genres: formData.genres,
        tags: formData.tags,
        artist: formData.artist,
        status: formData.status,
        author: formData.author,
        releaseYear: Number(formData.releaseYear),
        ageLimit: Number(formData.ageLimit),
        isPublished: formData.isPublished,
        type: formData.type,
      };

      const result = await updateTitleMutation({
        id: titleId,
        data: updateData,
      }).unwrap();

      if (result.data) {
        dispatch(updateTitle(result.data));
        // Обновляем обложку в локальном состоянии, если она была обновлена
        if (selectedFile && result.data.coverImage) {
          setFormData(prev => ({
            ...prev,
            coverImage: result.data!.coverImage,
          }));
        }
      }
      setSelectedFile(null);
      toast.success("Тайтл успешно обновлен!");
    } catch (err) {
      toast.error(
        `Ошибка при обновлении тайтла: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  // Функция для генерации slug из названия
  const handleSlugGenerate = () => {
    const newSlug = generateSlug(formData.name);
    setFormData(prev => ({ ...prev, slug: newSlug }));
    toast.success("Slug успешно сгенерирован!");
  };

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Админка", href: "/admin" },
              { name: "Тайтлы", href: "/admin?tab=titles" },
              { name: "Редактирование", href: `/admin/titles/edit/${titleId}` },
              { name: formData.name || "Тайтл", isCurrent: true },
            ]}
            className="mb-6"
          />
          <HeaderSection titleName={formData.name} />
          <div className="flex flex-col items-stretch sm:items-end mb-6">
            <ChaptersSection titleId={titleId} chaptersCount={chaptersCount} />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <BasicInfoSection
                formData={formData}
                titleId={titleId}
                handleInputChange={handleInputChange}
                handleArrayFieldChange={handleArrayFieldChange}
                handleNormalize={handleNormalize}
                handleAltNamesChange={handleAltNamesChange}
                handleImageChange={handleImageChange}
                selectedFile={selectedFile}
                onCoverUpdate={newCover => setFormData(prev => ({ ...prev, coverImage: newCover }))}
                onSlugGenerate={handleSlugGenerate}
              />
              {/* <TextareaField
                label="Описание *"
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Описание тайтла..."
                rows={8}
                required
              /> */}
            <div className="flex items-center justify-between gap-3">
              <Link href={`/titles/${formData.slug}`} className="px-4 py-2 rounded border">
                Открыть страницу тайтла
              </Link>
              <FormActions isSaving={isSaving || isUpdating} />
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </AuthGuard>
  );
}

// Компоненты состояний (без изменений)
function LoadingState() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка данных тайтла...</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function ErrorState({ error }: ErrorStateProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{error}</h1>
            <p className="text-[var(--muted-foreground)] mb-6">
              Не удалось загрузить данные тайтла для редактирования
            </p>
            <Link
              href="/admin/titles"
              className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              Вернуться к списку тайтлов
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Компоненты секций
function HeaderSection({ titleName }: { titleName?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
        <Edit className="w-6 h-6 text-[var(--primary)]" />
        Редактировать тайтл
      </h1>
      {titleName ? (
        <p className="text-[var(--muted-foreground)] text-sm">«{titleName}»</p>
      ) : (
        <p className="text-[var(--muted-foreground)] text-sm">Обновите информацию о тайтле</p>
      )}
    </div>
  );
}

function BasicInfoSection({
  formData,
  titleId,
  handleInputChange,
  handleArrayFieldChange,
  handleNormalize,
  handleAltNamesChange,
  handleImageChange,
  selectedFile,
  onCoverUpdate,
  onSlugGenerate,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Основная информация
      </h2>

      {/* Адаптивная сетка: на xl обложка в отдельной колонке слева, поля справа; на малых экранах — одна колонка */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(200px,260px)_1fr] gap-6 xl:gap-8">
        <div className="w-full xl:w-auto xl:shrink-0">
          <CoverUploadSection
            titleId={titleId}
            currentCover={formData.coverImage}
            onCoverUpdate={onCoverUpdate}
            selectedFile={selectedFile}
            onImageChange={handleImageChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
          <InputField
            label="Название *"
            value={formData.name}
            onChange={handleInputChange("name")}
            placeholder="Введите название тайтла"
            required
          />

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug || ""}
                onChange={handleInputChange("slug")}
                placeholder="Введите slug тайтла"
                className="flex-1 min-w-0 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
              />
              <button
                type="button"
                onClick={onSlugGenerate}
                className="px-3 py-2 shrink-0 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-1 text-sm"
                title="Генерировать slug из названия"
              >
                <Wand2 className="w-3 h-3" />
                Генерировать
              </button>
            </div>
          </div>

        <div className="md:col-span-2">
          <InputField
            label="Альтернативные названия (через запятую)"
            value={formData.altNames?.join(", ") || ""}
            onChange={handleAltNamesChange}
            placeholder="Альтернативные названия через запятую"
            icon={Globe}
          />
        </div>

        <InputField
          label="Автор"
          value={formData.author || ""}
          onChange={handleInputChange("author")}
          placeholder="Автор произведения"
          icon={User}
        />

        <InputField
          label="Художник"
          value={formData.artist || ""}
          onChange={handleInputChange("artist")}
          placeholder="Художник"
        />

        <InputField
          label="Год выпуска *"
          type="number"
          value={formData.releaseYear}
          onChange={handleInputChange("releaseYear")}
          min="1900"
          max={new Date().getFullYear() + 1}
          icon={Calendar}
          required
        />

        <SelectField
          label="Статус *"
          value={formData.status}
          onChange={handleInputChange("status")}
          options={Object.values(TitleStatus).map(status => ({
            value: status,
            label: translateTitleStatus(status),
          }))}
        />

        <SelectField
          label="Тип тайтла"
          value={formData.type || ""}
          onChange={handleInputChange("type")}
          options={[
            { value: "", label: "Не указан" },
            ...Object.values(TitleType).map(type => ({
              value: type as string,
              label: translateTitleType(type as string),
            })),
          ]}
        />

        <SelectField
          label="Возрастное ограничение *"
          value={formData.ageLimit}
          onChange={handleInputChange("ageLimit")}
          options={API_CONFIG.ageLimits}
          icon={AlertTriangle}
        />

        <CheckboxField
          label="Опубликован"
          checked={formData.isPublished}
          onChange={handleInputChange("isPublished")}
        />
        </div>
      </div>

      <GenresTagsSection
        genres={formData.genres}
        tags={formData.tags}
        onGenresChange={handleArrayFieldChange("genres")}
        onTagsChange={handleArrayFieldChange("tags")}
        onNormalizeGenres={handleNormalize("genres")}
        onNormalizeTags={handleNormalize("tags")}
      />

      <div className="pt-4 border-t border-[var(--border)]">
        <TextareaField
          label="Описание *"
          value={formData.description}
          onChange={handleInputChange("description")}
          placeholder="Краткое описание сюжета и особенностей тайтла..."
          rows={5}
          required
        />
      </div>
    </div>
  );
}
// Один блок: жанры или теги — выбранные чипы, поиск, список, нормализация
function GenreTagBlock({
  title,
  icon: Icon,
  items,
  selectedItems,
  onChange,
  onNormalize,
  toast,
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  selectedItems: string[];
  onChange: (value: string, isChecked: boolean) => void;
  onNormalize: (values: string[]) => { normalized: string[]; changes: Array<{ original: string; normalized: string }> };
  toast: { success: (m: string) => void; info: (m: string) => void };
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const safeSelected = Array.isArray(selectedItems) ? selectedItems : [];
  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      )
    : items;

  const handleNormalize = () => {
    const result = onNormalize(safeSelected);
    if (result.changes.length > 0) {
      toast.success(
        `Исправлено: ${result.changes.map(c => `${c.original} → ${c.normalized}`).join(", ")}`,
      );
    } else {
      toast.info(`Все значения уже в стандартном виде`);
    }
  };

  const handleAddFromText = () => {
    const newParts = pasteInput
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (newParts.length === 0) return;
    const combined = [...safeSelected, ...newParts];
    const result = onNormalize(combined);
    if (result.changes.length > 0) {
      toast.success(`Добавлено и приведено к стандарту: ${result.changes.length} шт.`);
    }
    setPasteInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--primary)]" />}
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      </div>

      {/* Выбранные — чипы с удалением */}
      <div>
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Выбранные</p>
        <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
          {safeSelected.length === 0 ? (
            <span className="text-xs text-[var(--muted-foreground)]">Ничего не выбрано</span>
          ) : (
            safeSelected.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onChange(item, false)}
                  className="p-0.5 rounded hover:bg-[var(--primary)]/20 text-[var(--foreground)]"
                  aria-label={`Удалить ${item}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Поиск по списку */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Поиск по списку ${title.toLowerCase()}...`}
          className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
        />
      </div>

      {/* Список вариантов — клик добавляет/убирает */}
      <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] p-2 bg-[var(--background)]">
        <div className="flex flex-wrap gap-1.5">
          {filteredItems.map(item => {
            const isSelected = safeSelected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item, !isSelected)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--foreground)] hover:border-[var(--primary)] border border-transparent"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Добавить из текста (через запятую) */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pasteInput}
          onChange={e => setPasteInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddFromText())}
          placeholder={`Введите через запятую и нажмите «Добавить»`}
          className="flex-1 px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
        />
        <button
          type="button"
          onClick={handleAddFromText}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]/80 shrink-0"
        >
          Добавить
        </button>
      </div>

      {/* Нормализация */}
      <button
        type="button"
        onClick={handleNormalize}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 transition-colors"
        title="Привести регистр и варианты написания к стандартному виду"
      >
        <Sparkles className="w-4 h-4 text-[var(--primary)]" />
        Привести к стандартному виду
      </button>
    </div>
  );
}

function GenresTagsSection({
  genres,
  tags,
  onGenresChange,
  onTagsChange,
  onNormalizeGenres,
  onNormalizeTags,
}: GenresTagsSectionProps) {
  const toast = useToast();
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-[var(--primary)]" />
        Жанры и теги
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Выберите из списка или введите через запятую. Кнопка «Привести к стандартному виду» исправит регистр и варианты написания.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenreTagBlock
          title="Жанры"
          icon={BookOpen}
          items={API_CONFIG.genres}
          selectedItems={genres}
          onChange={onGenresChange}
          onNormalize={onNormalizeGenres}
          toast={toast}
        />
        <GenreTagBlock
          title="Теги"
          icon={Tag}
          items={API_CONFIG.tags}
          selectedItems={tags}
          onChange={onTagsChange}
          onNormalize={onNormalizeTags}
          toast={toast}
        />
      </div>
    </div>
  );
}

function ChaptersSection({ titleId, chaptersCount }: ChaptersSectionProps) {
  return (
    <div className="w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px] bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Управление главами
        </h2>
        <span className="text-lg font-bold text-[var(--primary)]">{chaptersCount} глав</span>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href={`/admin/titles/edit/${titleId}/chapters/new`}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Edit className="w-4 h-4" />
          Добавить главы
        </Link>

        <Link
          href={`/admin/titles/edit/${titleId}/chapters`}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors flex items-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          Управление главами
        </Link>
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mt-3">
        Добавляйте новые главы вручную или используйте парсинг из внешних источников
      </p>
    </div>
  );
}

function FormActions({ isSaving }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Link
        href="/admin/titles"
        className="px-6 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
      >
        Отмена
      </Link>
      <button
        type="submit"
        disabled={isSaving}
        className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}

// Базовые компоненты полей
function InputField({ label, icon: Icon, type = "text", ...props }: InputFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
        {...props}
      />
    </div>
  );
}

function TextareaField({ label, ...props }: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{label}</label>
      <textarea
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize text-sm"
        {...props}
      />
    </div>
  );
}

function SelectField({ label, icon: Icon, options, ...props }: SelectFieldProps) {
  return (
    <div>
      <label className=" text-sm font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <select
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, ...props }: CheckboxFieldProps) {
  return (
    <div className="flex items-center">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 text-[var(--primary)] bg-[var(--background)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
          {...props}
        />
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </label>
    </div>
  );
}
