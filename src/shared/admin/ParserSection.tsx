"use client";

import React, { useMemo, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  BookOpen,
  Settings,
  Globe,
  Info,
} from "lucide-react";
import { useGetSupportedSitesQuery } from "@/store/api/mangaParserApi";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";

interface ParsingProgress {
  type: "chapters_info" | "title_import" | "chapter_import";
  sessionId: string;
  status: "started" | "progress" | "completed" | "error";
  message: string;
  data?: unknown;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface ChapterInfo {
  name: string;
  number: number;
}

interface ChaptersInfoData {
  title: string;
  totalChapters: number;
  chapters: ChapterInfo[];
}

export function ParserSection() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ParsingProgress | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);

  // API hooks
  const { data: supportedSites } = useGetSupportedSitesQuery();

  // Form states
  const [parsingMode, setParsingMode] = useState<
    "chapters_info" | "title_import" | "chapter_import"
  >("chapters_info");
  const [url, setUrl] = useState("");
  const [chapterNumbers, setChapterNumbers] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customGenres, setCustomGenres] = useState("");
  const [customType, setCustomType] = useState("");
  const [titleId, setTitleId] = useState("");

  // Search for titles when typing titleId
  const { data: searchResults } = useSearchTitlesQuery(
    { search: titleId, limit: 5 },
    { skip: !titleId || titleId.length < 2 },
  );

  // Результаты парсинга
  const [chaptersInfo, setChaptersInfo] = useState<ChaptersInfoData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const modeHints = useMemo(
    () => ({
      chapters_info: "Показывает найденные главы без импорта в базу.",
      title_import: "Создаёт тайтл и при необходимости импортирует указанные главы.",
      chapter_import: "Импортирует главы в уже существующий тайтл по ID.",
    }),
    [],
  );

  const canStartParsing = useMemo(() => {
    if (!isConnected || !url.trim() || isParsing) return false;
    if (parsingMode === "chapter_import" && !titleId.trim()) return false;
    return true;
  }, [isConnected, isParsing, parsingMode, titleId, url]);

  const startDisabledReason = useMemo(() => {
    if (isParsing) return "Дождитесь завершения текущей задачи";
    if (!isConnected) return "Нет соединения с сервером парсинга";
    if (!url.trim()) return "Укажите URL источника";
    if (parsingMode === "chapter_import" && !titleId.trim()) return "Укажите ID тайтла";
    return "";
  }, [isConnected, isParsing, parsingMode, titleId, url]);

  // Хук для обновления списка глав
  const { refetch: refetchChapters } = useGetChaptersByTitleQuery({ titleId }, { skip: !titleId });

  useEffect(() => {
    const newSocket = io(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/parsing`,
      {
        transports: ["websocket", "polling"],
      },
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("parsing_progress", (progress: ParsingProgress) => {
      if (progress.sessionId === sessionId) {
        setCurrentProgress(progress);

        if (progress.status === "completed" && progress.type === "chapters_info") {
          setChaptersInfo(progress.data as ChaptersInfoData);
        }

        if (progress.status === "completed" || progress.status === "error") {
          setIsParsing(false);
          // Обновляем список глав после завершения
          setTimeout(() => refetchChapters(), 1000);

          // Показываем модальное окно с результатом
          if (progress.status === "completed") {
            setModalContent({
              title: "Парсинг завершен",
              message: progress.message || "Парсинг успешно завершен",
            });
          } else {
            setModalContent({
              title: "Ошибка парсинга",
              message: progress.message || "Произошла ошибка во время парсинга",
            });
          }
          setIsModalOpen(true);
        }
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [sessionId, refetchChapters]);

  const handleStartParsing = () => {
    if (!socket || !isConnected || !url.trim()) return;

    setIsParsing(true);
    setCurrentProgress(null);
    setChaptersInfo(null);

    const baseData = {
      sessionId,
    };

    if (parsingMode === "chapters_info") {
      socket.emit("parse_chapters_info", {
        ...baseData,
        dto: {
          url: url.trim(),
          chapterNumbers: chapterNumbers.trim()
            ? chapterNumbers.split(",").map(s => s.trim())
            : undefined,
        },
      });
    } else if (parsingMode === "title_import") {
      socket.emit("parse_title", {
        ...baseData,
        dto: {
          url: url.trim(),
          chapterNumbers: chapterNumbers.trim()
            ? chapterNumbers.split(",").map(s => s.trim())
            : undefined,
          customTitle: customTitle.trim() || undefined,
          customDescription: customDescription.trim() || undefined,
          customGenres: customGenres.trim()
            ? customGenres.split(",").map(s => s.trim())
            : undefined,
          customType: customType.trim() || undefined,
        },
      });
    } else if (parsingMode === "chapter_import") {
      socket.emit("parse_chapters", {
        ...baseData,
        dto: {
          url: url.trim(),
          titleId,
          chapterNumbers: chapterNumbers.trim()
            ? chapterNumbers.split(",").map(s => s.trim())
            : undefined,
        },
      });
    }
  };

  const selectTitle = (title: Title) => {
    setTitleId(title._id);
  };

  const handleResetForm = () => {
    setUrl("");
    setChapterNumbers("");
    setCustomTitle("");
    setCustomDescription("");
    setCustomGenres("");
    setCustomType("");
    setTitleId("");
    setCurrentProgress(null);
    setChaptersInfo(null);
  };

  return (
    <div className="space-y-6 p-2">
      {/* Supported Sites */}
      {supportedSites?.data && (
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard label="Статус соединения" value={isConnected ? "Подключено" : "Отключено"} />
        <InfoCard label="Текущий режим" value={parsingMode.replace("_", " ")} />
        <InfoCard label="Найдено глав" value={chaptersInfo?.totalChapters || 0} />
        <InfoCard
          label="Прогресс"
          value={currentProgress?.progress ? `${currentProgress.progress.percentage}%` : "—"}
        />
      </div>

      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              {modalContent.title.includes("Ошибка") ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {modalContent.title}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6">{modalContent.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="admin-btn admin-btn-primary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parsing Section */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Парсинг тайтла</h2>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm text-[var(--muted-foreground)]">
                {isConnected ? "Подключено" : "Отключено"}
              </span>
            </div>
          </div>
          <button type="button" onClick={handleResetForm} className="admin-btn admin-btn-secondary">
            Сбросить форму
          </button>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
            Режим парсинга
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "chapters_info",
                label: "Информация о главах",
                icon: BookOpen,
              },
              {
                value: "title_import",
                label: "Импорт тайтла",
                icon: Download,
              },
              {
                value: "chapter_import",
                label: "Импорт глав",
                icon: Settings,
              },
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() =>
                  setParsingMode(mode.value as "chapters_info" | "title_import" | "chapter_import")
                }
                className={`p-4 rounded-[var(--admin-radius)] border transition-colors ${
                  parsingMode === mode.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                }`}
              >
                <mode.icon className="w-6 h-6 mx-auto mb-2 text-[var(--foreground)]" />
                <div className="text-sm font-medium text-[var(--foreground)]">{mode.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2 text-sm text-[var(--muted-foreground)]">
            <Info className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            {modeHints[parsingMode]}
          </div>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            URL источника *
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/manga/title"
              className="admin-input flex-1"
              disabled={isParsing}
            />
            <button
              onClick={() => window.open(url, "_blank")}
              disabled={!url.trim()}
              className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Поддерживаемые источники: manga-shi.org, senkuro.me
          </p>
        </div>

        {/* Chapter Numbers */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Номера глав (опционально)
          </label>
          <input
            type="text"
            value={chapterNumbers}
            onChange={e => setChapterNumbers(e.target.value)}
            placeholder="1,2,3 или 1-5,8,10-15"
            className="admin-input w-full"
            disabled={isParsing}
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Оставьте пустым для всех глав или укажите через запятую/тире
          </p>
        </div>

        {/* Title ID for Chapter Import */}
        {parsingMode === "chapter_import" && (
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              ID тайтла *
            </label>
            <input
              type="text"
              value={titleId}
              onChange={e => setTitleId(e.target.value)}
              placeholder="Введите ID тайтла или начните поиск..."
              className="admin-input w-full"
              disabled={isParsing}
            />
            {searchResults?.data?.data && searchResults.data.data.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] shadow-lg max-h-48 overflow-y-auto">
                {searchResults.data.data.map((title: Title) => (
                  <div
                    key={title._id}
                    onClick={() => selectTitle(title)}
                    className="px-3 py-2.5 hover:bg-[var(--accent)] cursor-pointer border-b border-[var(--border)] last:border-b-0"
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
        )}

        {/* Custom Fields for Title Import */}
        {parsingMode === "title_import" && (
          <div className="mb-4 space-y-4 p-4 bg-[var(--background)] rounded-[var(--admin-radius)]">
            <h3 className="font-medium text-[var(--foreground)]">Настройки импорта</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Название (опционально)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Оставить пустым для автоопределения"
                  className="admin-input w-full bg-[var(--card)]"
                  disabled={isParsing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Тип тайтла
                </label>
                <select
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  className="admin-input w-full bg-[var(--card)]"
                  disabled={isParsing}
                >
                  <option value="">Автоопределение</option>
                  <option value="Манга">Манга</option>
                  <option value="Манхва">Манхва</option>
                  <option value="Комикс">Комикс</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Жанры (через запятую)
              </label>
              <input
                type="text"
                value={customGenres}
                onChange={e => setCustomGenres(e.target.value)}
                placeholder="Фэнтези, Приключения, Драма"
                className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                disabled={isParsing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Описание
              </label>
              <textarea
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder="Оставить пустым для автоопределения"
                rows={3}
                className="admin-input w-full bg-[var(--card)] resize-none min-h-[80px]"
                disabled={isParsing}
              />
            </div>
          </div>
        )}

        {/* Progress Display */}
        {(currentProgress || isParsing) && (
          <div className="mb-4 p-4 bg-[var(--background)] rounded-[var(--admin-radius)]">
            <div className="flex items-center gap-3 mb-3">
              {isParsing && !currentProgress && (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--chart-2)]" />
              )}
              {currentProgress?.status === "started" && (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--chart-2)]" />
              )}
              {currentProgress?.status === "progress" && (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--chart-2)]" />
              )}
              {currentProgress?.status === "completed" && (
                <CheckCircle className="w-5 h-5 text-[var(--chart-1)]" />
              )}
              {currentProgress?.status === "error" && (
                <AlertCircle className="w-5 h-5 text-[var(--chart-5)]" />
              )}
              <div className="flex-1">
                <div className="font-medium text-[var(--foreground)]">
                  {currentProgress?.message || (isParsing ? "Парсинг запущен..." : "Ожидание...")}
                </div>
                {currentProgress?.progress && (
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {currentProgress.type === "chapter_import"
                      ? `Chapter ${currentProgress.progress.current}`
                      : `${currentProgress.progress.current} / ${currentProgress.progress.total}`}{" "}
                    ({currentProgress.progress.percentage}%)
                  </div>
                )}
              </div>
            </div>

            {currentProgress?.progress && (
              <div className="w-full bg-[var(--accent)] rounded-full h-2">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress.progress.percentage}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Chapters Info Display */}
        {chaptersInfo && (
          <div className="mb-4 p-4 bg-[var(--background)] rounded-[var(--admin-radius)]">
            <h3 className="font-medium text-[var(--foreground)] mb-3">
              Найденные главы ({chaptersInfo.totalChapters})
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {chaptersInfo.chapters.slice(0, 10).map((chapter: ChapterInfo, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">
                    Глава {chapter.number}: {chapter.name}
                  </span>
                </div>
              ))}
              {chaptersInfo.chapters.length > 10 && (
                <div className="text-sm text-[var(--muted-foreground)]">
                  ... и ещё {chaptersInfo.chapters.length - 10} глав
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Parsing Button */}
        <div className="flex justify-end">
          <button
            onClick={handleStartParsing}
            disabled={!canStartParsing}
            className="admin-btn admin-btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Парсинг...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Начать парсинг
              </>
            )}
          </button>
        </div>
        {!canStartParsing && (
          <p className="mt-2 text-right text-xs text-[var(--muted-foreground)]">{startDisabledReason}</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
