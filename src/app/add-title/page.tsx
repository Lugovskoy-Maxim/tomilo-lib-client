import { Footer, Header } from "@/widgets";
import {
  Plus,
  Upload,
  BookOpen,
  User,
  Tag,
  Calendar,
  FileText,
  Edit,
  Save,
} from "lucide-react";
import Link from "next/link";

interface TitleFormData {
  id?: number;
  title: string;
  originalTitle: string;
  author: string;
  artist: string;
  type: string;
  year: number;
  status: "Онгоинг" | "Завершен" | "Приостановлен";
  genres: string[];
  description: string;
  image: File | string | null;
  chaptersCount?: number;
}

interface TitleEditorPageProps {
  params: {
    id?: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

// Предопределенные жанры
const availableGenres = [
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
];

// Серверная функция для загрузки данных тайтла
async function loadTitleData(
  id: string
): Promise<{ title: TitleFormData; chaptersCount: number } | null> {
  // В реальном приложении здесь будет запрос к API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Пример данных для редактирования
  return {
    title: {
      id: parseInt(id),
      title: "Существующий тайтл",
      originalTitle: "Existing Title",
      author: "Автор",
      artist: "Художник",
      type: "Манга",
      year: 2023,
      status: "Онгоинг",
      genres: ["Фэнтези", "Приключения"],
      description: "Описание существующего тайтла...",
      image: "/images/existing-title.jpg",
    },
    chaptersCount: 15, // Пример количества глав
  };
}

export default async function TitleEditorPage({
  params,
}: TitleEditorPageProps) {
  const titleId = params.id;
  const isEditMode = !!titleId;

  let titleData: TitleFormData | null = null;
  let chaptersCount = 0;

  if (isEditMode) {
    const data = await loadTitleData(titleId);
    if (data) {
      titleData = data.title;
      chaptersCount = data.chaptersCount;
    }
  }

  const initialFormData: TitleFormData = titleData || {
    title: "",
    originalTitle: "",
    author: "",
    artist: "",
    type: "Манга",
    year: new Date().getFullYear(),
    status: "Онгоинг",
    genres: [],
    description: "",
    image: null,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
            {isEditMode ? (
              <Edit className="w-8 h-8" />
            ) : (
              <Plus className="w-8 h-8" />
            )}
            {isEditMode ? "Редактировать тайтл" : "Добавить новый тайтл"}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {isEditMode
              ? "Обновите информацию о тайтле"
              : "Заполните информацию о тайтле"}
          </p>
        </div>

        <form className="space-y-8">
          {/* Основная информация */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Основная информация
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={initialFormData.title}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                  placeholder="Введите название тайтла"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Оригинальное название
                </label>
                <input
                  type="text"
                  name="originalTitle"
                  defaultValue={initialFormData.originalTitle}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                  placeholder="Оригинальное название"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Автор *
                </label>
                <input
                  type="text"
                  name="author"
                  defaultValue={initialFormData.author}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                  placeholder="Автор произведения"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Художник
                </label>
                <input
                  type="text"
                  name="artist"
                  defaultValue={initialFormData.artist}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                  placeholder="Художник"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Тип *
                </label>
                <select
                  name="type"
                  defaultValue={initialFormData.type}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                >
                  <option value="Манга">Манга</option>
                  <option value="Манхва">Манхва</option>
                  <option value="Маньхуа">Маньхуа</option>
                  <option value="Комикс">Комикс</option>
                  <option value="Ранобэ">Ранобэ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Год выпуска *
                </label>
                <input
                  type="number"
                  name="year"
                  defaultValue={initialFormData.year}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Статус *
                </label>
                <select
                  name="status"
                  defaultValue={initialFormData.status}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                >
                  <option value="Онгоинг">Онгоинг</option>
                  <option value="Завершен">Завершен</option>
                  <option value="Приостановлен">Приостановлен</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Обложка
                </label>
                <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    name="image"
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {typeof initialFormData.image === "string"
                        ? "Текущая обложка (загрузите новую для замены)"
                        : "Загрузить обложку"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Жанры
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <label key={genre} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="genres"
                      value={genre}
                      defaultChecked={initialFormData.genres.includes(genre)}
                      className="hidden peer"
                    />
                    <span className="px-3 py-1 rounded-full text-sm border border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)] hover:border-[var(--primary)] transition-colors peer-checked:bg-[var(--primary)] peer-checked:text-[var(--primary-foreground)] peer-checked:border-[var(--primary)] cursor-pointer">
                      {genre}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Описание
              </label>
              <textarea
                name="description"
                defaultValue={initialFormData.description}
                rows={4}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none"
                placeholder="Описание тайтла..."
              />
            </div>
          </div>

          {/* Информация о главах (только в режиме редактирования) */}
          {isEditMode && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Главы
                </h2>
                <span className="text-lg font-bold text-[var(--primary)]">
                  {chaptersCount} глав
                </span>
              </div>

              <div className="flex gap-4">
                <Link
                  href={`/admin/titles/${titleId}/chapters/add`}
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Добавить главы
                </Link>

                <Link
                  href={`/admin/titles/${titleId}/chapters`}
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Управление главами
                </Link>
              </div>

              <p className="text-sm text-[var(--muted-foreground)] mt-3">
                Добавляйте новые главы вручную или используйте парсинг из
                внешних источников
              </p>
            </div>
          )}

          {/* Кнопка отправки */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin"
              className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
            >
              {isEditMode ? (
                <Save className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {isEditMode ? "Сохранить изменения" : "Добавить тайтл"}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </main>
  );
}
