"use client";

import { Footer, Header } from "@/widgets";
import { Plus, BookOpen, Tag, Edit, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useCreateTitleMutation,
  useGetTitleByIdQuery,
  useUpdateTitleMutation,
} from "@/store/api/titlesApi";
import { TitleStatus } from "@/types/title";
import { useRouter } from "next/navigation";
import { CreateTitleDto } from "@/types/title";

interface TitleFormData {
  name: string;
  altNames: string[];
  author: string;
  artist: string;
  description: string;
  genres: string[];
  tags: string[];
  releaseYear: number;
  status: TitleStatus;
  coverImage?: string;
}

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

export default function TitleEditorPage({
  params,
}: {
  params: { id?: string };
}) {
  const router = useRouter();
  const titleId = params.id;
  const isEditMode = Boolean(titleId);

  // API hooks
  const { data: existingTitle } = useGetTitleByIdQuery(titleId!, {
    skip: !isEditMode,
  });
  const [createTitle, { isLoading: isCreating }] = useCreateTitleMutation();
  const [updateTitle, { isLoading: isUpdating }] = useUpdateTitleMutation();

  // local form state
  const [formData, setFormData] = useState<TitleFormData>({
    name: "",
    altNames: [],
    author: "",
    artist: "",
    description: "",
    genres: [],
    tags: [],
    releaseYear: new Date().getFullYear(),
    status: TitleStatus.ONGOING,
    coverImage: "",
  });

  const [altNameInput, setAltNameInput] = useState("");
  const [tagInput, setTagInput] = useState("");

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
        releaseYear: existingTitle.releaseYear || new Date().getFullYear(),
        status: existingTitle.status || TitleStatus.ONGOING,
        coverImage: existingTitle.coverImage || "",
      });
    }
  }, [existingTitle]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "releaseYear" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const addAltName = () => {
    if (altNameInput.trim() && !formData.altNames.includes(altNameInput.trim())) {
      setFormData(prev => ({
        ...prev,
        altNames: [...prev.altNames, altNameInput.trim()]
      }));
      setAltNameInput("");
    }
  };

  const removeAltName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      altNames: prev.altNames.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Функция для подготовки данных к отправке
  const prepareSubmitData = (): Partial<CreateTitleDto> => {
    const data: Partial<CreateTitleDto> = {
      name: formData.name.trim(),
      altNames: formData.altNames.filter(name => name.trim() !== ''),
      author: formData.author.trim(),
      description: formData.description.trim(),
      genres: formData.genres,
      tags: formData.tags.filter(tag => tag.trim() !== ''),
      releaseYear: formData.releaseYear,
      status: formData.status,
    };

    // Добавляем необязательные поля только если они не пустые
    if (formData.artist.trim()) {
      data.artist = formData.artist.trim();
    }

    if (formData.coverImage?.trim()) {
      data.coverImage = formData.coverImage.trim();
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация обязательных полей
    if (!formData.name.trim()) {
      alert("Название обязательно для заполнения");
      return;
    }

    if (!formData.author.trim()) {
      alert("Автор обязателен для заполнения");
      return;
    }

    if (!formData.description.trim()) {
      alert("Описание обязательно для заполнения");
      return;
    }

    if (formData.genres.length === 0) {
      alert("Выберите хотя бы один жанр");
      return;
    }

    // Валидация releaseYear
    const currentYear = new Date().getFullYear();
    if (formData.releaseYear < 1900 || formData.releaseYear > currentYear) {
      alert(`Год выпуска должен быть между 1900 и ${currentYear}`);
      return;
    }

    try {
      const dataToSend = prepareSubmitData();

      console.log("Отправляемые данные:", dataToSend);

      if (isEditMode && titleId) {
        await updateTitle({ id: titleId, data: dataToSend }).unwrap();
      } else {
        await createTitle(dataToSend).unwrap();
      }

      router.push("/admin");
    } catch (err: any) {
      console.error("Ошибка при сохранении:", err);
      if (err.data?.message) {
        alert(`Ошибка: ${Array.isArray(err.data.message) ? err.data.message.join(', ') : err.data.message}`);
      } else {
        alert("Произошла ошибка при сохранении. Проверьте консоль для подробностей.");
      }
    }
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

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Основная информация */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Основная информация
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название *
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
                  Автор *
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
                  Художник
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
                  Год выпуска *
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
                  Должен быть между 1900 и {new Date().getFullYear()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Статус *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                >
                  <option value={TitleStatus.ONGOING}>Онгоинг</option>
                  <option value={TitleStatus.COMPLETED}>Завершен</option>
                  <option value={TitleStatus.PAUSE}>Приостановлен</option>
                  <option value={TitleStatus.CANCELLED}>Отменен</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Обложка (URL)
                </label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {/* Альтернативные названия */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Альтернативные названия
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={altNameInput}
                  onChange={(e) => setAltNameInput(e.target.value)}
                  placeholder="Введите альтернативное название"
                  className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAltName();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addAltName}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
                >
                  Добавить
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
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Жанры *
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <label key={genre} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="hidden peer"
                    />
                    <span className="px-3 py-1 rounded-full text-sm border border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)] hover:border-[var(--primary)] transition-colors peer-checked:bg-[var(--primary)] peer-checked:text-[var(--primary-foreground)] cursor-pointer">
                      {genre}
                    </span>
                  </label>
                ))}
              </div>
              {formData.genres.length > 0 && (
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Выбрано: {formData.genres.join(', ')}
                </p>
              )}
            </div>

            {/* Теги */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Теги
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Введите тег"
                  className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
                >
                  Добавить
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
              <label className="block text-sm font-medium mb-2">Описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] resize-none"
                placeholder="Подробное описание тайтла..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/admin"
              className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isEditMode ? (
                <Save className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {isEditMode
                ? isUpdating
                  ? "Сохраняем..."
                  : "Сохранить изменения"
                : isCreating
                ? "Добавляем..."
                : "Добавить тайтл"}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </main>
  );
}