"use client";

import { Footer, Header } from "@/widgets";
import {
  Upload,
  BookOpen,
  User,
  Tag,
  Calendar,
  FileText,
  Edit,
  Save,
  AlertCircle,
  Eye,
  Star,
  Users,
  AlertTriangle,
  Globe,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
// removed preview page; keep a link button to open public title page
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/index";
import { Title, TitleStatus, TitleType } from "@/types/title";
import { updateTitle } from "@/store/slices/titlesSlice";
import { useParams } from "next/navigation";
import { useGetTitleByIdQuery, useUpdateTitleMutation } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { UpdateTitleDto } from "@/types/title";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

// Конфигурация API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  genres: [
    "Фэнтези",
    "Романтика",
    "Приключения",
    "Драма",
    "Комедия",
    "Боевик",
    "Детектив",
    "Ужасы",
    "Научная фантастика",
    "Повседневность",
    "Психологическое",
    "Исторический",
    "Спокон",
    "Гарем",
    "Исекай",
    "Махва",
    "Манхва",
    "Сёнэн",
    "Сёдзе",
    "Сейнен",
  ],
  tags: [
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
  ],
  ageLimits: [
    { value: 0, label: "0+ Для всех возрастов" },
    { value: 12, label: "12+ Для детей старше 12" },
    { value: 16, label: "16+ Для детей старше 16" },
    { value: 18, label: "18+ Только для взрослых" },
  ],
};

// Типы для пропсов компонентов
interface BasicInfoSectionProps {
  formData: Title;
  handleInputChange: (
    field: keyof Title
  ) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleArrayFieldChange: (
    field: "genres" | "tags"
  ) => (value: string, isChecked: boolean) => void;
  handleAltNamesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

interface StatsSectionProps {
  formData: Title;
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

interface CheckboxGroupProps {
  label: string;
  items: string[];
  selectedItems: string[];
  onChange: (value: string, isChecked: boolean) => void;
  icon?: LucideIcon;
}

interface ImageUploadFieldProps {
  label: string;
  image?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

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
  } = useGetTitleByIdQuery(titleId, {
    skip: !titleId,
  });

  // Получаем главы тайтла для подсчета количества
  const { data: chaptersData } = useGetChaptersByTitleQuery(
    { titleId },
    { skip: !titleId }
  );

  // Хук для обновления тайтла
  const [updateTitleMutation, { isLoading: isUpdating }] = useUpdateTitleMutation();

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
    releaseYear: new Date().getFullYear(),
    ageLimit: 0,
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
  const chaptersCount = chaptersData?.length || 0;

  // Обработка данных тайтла из API
  useEffect(() => {
    if (titleResponse?.data) {
      const titleData = titleResponse.data;

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
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const target = e.target as HTMLInputElement;
      let value: string | number | boolean = target.value;

      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = parseInt(target.value) || 0;
      } else if (field === "releaseYear" || field === "ageLimit") {
        value = parseInt(target.value) || 0;
      }

      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleArrayFieldChange =
    (field: "genres" | "tags") => (value: string, isChecked: boolean) => {
      setFormData((prev) => {
        // Обеспечиваем, что prev[field] всегда является массивом
        const currentArray = Array.isArray(prev[field]) ? prev[field] : [];

        return {
          ...prev,
          [field]: isChecked
            ? [...currentArray, value]
            : currentArray.filter((item) => item !== value),
        };
      });
    };

  const handleAltNamesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const names = e.target.value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name);
    setFormData((prev) => ({ ...prev, altNames: names }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Конвертируем файл в base64 для отправки на сервер
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Извлекаем base64 данные из data URL
        const base64 = result.split(',')[1];
        setFormData((prev) => ({
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
      let updateData: Partial<UpdateTitleDto>;
      const hasFile = !!selectedFile;

      if (hasFile) {
        // При обновлении только изображения отправляем только файл
        updateData = { coverImage: selectedFile };
      } else {
        // При обновлении других полей отправляем все данные
        updateData = { ...formData };

        // Убеждаемся, что числовые поля являются числами
        if (updateData.ageLimit !== undefined) {
          updateData.ageLimit = Number(updateData.ageLimit);
        }
        if (updateData.releaseYear !== undefined) {
          updateData.releaseYear = Number(updateData.releaseYear);
        }
        if (updateData.views !== undefined) {
          updateData.views = Number(updateData.views);
        }
        if (updateData.totalChapters !== undefined) {
          updateData.totalChapters = Number(updateData.totalChapters);
        }
        if (updateData.rating !== undefined) {
          updateData.rating = Number(updateData.rating);
        }

        // Удаляем служебные поля
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.chapters;
      }

      // Вызываем мутацию обновления тайтла
      const result = await updateTitleMutation({
        id: titleId,
        data: updateData,
        hasFile
      }).unwrap();

      // Обновляем состояние в Redux
      dispatch(updateTitle(result.data));
      setSelectedFile(null); // Сбрасываем выбранный файл после успешного сохранения
      toast.success("Тайтл успешно обновлен!");
    } catch (err) {
      console.error("Error updating title:", err);
      toast.error(
        `Ошибка при обновлении тайтла: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <HeaderSection />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
            <BasicInfoSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleArrayFieldChange={handleArrayFieldChange}
              handleAltNamesChange={handleAltNamesChange}
              handleImageChange={handleImageChange}
              selectedFile={selectedFile}
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
              <Link
                href={`/browse/${titleId}`}
                className="px-4 py-2 rounded border"
              >
                Открыть страницу тайтла
              </Link>
              <FormActions isSaving={isSaving || isUpdating} />
            </div>
          </form>
          <div className="space-y-6 lg:col-span-1">
            <StatsSection formData={formData} />
            <ChaptersSection titleId={titleId} chaptersCount={chaptersCount} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
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
            <p className="text-[var(--muted-foreground)]">
              Загрузка данных тайтла...
            </p>
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
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {error}
            </h1>
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
function HeaderSection() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
        <Edit className="w-6 h-6" />
        Редактировать тайтл
      </h1>
      <p className="text-[var(--muted-foreground)]">
        Обновите информацию о тайтле
      </p>
    </div>
  );
}

function BasicInfoSection({
  formData,
  handleInputChange,
  handleArrayFieldChange,
  handleAltNamesChange,
  handleImageChange,
  selectedFile,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Основная информация
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <ImageUploadField
            label="Обложка"
            image={formData.coverImage}
            onChange={handleImageChange}
            selectedFile={selectedFile}
          />

          <InputField
            label="Название *"
            value={formData.name}
            onChange={handleInputChange("name")}
            placeholder="Введите название тайтла"
            required
          />
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
          options={Object.values(TitleStatus).map((status) => ({
            value: status,
            label: status,
          }))}
        />

        <SelectField
          label="Тип тайтла"
          value={formData.type || ""}
          onChange={handleInputChange("type")}
          options={[
            { value: "", label: "Не указан" },
            ...Object.values(TitleType).map((type) => ({
              value: type as string,
              label: type as string,
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

      <CheckboxGroup
        label="Жанры"
        items={API_CONFIG.genres}
        selectedItems={formData.genres}
        onChange={(value, checked) =>
          handleArrayFieldChange("genres")(value, checked)
        }
        icon={Tag}
      />

      <CheckboxGroup
        label="Теги"
        items={API_CONFIG.tags}
        selectedItems={formData.tags}
        onChange={(value, checked) =>
          handleArrayFieldChange("tags")(value, checked)
        }
      />

      <TextareaField
        label="Описание *"
        value={formData.description}
        onChange={handleInputChange("description")}
        placeholder="Описание тайтла..."
        rows={4}
        required
      />
    </div>
  );
}
function StatsSection({ formData }: StatsSectionProps) {
  const stats: Array<{
    icon: LucideIcon;
    value: string | number;
    label: string;
    color: "blue" | "green" | "yellow" | "purple";
  }> = [
    {
      icon: Eye,
      value: formData.views.toLocaleString(),
      label: "Просмотры",
      color: "blue",
    },
    {
      icon: FileText,
      value: formData.totalChapters,
      label: "Глав",
      color: "green",
    },
    {
      icon: Star,
      value: formData.rating.toFixed(1),
      label: "Рейтинг",
      color: "yellow",
    },
    {
      icon: Users,
      value: formData.isPublished ? "Опубликован" : "Черновик",
      label: "Статус",
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "bg-[var(--primary)]/10 text-[var(--primary)]",
    green: "bg-[var(--primary)]/10 text-[var(--primary)]",
    yellow: "bg-[var(--primary)]/10 text-[var(--primary)]",
    purple: "bg-[var(--primary)]/10 text-[var(--primary)]",
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
        Статистика
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="text-center p-4 bg-[var(--secondary)] rounded-lg"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 ${
                colorClasses[stat.color]
              } rounded-full mx-auto mb-2`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChaptersSection({ titleId, chaptersCount }: ChaptersSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Управление главами
        </h2>
        <span className="text-lg font-bold text-[var(--primary)]">
          {chaptersCount} глав
        </span>
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
        Добавляйте новые главы вручную или используйте парсинг из внешних
        источников
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
function InputField({
  label,
  icon: Icon,
  type = "text",
  ...props
}: InputFieldProps) {
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
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      <textarea
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none text-sm"
        {...props}
      />
    </div>
  );
}

function SelectField({
  label,
  icon: Icon,
  options,
  ...props
}: SelectFieldProps) {
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
        {options.map((option) => (
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
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      </label>
    </div>
  );
}

function CheckboxGroup({
  label,
  items,
  selectedItems,
  onChange,
  icon: Icon,
}: CheckboxGroupProps) {
  // Обеспечиваем, что selectedItems всегда является массивом
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];

  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {items.map((item: string) => (
          <label key={item} className="inline-flex items-center">
            <input
              type="checkbox"
              checked={safeSelectedItems.includes(item)}
              onChange={(e) => onChange(item, e.target.checked)}
              className="hidden peer"
            />
            <span className="px-2 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)] hover:border-[var(--primary)] transition-colors peer-checked:bg-[var(--primary)] peer-checked:text-[var(--primary-foreground)] peer-checked:border-[var(--primary)] cursor-pointer">
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  image,
  onChange,
  selectedFile,
}: ImageUploadFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      <div className="border border-dashed border-[var(--border)] rounded-lg p-3 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center gap-1"
        >
          <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">
            {selectedFile
              ? `Выбран файл: ${selectedFile.name}`
              : "Загрузить обложку"}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {image && !selectedFile
              ? "Текущая обложка (загрузите новую для замены)"
              : "Нажмите для выбора файла"}
          </span>
        </label>
        {(image || selectedFile) && (
          <div className="mt-2">
            {(() => {
              const apiBase =
                process.env.NEXT_PUBLIC_URL || "http://localhost:3000/";
              const isAbsolute =
                typeof image === "string" &&
                (image.startsWith("http://") ||
                  image.startsWith("https://") ||
                  image.startsWith("data:"));
              const resolvedSrc = image
                ? isAbsolute
                  ? image
                  : `${apiBase}${image?.startsWith("/") ? "" : "/"}${image}`
                : "";
              // Не отображаем изображение, если resolvedSrc пустой
              if (!resolvedSrc) {
                return null;
              }
              return (
                <Image
                  loader={() => resolvedSrc}
                  src={resolvedSrc}
                  alt="Current cover"
                  className="max-w-[200px] mx-auto rounded"
                  width={200}
                  height={300}
                  unoptimized
                />
              );
            })()}
            {selectedFile && (
              <p className="text-xs text-[var(--primary)] mt-1">
                Новое изображение будет загружено при сохранении
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
