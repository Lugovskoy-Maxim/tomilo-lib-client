"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
  Search,
} from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getCoverUrl } from "@/lib/asset-url";
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

const getValidScheduleHour = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "null" || normalized === "undefined" || normalized === "none") {
      return null;
    }
  }

  const hour = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
};

export default function AutoParsingSection() {
  const [viewMode, setViewMode] = useState<"hourly" | "default">(() => {
    if (typeof window === "undefined") return "hourly";
    return (localStorage.getItem("admin:autoParsing:viewMode") as "hourly" | "default") || "hourly";
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<AutoParsingJob | null>(null);
  const [titleSearch, setTitleSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);
  const [activeJob, setActiveJob] = useState<AutoParsingJob | null>(null);

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

  const jobs = useMemo(() => jobsResponse || [], [jobsResponse]);
  const enabledJobsCount = useMemo(() => jobs.filter(job => job.enabled).length, [jobs]);
  const disabledJobsCount = jobs.length - enabledJobsCount;
  const scheduledJobsCount = useMemo(
    () => jobs.filter(job => getValidScheduleHour(job.scheduleHour) !== null).length,
    [jobs],
  );

  const filteredDefaultJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    return jobs.filter(job => {
      if (onlyEnabled && !job.enabled) return false;
      if (!query) return true;
      const haystack = [
        job.titleId?.name,
        job.titleId?.author,
        job.titleId?._id,
        job._id,
        ...(job.sources || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [jobSearch, jobs, onlyEnabled]);

  useEffect(() => {
    localStorage.setItem("admin:autoParsing:viewMode", viewMode);
  }, [viewMode]);

  const handleCreateJob = async (data: CreateAutoParsingJobDto) => {
    try {
      await createJob(data).unwrap();
      setIsCreateModalOpen(false);
      setModalContent({
        title: "Успешно",
        message: "Задача автопарсинга создана",
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to create job:", error);
      setModalContent({
        title: "Ошибка создания",
        message: "Не удалось создать задачу автопарсинга",
      });
      setIsModalOpen(true);
    }
  };

  const handleUpdateJob = async (id: string, data: UpdateAutoParsingJobDto) => {
    try {
      await updateJob({ id, data }).unwrap();
      setEditingJob(null);
      setModalContent({
        title: "Успешно",
        message: "Задача автопарсинга обновлена",
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to update job:", error);
      setModalContent({
        title: "Ошибка обновления",
        message: "Не удалось обновить задачу автопарсинга",
      });
      setIsModalOpen(true);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm("Удалить задачу автопарсинга? Это действие нельзя отменить.")) {
      try {
        await deleteJob(id).unwrap();
        setModalContent({
          title: "Успешно",
          message: "Задача автопарсинга удалена",
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to delete job:", error);
        setModalContent({
          title: "Ошибка удаления",
          message: "Не удалось удалить задачу автопарсинга",
        });
        setIsModalOpen(true);
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
    return getCoverUrl(coverImage, IMAGE_HOLDER.src);
  };

  const getJobDisplaySources = (job: AutoParsingJob): string[] =>
    job.sources?.length ? job.sources : job.url?.trim() ? [job.url.trim()] : [];

  const jobsByHour = useMemo(() => {
    const map = new Map<number | "none", AutoParsingJob[]>();
    map.set("none", []);
    for (let h = 0; h < 24; h++) map.set(h, []);
    jobs.forEach(job => {
      const parsedHour = getValidScheduleHour(job.scheduleHour);
      const key = parsedHour === null ? "none" : parsedHour;
      const list = key === "none" ? map.get("none")! : map.get(key)!;
      list.push(job);
    });
    return map;
  }, [jobs]);
  const getHourCount = (hour: number | "none") => jobsByHour.get(hour)?.length ?? 0;
  const totalHourlyTitles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => jobsByHour.get(h)?.length ?? 0).reduce(
        (acc, value) => acc + value,
        0,
      ),
    [jobsByHour],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find(j => j._id === event.active.id);
    if (job) setActiveJob(job);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over?.id || active.id === over.id) return;
    const jobId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("hour-")) return;
    const hourRaw = overId.replace("hour-", "");
    const newHour: number | null = hourRaw === "none" ? null : Number(hourRaw);
    if (newHour !== null && (Number.isNaN(newHour) || newHour < 0 || newHour > 23)) return;
    try {
      await updateJob({ id: jobId, data: { scheduleHour: newHour } }).unwrap();
    } catch (e) {
      console.error("Failed to update schedule hour:", e);
    }
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--background)]">
            <button
              type="button"
              onClick={() => setViewMode("hourly")}
              className={`px-3 py-1.5 text-sm rounded-[var(--admin-radius)] transition-colors ${
                viewMode === "hourly"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              По часам
            </button>
            <button
              type="button"
              onClick={() => setViewMode("default")}
              className={`px-3 py-1.5 text-sm rounded-[var(--admin-radius)] transition-colors ${
                viewMode === "default"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Обычный
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Всего задач" value={jobs.length} />
        <KpiCard label="Активные" value={enabledJobsCount} />
        <KpiCard label="Отключенные" value={disabledJobsCount} />
        <KpiCard label="С фикс. часом" value={scheduledJobsCount} />
      </div>

      {/* Schedule by hour (UTC) — drag & drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {viewMode === "hourly" && (
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Расписание по часам (UTC) — перетащите задачу в нужный час
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] whitespace-nowrap">
                0-23: {totalHourlyTitles}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 px-2 font-medium text-[var(--muted-foreground)] min-w-[140px] align-bottom">
                      <div className="flex items-center justify-between gap-2">
                        <span>Без часа</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                          {getHourCount("none")}
                        </span>
                      </div>
                    </th>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <th
                        key={h}
                        className="text-center py-2 px-2 font-medium text-[var(--muted-foreground)] min-w-[80px] align-bottom"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{h}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--muted)] text-[var(--foreground)] leading-none">
                            {getHourCount(h)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <HourCell
                      droppableId="hour-none"
                      jobs={jobsByHour.get("none")!}
                      getImageUrl={getImageUrl}
                      onEdit={setEditingJob}
                      onDelete={handleDeleteJob}
                      onCheck={handleCheckChapters}
                      deleteLoading={deleteLoading}
                      checkLoading={checkLoading}
                    />
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <HourCell
                        key={h}
                        droppableId={`hour-${h}`}
                        jobs={jobsByHour.get(h)!}
                        getImageUrl={getImageUrl}
                        onEdit={setEditingJob}
                        onDelete={handleDeleteJob}
                        onCheck={handleCheckChapters}
                        deleteLoading={deleteLoading}
                        checkLoading={checkLoading}
                      />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <DragOverlay>
              {activeJob ? (
                <ScheduleJobCard
                  job={activeJob}
                  getImageUrl={getImageUrl}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </div>
        )}

        {/* Jobs List */}
        {viewMode === "default" && (
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                placeholder="Поиск по тайтлу, id или источнику..."
                className="admin-input w-full pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyEnabled(prev => !prev)}
              className={`admin-btn ${onlyEnabled ? "admin-btn-primary" : "admin-btn-secondary"}`}
            >
              Только активные
            </button>
          </div>
          {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : filteredDefaultJobs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">
              {jobs.length === 0 ? "Нет задач автоматического парсинга" : "Ничего не найдено по фильтрам"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDefaultJobs.map((job: AutoParsingJob) => (
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
                        {getJobDisplaySources(job)
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
                        {getJobDisplaySources(job).length > 2 && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            +{getJobDisplaySources(job).length - 2} ещё
                          </span>
                        )}
                        {getJobDisplaySources(job).length === 0 && (
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
        )}

      </DndContext>

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

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
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

const SCHEDULE_HOUR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Не задан" },
  ...Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${i}:00 UTC` })),
];

function JobModal({
  job,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  searchResults,
  titleSearch,
  setTitleSearch,
  onSelectTitle,
}: JobModalProps) {
  const [titleId, setTitleId] = useState(job?.titleId?._id || "");
  const [sources, setSources] = useState<string[]>(() => {
    if (job?.sources && job.sources.length > 0) return job.sources;
    if (job?.url?.trim()) return [job.url!.trim()];
    return [""];
  });
  const [frequency, setFrequency] = useState(job?.frequency || "daily");
  const [scheduleHour, setScheduleHour] = useState<string>(
    job?.scheduleHour !== undefined && job.scheduleHour !== null ? String(job.scheduleHour) : "",
  );
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
        scheduleHour: scheduleHour === "" ? null : Number(scheduleHour),
        enabled,
      };
      onUpdate(data);
    } else {
      const data: CreateAutoParsingJobDto = {
        titleId,
        sources: validSources,
        frequency: frequency || undefined,
        scheduleHour: scheduleHour === "" ? undefined : Number(scheduleHour),
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
            {searchResults.length > 0 && titleSearch.length >= 2 && (
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

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Час запуска (UTC)
            </label>
            <select
              value={scheduleHour}
              onChange={e => setScheduleHour(e.target.value)}
              className="admin-input w-full"
            >
              {SCHEDULE_HOUR_OPTIONS.map(opt => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Опционально. Задачи с часом запускаются в этот час по UTC.
            </p>
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

/* Schedule table: droppable columns (first = "Без часа", then 0–23) */
interface HourCellProps {
  droppableId: string;
  jobs: AutoParsingJob[];
  getImageUrl: (coverImage?: string) => string;
  onEdit: (job: AutoParsingJob) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  deleteLoading: boolean;
  checkLoading: boolean;
}

function HourCell({
  droppableId,
  jobs,
  getImageUrl,
  onEdit,
  onDelete,
  onCheck,
  deleteLoading,
  checkLoading,
}: HourCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  return (
    <td
      ref={setNodeRef}
      className={`py-2 px-2 align-top border-b border-[var(--border)] min-h-[52px] min-w-[80px] ${
        droppableId === "hour-none" ? "min-w-[140px]" : ""
      } ${isOver ? "bg-[var(--primary)]/10" : ""}`}
    >
      <div className="flex flex-col gap-2">
        {jobs.map(job => (
          <DraggableScheduleJobCard
            key={job._id}
            job={job}
            getImageUrl={getImageUrl}
            onEdit={onEdit}
            onDelete={onDelete}
            onCheck={onCheck}
            deleteLoading={deleteLoading}
            checkLoading={checkLoading}
          />
        ))}
      </div>
    </td>
  );
}

interface ScheduleJobCardProps {
  job: AutoParsingJob;
  getImageUrl: (coverImage?: string) => string;
  isOverlay?: boolean;
  onEdit?: (job: AutoParsingJob) => void;
  onDelete?: (id: string) => void;
  onCheck?: (id: string) => void;
  deleteLoading?: boolean;
  checkLoading?: boolean;
}

function ScheduleJobCard({
  job,
  getImageUrl,
  isOverlay,
  onEdit,
  onDelete,
  onCheck,
  deleteLoading,
  checkLoading,
}: ScheduleJobCardProps) {
  return (
    <div
      className={`
        flex items-center gap-2 rounded-[var(--admin-radius)] border border-[var(--border)]
        bg-[var(--card)] p-2 min-w-[200px] max-w-[280px]
        ${isOverlay ? "shadow-lg cursor-grabbing" : "cursor-grab"}
      `}
    >
      {!isOverlay && (
        <div className="flex-shrink-0 text-[var(--muted-foreground)]">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <div className="w-10 h-14 bg-[var(--accent)] rounded overflow-hidden flex-shrink-0">
        {job.titleId?.coverImage ? (
          <OptimizedImage
            src={getImageUrl(job.titleId.coverImage)}
            alt={job.titleId?.name || ""}
            className="w-full h-full object-cover"
            width={40}
            height={56}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--muted)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              job.enabled ? "bg-[var(--chart-2)]" : "bg-[var(--destructive)]"
            }`}
          />
          <span className="font-medium text-[var(--foreground)] text-sm truncate block">
            {job.titleId?.name || "—"}
          </span>
        </div>
        <span className="text-xs text-[var(--muted-foreground)] capitalize">{job.frequency}</span>
      </div>
      {!isOverlay && onEdit && onDelete && onCheck && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={e => (e.stopPropagation(), onCheck(job._id))}
            disabled={checkLoading}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
            title="Проверить новые главы"
          >
            <RefreshCw className={`w-4 h-4 ${checkLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={e => (e.stopPropagation(), onEdit(job))}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={e => (e.stopPropagation(), onDelete(job._id))}
            disabled={deleteLoading}
            className="p-1.5 text-red-500 hover:text-red-600 disabled:opacity-50"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      {isOverlay && (
        <div className="flex-shrink-0 text-[var(--muted-foreground)]">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function DraggableScheduleJobCard({
  job,
  getImageUrl,
  onEdit,
  onDelete,
  onCheck,
  deleteLoading,
  checkLoading,
}: Omit<ScheduleJobCardProps, "isOverlay"> & {
  onEdit: (job: AutoParsingJob) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  deleteLoading: boolean;
  checkLoading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job._id,
    data: { job },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      <ScheduleJobCard
        job={job}
        getImageUrl={getImageUrl}
        onEdit={onEdit}
        onDelete={onDelete}
        onCheck={onCheck}
        deleteLoading={deleteLoading}
        checkLoading={checkLoading}
      />
    </div>
  );
}
