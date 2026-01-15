"use client";

import React, { useState } from "react";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  useGetAutoParsingJobsQuery,
  useCreateAutoParsingJobMutation,
  useUpdateAutoParsingJobMutation,
  useDeleteAutoParsingJobMutation,
  useCheckNewChaptersMutation,
} from "@/store/api/autoParsingApi";
import {
  AutoParsingJob,
  CreateAutoParsingJobDto,
  UpdateAutoParsingJobDto,
} from "@/types/auto-parsing";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import { formatDate } from "@/lib/date-utils";

export default function AutoParsingSection() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<AutoParsingJob | null>(null);
  const [titleSearch, setTitleSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);

  // API hooks
  const { data: jobsResponse, isLoading: jobsLoading } = useGetAutoParsingJobsQuery();
  const [createJob, { isLoading: createLoading }] = useCreateAutoParsingJobMutation();
  const [updateJob, { isLoading: updateLoading }] = useUpdateAutoParsingJobMutation();
  const [deleteJob, { isLoading: deleteLoading }] = useDeleteAutoParsingJobMutation();
  const [checkChapters, { isLoading: checkLoading }] = useCheckNewChaptersMutation();

  // Search titles
  const { data: searchResultsResponse } = useSearchTitlesQuery(
    { search: titleSearch, limit: 5 },
    { skip: !titleSearch || titleSearch.length < 2 },
  );

  const searchResults: Title[] = searchResultsResponse?.data?.data || [];

  const jobs = jobsResponse || [];

  const handleCreateJob = async (data: CreateAutoParsingJobDto) => {
    try {
      await createJob(data).unwrap();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  };

  const handleUpdateJob = async (id: string, data: UpdateAutoParsingJobDto) => {
    try {
      await updateJob({ id, data }).unwrap();
      setEditingJob(null);
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      try {
        await deleteJob(id).unwrap();
      } catch (error) {
        console.error("Failed to delete job:", error);
      }
    }
  };

  const handleCheckChapters = async (id: string) => {
    try {
      await checkChapters(id).unwrap();
      // Показываем модальное окно с результатом
      setModalContent({
        title: "Проверка завершена",
        message: "Проверка новых глав успешно завершена",
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to check chapters:", error);
      // Показываем модальное окно с ошибкой
      setModalContent({
        title: "Ошибка проверки",
        message: "Произошла ошибка при проверке новых глав",
      });
      setIsModalOpen(true);
    }
  };

  const selectTitle = (title: Title, setter: (value: string) => void) => {
    setter(title._id);
    setTitleSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
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
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Автоматический парсинг
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Управление задачами автоматического парсинга
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать задачу
        </button>
      </div>

      {/* Jobs List */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">Нет задач автоматического парсинга</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job: AutoParsingJob) => (
              <div key={job._id} className="border border-[var(--border)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        job.enabled ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <h3 className="font-medium text-[var(--foreground)]">
                        Задача {job._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Title: {job.titleId?.name || "Не указан"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCheckChapters(job._id)}
                      disabled={checkLoading}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                      title="Проверить новые главы"
                    >
                      <RefreshCw className={`w-4 h-4 ${checkLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => setEditingJob(job)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      disabled={deleteLoading}
                      className="p-1 text-red-500 hover:text-red-600 disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">URL:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[var(--foreground)] truncate text-xs">{job.url}</span>
                      <button
                        onClick={() => window.open(job.url, "_blank")}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Частота:</span>
                    <p className="text-[var(--foreground)] mt-1 text-xs">{job.frequency}</p>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Создано:</span>
                    <p className="text-[var(--foreground)] mt-1 text-xs">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Обновлено:</span>
                    <p className="text-[var(--foreground)] mt-1 text-xs">
                      {formatDate(job.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingJob) && (
        <JobModal
          job={editingJob}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingJob(null);
          }}
          onCreate={handleCreateJob}
          onUpdate={editingJob ? data => handleUpdateJob(editingJob._id, data) : undefined}
          isLoading={createLoading || updateLoading}
          searchResults={searchResults}
          titleSearch={titleSearch}
          setTitleSearch={setTitleSearch}
          onSelectTitle={selectTitle}
        />
      )}
    </div>
  );
}

interface JobModalProps {
  job: AutoParsingJob | null;
  onClose: () => void;
  onCreate: (data: CreateAutoParsingJobDto) => void;
  onUpdate?: (data: UpdateAutoParsingJobDto) => void;
  isLoading: boolean;
  searchResults: Title[];
  titleSearch: string;
  setTitleSearch: (value: string) => void;
  onSelectTitle: (title: Title, setter: (value: string) => void) => void;
}

function JobModal({
  job,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  searchResults,
  setTitleSearch,
  onSelectTitle,
}: JobModalProps) {
  const [titleId, setTitleId] = useState(job?.titleId?._id || "");
  const [url, setUrl] = useState(job?.url || "");
  const [frequency, setFrequency] = useState(job?.frequency || "daily");
  const [enabled, setEnabled] = useState(job?.enabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (job && onUpdate) {
      // Update case - use UpdateAutoParsingJobDto
      const data: UpdateAutoParsingJobDto = {
        titleId: titleId || undefined,
        url: url || undefined,
        frequency: frequency || undefined,
        enabled,
      };
      onUpdate(data);
    } else {
      // Create case - use CreateAutoParsingJobDto
      const data: CreateAutoParsingJobDto = {
        titleId,
        url,
        frequency,
      };
      onCreate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          {job ? "Редактировать задачу" : "Создать задачу"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title ID */}
          <div className="relative">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              ID тайтла *
            </label>
            <input
              type="text"
              value={titleId}
              onChange={e => {
                setTitleId(e.target.value);
                setTitleSearch(e.target.value);
              }}
              placeholder="Введите ID тайтла или начните поиск..."
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              required
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(title => (
                  <div
                    key={title._id}
                    onClick={() => onSelectTitle(title, setTitleId)}
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

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              URL источника *
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/manga/title"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Частота *
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              required
            >
              <option value="daily">Ежедневно</option>
              <option value="hourly">Ежечасно</option>
              <option value="weekly">Еженедельно</option>
            </select>
          </div>

          {/* Enabled Status */}
          {job && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="enabled" className="text-sm text-[var(--foreground)]">
                Активная задача
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)]/80"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {job ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
