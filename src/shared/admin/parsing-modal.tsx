"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  BookOpen,
  Settings,
} from "lucide-react";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";

interface ParsingModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  titleName: string;
  initialUrl?: string;
  initialParsingMode?: "chapters_info" | "title_import" | "chapter_import";
  initialChapterNumbers?: string;
  initialCustomTitle?: string;
  initialCustomDescription?: string;
  initialCustomGenres?: string;
  initialCustomType?: string;
}

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


export function ParsingModal({
  isOpen,
  onClose,
  titleId,
  titleName,
  initialUrl = "",
  initialParsingMode = "chapters_info",
  initialChapterNumbers = "",
  initialCustomTitle = "",
  initialCustomDescription = "",
  initialCustomGenres = "",
  initialCustomType = "",
}: ParsingModalProps) {
  // Type guard function to check if data is ChaptersInfoData
  function isChaptersInfoData(data: unknown): data is ChaptersInfoData {
    return (
      data !== null &&
      typeof data === "object" &&
      typeof (data as unknown as { title?: unknown }).title === "string" &&
      typeof (data as unknown as { totalChapters?: unknown }).totalChapters === "number" &&
      Array.isArray((data as unknown as { chapters?: unknown[] }).chapters) &&
      ((data as unknown as { chapters?: unknown[] }).chapters ?? []).every(
        (chapter: unknown) =>
          chapter !== null &&
          typeof chapter === "object" &&
          typeof (chapter as unknown as { name?: unknown }).name === "string" &&
          typeof (chapter as unknown as { number?: unknown }).number === "number"
      )
    );
  }

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProgress, setCurrentProgress] =
    useState<ParsingProgress | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  // Формы парсинга
  const [parsingMode, setParsingMode] = useState<
    "chapters_info" | "title_import" | "chapter_import"
  >(initialParsingMode);
  const [url, setUrl] = useState(initialUrl);
  const [chapterNumbers, setChapterNumbers] = useState(initialChapterNumbers);
  const [customTitle, setCustomTitle] = useState(initialCustomTitle);
  const [customDescription, setCustomDescription] = useState(
    initialCustomDescription
  );
  const [customGenres, setCustomGenres] = useState(initialCustomGenres);
  const [customType, setCustomType] = useState(initialCustomType);

  // Результаты парсинга
  const [chaptersInfo, setChaptersInfo] = useState<ChaptersInfoData | null>(
    null
  );
  const [isParsing, setIsParsing] = useState(false);

  // Хук для обновления списка глав
  const { refetch: refetchChapters } = useGetChaptersByTitleQuery(
    { titleId },
    { skip: !titleId }
  );

  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/parsing`,
        {
          transports: ["websocket", "polling"],
        }
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

          if (
            progress.status === "completed" &&
            progress.type === "chapters_info" &&
            progress.data !== undefined &&
            isChaptersInfoData(progress.data)
          ) {
            setChaptersInfo(progress.data as ChaptersInfoData);
          }

          if (progress.status === "completed" || progress.status === "error") {
            setIsParsing(false);
            // Обновляем список глав после завершения
            setTimeout(() => refetchChapters(), 1000);
          }
        }
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isOpen, socket, sessionId, refetchChapters]);

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
            ? chapterNumbers.split(",").map((s) => s.trim())
            : undefined,
        },
      });
    } else if (parsingMode === "title_import") {
      socket.emit("parse_title", {
        ...baseData,
        dto: {
          url: url.trim(),
          chapterNumbers: chapterNumbers.trim()
            ? chapterNumbers.split(",").map((s) => s.trim())
            : undefined,
          customTitle: customTitle.trim() || undefined,
          customDescription: customDescription.trim() || undefined,
          customGenres: customGenres.trim()
            ? customGenres.split(",").map((s) => s.trim())
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
            ? chapterNumbers.split(",").map((s) => s.trim())
            : undefined,
        },
      });
    }
  };

  const handleClose = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setCurrentProgress(null);
    setChaptersInfo(null);
    setIsParsing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Парсинг тайтла: {titleName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-[var(--muted-foreground)]">
                {isConnected ? "Подключено" : "Отключено"}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Mode Selection */}
          <div>
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
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() =>
                    setParsingMode(
                      mode.value as
                        | "chapters_info"
                        | "title_import"
                        | "chapter_import"
                    )
                  }
                  className={`p-4 rounded-lg border transition-colors ${
                    parsingMode === mode.value
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <mode.icon className="w-6 h-6 mx-auto mb-2 text-[var(--foreground)]" />
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {mode.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              URL источника *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/manga/title"
                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                disabled={isParsing}
              />
              <button
                onClick={() => window.open(url, "_blank")}
                disabled={!url.trim()}
                className="px-3 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Поддерживаемые источники: manga-shi.org, senkuro.me
            </p>
          </div>

          {/* Chapter Numbers */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Номера глав (опционально)
            </label>
            <input
              type="text"
              value={chapterNumbers}
              onChange={(e) => setChapterNumbers(e.target.value)}
              placeholder="1,2,3 или 1-5,8,10-15"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              disabled={isParsing}
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Оставьте пустым для всех глав или укажите через запятую/тире
            </p>
          </div>

          {/* Custom Fields for Title Import */}
          {parsingMode === "title_import" && (
            <div className="space-y-4 p-4 bg-[var(--background)] rounded-lg">
              <h3 className="font-medium text-[var(--foreground)]">
                Настройки импорта
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Название (опционально)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Оставить пустым для автоопределения"
                    className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                    disabled={isParsing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Тип тайтла
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
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
                  onChange={(e) => setCustomGenres(e.target.value)}
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
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Оставить пустым для автоопределения"
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none"
                  disabled={isParsing}
                />
              </div>
            </div>
          )}

          {/* Progress Display */}
          {(currentProgress || isParsing) && (
            <div className="p-4 bg-[var(--background)] rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {isParsing && !currentProgress && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                )}
                {currentProgress?.status === "started" && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                )}
                {currentProgress?.status === "progress" && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                )}
                {currentProgress?.status === "completed" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {currentProgress?.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-[var(--foreground)]">
                    {currentProgress?.message ||
                      (isParsing ? "Парсинг запущен..." : "Ожидание...")}
                  </div>
                  {currentProgress?.progress && (
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {currentProgress.progress.current} /{" "}
                      {currentProgress.progress.total} (
                      {currentProgress.progress.percentage}%)
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
            <div className="p-4 bg-[var(--background)] rounded-lg">
              <h3 className="font-medium text-[var(--foreground)] mb-3">
                Найденные главы ({chaptersInfo.totalChapters})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {chaptersInfo.chapters
                  .slice(0, 10)
                  .map((chapter: ChapterInfo, index: number) => (
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors"
            disabled={isParsing}
          >
            Закрыть
          </button>
          <button
            onClick={handleStartParsing}
            disabled={!isConnected || !url.trim() || isParsing}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Парсинг...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Начать парсинг
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
