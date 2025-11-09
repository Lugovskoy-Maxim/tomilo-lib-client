import { Download, Globe, BookOpen, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import {
  useParseTitleMutation,
  useParseChapterMutation,
  useGetSupportedSitesQuery,
} from "@/store/api/mangaParserApi";
import { ParseTitleDto, ParseChapterDto } from "@/types/manga-parser";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";

export function ParserSection() {
  const [activeTab, setActiveTab] = useState<"title" | "chapter">("title");

  // API hooks
  const { data: supportedSites } = useGetSupportedSitesQuery();
  const [parseTitle, { isLoading: isParsingTitle }] = useParseTitleMutation();
  const [parseChapter, { isLoading: isParsingChapter }] = useParseChapterMutation();

  // Form states
  const [titleForm, setTitleForm] = useState<ParseTitleDto>({
    url: "",
    chapterNumbers: [],
    customTitle: "",
    customDescription: "",
    customGenres: [],
  });

  const [chapterForm, setChapterForm] = useState<ParseChapterDto>({
    url: "",
    titleId: "",
    chapterNumber: 1,
    customName: "",
  });

  const [chapterNumbersInput, setChapterNumbersInput] = useState("");
  const [customGenresInput, setCustomGenresInput] = useState("");

  // Search for titles when typing titleId
  const { data: searchResults } = useSearchTitlesQuery(
    { search: chapterForm.titleId, limit: 5 },
    { skip: !chapterForm.titleId || chapterForm.titleId.length < 2 }
  );

  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleParseTitle = async () => {
    if (!titleForm.url.trim()) {
      setLastResult({ success: false, message: "URL обязателен" });
      return;
    }

    try {
      const result = await parseTitle(titleForm).unwrap();
      setLastResult({
        success: result.success,
        message: result.message || "Операция завершена",
      });
    } catch (error: unknown) {
      setLastResult({
        success: false,
        message: (error as { data?: { message?: string } })?.data?.message || "Ошибка при парсинге",
      });
    }
  };

  const handleParseChapter = async () => {
    if (!chapterForm.url.trim() || !chapterForm.titleId.trim()) {
      setLastResult({ success: false, message: "URL и ID тайтла обязательны" });
      return;
    }

    try {
      const result = await parseChapter(chapterForm).unwrap();
      setLastResult({
        success: result.success,
        message: result.message || "Операция завершена",
      });
    } catch (error: unknown) {
      setLastResult({
        success: false,
        message: (error as { data?: { message?: string } })?.data?.message || "Ошибка при парсинге",
      });
    }
  };

  const handleChapterNumbersChange = (value: string) => {
    setChapterNumbersInput(value);
    const numbers = value
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
    setTitleForm((prev) => ({ ...prev, chapterNumbers: numbers }));
  };

  const handleCustomGenresChange = (value: string) => {
    setCustomGenresInput(value);
    const genres = value.split(",").map((g) => g.trim()).filter((g) => g);
    setTitleForm((prev) => ({ ...prev, customGenres: genres }));
  };

  const selectTitle = (title: { _id?: string; id?: string; name: string; author: string; releaseYear: number }) => {
    setChapterForm((prev) => ({
      ...prev,
      titleId: title._id || title.id || "",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Supported Sites */}
      {supportedSites?.data && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Поддерживаемые сайты
          </h2>
          <div className="flex flex-wrap gap-2">
            {supportedSites.data.sites.map((site: string) => (
              <span
                key={site}
                className="px-3 py-1 bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-full text-sm"
              >
                {site}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("title")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "title"
                ? "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Импорт тайтла
          </button>
          <button
            onClick={() => setActiveTab("chapter")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "chapter"
                ? "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Импорт главы
          </button>
        </div>

        {/* Title Import Form */}
        {activeTab === "title" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL тайтла *
              </label>
              <input
                type="url"
                value={titleForm.url}
                onChange={(e) => setTitleForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://manga-shi.org/manga/example"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Номера глав (через запятую, опционально)
              </label>
              <input
                type="text"
                value={chapterNumbersInput}
                onChange={(e) => handleChapterNumbersChange(e.target.value)}
                placeholder="1, 2, 3 или оставьте пустым для всех глав"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Кастомное название (опционально)
              </label>
              <input
                type="text"
                value={titleForm.customTitle}
                onChange={(e) => setTitleForm((prev) => ({ ...prev, customTitle: e.target.value }))}
                placeholder="Оставить пустым для использования оригинального названия"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Кастомное описание (опционально)
              </label>
              <textarea
                value={titleForm.customDescription}
                onChange={(e) => setTitleForm((prev) => ({ ...prev, customDescription: e.target.value }))}
                placeholder="Оставить пустым для использования оригинального описания"
                rows={3}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Кастомные жанры (через запятую, опционально)
              </label>
              <input
                type="text"
                value={customGenresInput}
                onChange={(e) => handleCustomGenresChange(e.target.value)}
                placeholder="Фэнтези, Приключения, Драма"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              onClick={handleParseTitle}
              disabled={isParsingTitle}
              className="w-full px-6 py-3 bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-lg font-medium cursor-pointer hover:bg-[var(--secondary-foreground)]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsingTitle ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isParsingTitle ? "Импортируем..." : "Импортировать тайтл"}
            </button>
          </div>
        )}

        {/* Chapter Import Form */}
        {activeTab === "chapter" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL главы *
              </label>
              <input
                type="url"
                value={chapterForm.url}
                onChange={(e) => setChapterForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://senkuro.me/chapter/example-slug"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                ID тайтла *
              </label>
              <input
                type="text"
                value={chapterForm.titleId}
                onChange={(e) => setChapterForm((prev) => ({ ...prev, titleId: e.target.value }))}
                placeholder="Введите ID тайтла или начните поиск..."
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
              {searchResults?.data?.data && searchResults.data.data.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.data.data.map((title: { _id?: string; id?: string; name: string; author: string; releaseYear: number }) => (
                    <div
                      key={title._id || title.id}
                      onClick={() => selectTitle(title)}
                      className="px-3 py-2 hover:bg-[var(--accent)] cursor-pointer border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="font-medium">{title.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {title.author} • {title.releaseYear}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Номер главы *
              </label>
              <input
                type="number"
                value={chapterForm.chapterNumber}
                onChange={(e) => setChapterForm((prev) => ({ ...prev, chapterNumber: parseInt(e.target.value, 10) || 1 }))}
                min="1"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Кастомное название главы (опционально)
              </label>
              <input
                type="text"
                value={chapterForm.customName}
                onChange={(e) => setChapterForm((prev) => ({ ...prev, customName: e.target.value }))}
                placeholder="Оставить пустым для использования оригинального названия"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              onClick={handleParseChapter}
              disabled={isParsingChapter}
              className="w-full px-6 py-3 bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-lg font-medium cursor-pointer hover:bg-[var(--secondary-foreground)]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsingChapter ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isParsingChapter ? "Импортируем..." : "Импортировать главу"}
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {lastResult && (
        <div className={`rounded-xl border p-6 flex items-start gap-3 ${
          lastResult.success
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {lastResult.success ? (
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {lastResult.success ? "Успешно" : "Ошибка"}
            </p>
            <p className="text-sm mt-1">{lastResult.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
