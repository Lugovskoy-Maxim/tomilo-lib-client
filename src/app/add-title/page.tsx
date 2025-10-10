"use client";
import { useState } from "react";
import { Footer, Header } from "@/widgets";
import {
  Plus,
  Trash2,
  Upload,
  Link,
  BookOpen,
  User,
  Tag,
  Calendar,
  FileText,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  sourceUrl?: string;
}

interface TitleFormData {
  title: string;
  originalTitle: string;
  author: string;
  artist: string;
  type: string;
  year: number;
  status: "Онгоинг" | "Завершен" | "Приостановлен";
  genres: string[];
  description: string;
  image: File | null;
}

export default function AddTitlePage() {
  const [formData, setFormData] = useState<TitleFormData>({
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
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [parsingUrl, setParsingUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"manual" | "parse">("manual");

  // Предопределенные жанры
  const availableGenres = [
    "Фэнтези", "Романтика", "Приключения", "Драма", "Комедия",
    "Боевик", "Детектив", "Ужасы", "Научная фантастика", "Повседневность",
    "Психологическое", "Исторический", "Спокон", "Гарем", "Исекай",
    "Махва", "Манхва", "Сёнэн", "Сёдзе", "Сейнен"
  ];

  // Обработчики формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  // Обработчики глав
  const addEmptyChapter = () => {
    const newChapter: Chapter = {
      id: Date.now(),
      number: chapters.length + 1,
      title: "",
      content: "",
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const updateChapter = (id: number, field: keyof Chapter, value: string | number) => {
    setChapters(prev => prev.map(chapter =>
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  const removeChapter = (id: number) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== id));
  };

  // Функция парсинга (заглушка - в реальности нужно реализовать парсер для конкретного сайта)
  const parseChapterFromUrl = async (url: string): Promise<Omit<Chapter, 'id'> | null> => {
    setIsParsing(true);
    setParseError("");
    setParseSuccess("");

    try {
      // Имитация запроса к API парсинга
      await new Promise(resolve => setTimeout(resolve, 2000));

      // В реальном приложении здесь будет запрос к вашему API для парсинга
      // const response = await fetch('/api/parse-chapter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ url })
      // });
      // const data = await response.json();

      // Заглушка с примером данных
      const mockData = {
        number: chapters.length + 1,
        title: `Глава ${chapters.length + 1} из парсера`,
        content: "Содержание главы, полученное путем парсинга...",
        sourceUrl: url,
      };

      setParseSuccess("Глава успешно спарсена!");
      return mockData;
    } catch (error) {
      setParseError("Ошибка при парсинге главы. Проверьте URL и попробуйте снова.");
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseChapter = async () => {
    if (!parsingUrl.trim()) {
      setParseError("Введите URL для парсинга");
      return;
    }

    const parsedChapter = await parseChapterFromUrl(parsingUrl);
    if (parsedChapter) {
      const newChapter: Chapter = {
        ...parsedChapter,
        id: Date.now(),
      };
      setChapters(prev => [...prev, newChapter]);
      setParsingUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim()) {
      alert("Введите название тайтла");
      return;
    }

    if (chapters.length === 0) {
      alert("Добавьте хотя бы одну главу");
      return;
    }

    // Здесь будет отправка данных на сервер
    console.log("Данные для отправки:", { ...formData, chapters });
    
    // Имитация отправки
    alert("Тайтл успешно добавлен!");
    
    // Сброс формы
    setFormData({
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
    });
    setChapters([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Добавить новый тайтл
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Заполните информацию о тайтле и добавьте главы
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  value={formData.title}
                  onChange={handleInputChange}
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
                  value={formData.originalTitle}
                  onChange={handleInputChange}
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
                  value={formData.author}
                  onChange={handleInputChange}
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
                  value={formData.artist}
                  onChange={handleInputChange}
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
                  value={formData.type}
                  onChange={handleInputChange}
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
                  value={formData.year}
                  onChange={handleInputChange}
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
                  value={formData.status}
                  onChange={handleInputChange}
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
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formData.image ? formData.image.name : "Загрузить обложку"}
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
                {availableGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.genres.includes(genre)
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                        : "bg-[var(--accent)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none"
                placeholder="Описание тайтла..."
              />
            </div>
          </div>

          {/* Главы */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Главы ({chapters.length})
              </h2>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "manual"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  Ручное добавление
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("parse")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "parse"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  Парсинг
                </button>
              </div>
            </div>

            {activeTab === "manual" ? (
              <div className="space-y-4">
                {chapters.map(chapter => (
                  <div key={chapter.id} className="border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[var(--foreground)]">
                        Глава {chapter.number}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeChapter(chapter.id)}
                        className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                          Номер главы
                        </label>
                        <input
                          type="number"
                          value={chapter.number}
                          onChange={e => updateChapter(chapter.id, 'number', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                          Название главы
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={e => updateChapter(chapter.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                          placeholder="Название главы"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                        Содержание
                      </label>
                      <textarea
                        value={chapter.content}
                        onChange={e => updateChapter(chapter.id, 'content', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none"
                        placeholder="Текст главы..."
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEmptyChapter}
                  className="w-full border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Добавить главу
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-[var(--border)] rounded-lg p-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL для парсинга
                  </label>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={parsingUrl}
                      onChange={e => setParsingUrl(e.target.value)}
                      placeholder="https://example.com/chapter-1"
                      className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                    />
                    <button
                      type="button"
                      onClick={handleParseChapter}
                      disabled={isParsing}
                      className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isParsing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link className="w-4 h-4" />
                      )}
                      Спарсить
                    </button>
                  </div>

                  {parseError && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {parseError}
                    </div>
                  )}

                  {parseSuccess && (
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {parseSuccess}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                    <p>Поддерживаемые источники: Remanga, Mangalib, ReadManga и другие</p>
                  </div>
                </div>

                {chapters.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-[var(--foreground)] mb-3">
                      Спарсенные главы:
                    </h4>
                    <div className="space-y-2">
                      {chapters.map(chapter => (
                        <div key={chapter.id} className="flex items-center justify-between p-3 bg-[var(--accent)] rounded-lg">
                          <div>
                            <span className="font-medium text-[var(--foreground)]">
                              Глава {chapter.number}: {chapter.title}
                            </span>
                            {chapter.sourceUrl && (
                              <span className="text-xs text-[var(--muted-foreground)] block">
                                Источник: {chapter.sourceUrl}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeChapter(chapter.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Кнопка отправки */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Добавить тайтл
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </main>
  );
}