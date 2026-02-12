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
  X,
} from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
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
      setModalContent({
        title: "Проверка завершена",
        message: "Проверка новых глав успешно завершена",
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to check chapters:", error);
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

  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    if (coverImage.startsWith("http")) return coverImage;
    return `${process.env.NEXT_PUBLIC_URL}${coverImage}`;
  };

  return (
    <div className="space-y-6 p-2">
      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              {modalContent.title.includes("Ошибка") ? (
                <AlertCircle className="w-5 h-5 text-[var(--destructive)]" />
              ) : (
                <CheckCircle className="w-5 h-5 text-[var(--chart-2)]" />
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
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать задачу
        </button>
      </div>

      {/* Jobs List */}
      <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job: AutoParsingJob) => (
              <div
                key={job._id}
                className="border border-[var(--border)] flex flex-col rounded-[var(--admin-radius)] p-2 hover:border-[var(--primary)] transition-colors overflow-hidden"
              >
                <div className="flex gap-2">
                  <div className="w-24 h-32 bg-[var(--accent)] rounded overflow-hidden flex-shrink-0">
                    {job.titleId?.coverImage ? (
                      <OptimizedImage
                        src={getImageUrl(job.titleId.coverImage)}
                        alt={job.titleId?.name || "Title"}
                        className="w-full h-full object-cover"
                        width={96}
                        height={128}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--muted)]">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-[var(--admin-radius)] ${
                            job.enabled ? "bg-[var(--chart-2)]" : "bg-[var(--destructive)]"
                          }`}
                        />
                        <h3 className="font-medium text-[var(--foreground)] truncate">
                          {job.titleId?.name || "Не указан"}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        ID: {job._id.slice(-8)}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {job.titleId?.releaseYear && `${job.titleId.releaseYear} • `}
                        {job.titleId?.author || "Неизвестен"}
                      </p>
                    </div>

                    <div className="mb-3 w-full">
                      <span className="text-xs text-[var(--muted-foreground)] block mb-1">
                        Источники:
                      </span>
                      <div className="flex flex-col gap-1 w-full">
                        {(job.sources && job.sources.length > 0 ? job.sources : [])
                          .slice(0, 2)
                          .map((source, idx) => (
                            <div key={idx} className="flex items-start gap-1 w-full break-all">
                              <span className="text-[var(--foreground)] text-xs flex-1 min-w-0">
                                {source}
                              </span>
                              <button
                                onClick={() => window.open(source, "_blank")}
                                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        {job.sources && job.sources.length > 2 && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            +{job.sources.length - 2} ещё
                          </span>
                        )}
                        {(!job.sources || job.sources.length === 0) && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            Не указаны
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-5 h-5" />
                    <span className="capitalize">{job.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCheckChapters(job._id)}
                      disabled={checkLoading}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                      title="Проверить новые главы"
                    >
                      <RefreshCw className={`w-6 h-6 ${checkLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => setEditingJob(job)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Редактировать"
                    >
                      <Edit className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      disabled={deleteLoading}
                      className="p-2 text-red-500 hover:text-red-600 disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
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
  const [sources, setSources] = useState<string[]>(
    job?.sources && job.sources.length > 0 ? job.sources : [""],
  );
  const [frequency, setFrequency] = useState(job?.frequency || "daily");
  const [enabled, setEnabled] = useState(job?.enabled ?? true);

  const handleAddSource = () => {
    setSources([...sources, ""]);
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSourceChange = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSources = sources.filter(s => s.trim());

    if (job && onUpdate) {
      const data: UpdateAutoParsingJobDto = {
        titleId: titleId || undefined,
        sources: validSources.length > 0 ? validSources : undefined,
        frequency: frequency || undefined,
        enabled,
      };
      onUpdate(data);
    } else {
      const data: CreateAutoParsingJobDto = {
        titleId,
        sources: validSources,
        frequency: frequency || undefined,
        enabled,
      };
      onCreate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          {job ? "Редактировать задачу" : "Создать задачу"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="admin-input w-full"
              required
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(title => (
                  <div
                    key={title._id}
                    onClick={() => onSelectTitle(title, setTitleId)}
                    className="px-3 py-2.5 hover:bg-[var(--accent)] cursor-pointer border-b border-[var(--border)] last:border-b-0 rounded-[var(--admin-radius)]"
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
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Источники *
            </label>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={source}
                    onChange={e => handleSourceChange(index, e.target.value)}
                    placeholder="https://example.com/manga/title"
                    className="admin-input flex-1"
                    required={index === 0}
                  />
                  {sources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="p-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 bg-[var(--background)] border border-[var(--border)] rounded-[var(--admin-radius)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSource}
              className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Добавить источник
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Частота *
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="admin-input w-full"
              required
            >
              <option value="daily">Ежедневно</option>
              <option value="hourly">Ежечасно</option>
              <option value="weekly">Еженедельно</option>
              <option value="monthly">Ежемесячно</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="rounded-[var(--admin-radius)]"
            />
            <label htmlFor="enabled" className="text-sm text-[var(--foreground)]">
              Активная задача
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="admin-btn admin-btn-primary flex-1 flex items-center justify-center gap-2"
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
