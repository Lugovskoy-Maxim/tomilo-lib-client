"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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
  FileDown,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
  GripVertical,
  Search,
  LayoutGrid,
} from "lucide-react";
import { mangaParserApi } from "@/store/api/mangaParserApi";
import type { AppDispatch } from "@/store";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getCoverUrls } from "@/lib/asset-url";
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
    if (
      !normalized ||
      normalized === "null" ||
      normalized === "undefined" ||
      normalized === "none"
    ) {
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
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [restFromHour, setRestFromHour] = useState(2);
  const [restFromMinute, setRestFromMinute] = useState(0);
  const [restToHour, setRestToHour] = useState(6);
  const [restToMinute, setRestToMinute] = useState(0);
  const [distributeProgress, setDistributeProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<
    { type: "none" } | { type: "slot"; hour: number; minute: number } | null
  >(null);

  const dispatch = useDispatch<AppDispatch>();

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

  const handleSyncChapters = async (job: AutoParsingJob) => {
    const titleId = job.titleId?._id;
    const sources = getJobDisplaySources(job);
    const sourceUrl = sources[0]?.trim();
    if (!titleId || !sourceUrl) {
      setModalContent({
        title: "Ошибка",
        message: "У задачи нет тайтла или источника для синхронизации",
      });
      setIsModalOpen(true);
      return;
    }
    setSyncingJobId(job._id);
    try {
      const res = await dispatch(
        mangaParserApi.endpoints.syncChapters.initiate({
          titleId,
          sourceUrl,
        }),
      ).unwrap();
      if (res.data) {
        setModalContent({
          title: "Синхронизация завершена",
          message: `Обновлено: ${res.data.synced.length}, пропущено: ${res.data.skipped.length}, ошибок: ${res.data.errors.length}`,
        });
        setIsModalOpen(true);
      }
    } catch (e) {
      const message =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка синхронизации")
          : "Ошибка синхронизации";
      setModalContent({ title: "Ошибка синхронизации", message });
      setIsModalOpen(true);
    } finally {
      setSyncingJobId(null);
    }
  };

  const selectTitle = (title: Title, setter: (value: string) => void) => {
    setter(title._id);
    setTitleSearch("");
  };

  const getImageUrls = (coverImage?: string) => {
    return getCoverUrls(coverImage, IMAGE_HOLDER.src);
  };

  const getImageUrl = (coverImage?: string) => {
    return getImageUrls(coverImage).primary;
  };

  const getJobDisplaySources = (job: AutoParsingJob): string[] =>
    job.sources?.length ? job.sources : job.url?.trim() ? [job.url.trim()] : [];

  /** Для таблицы расписания: фильтр по поиску (название, автор, id, источники). */
  const filteredJobsForSchedule = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter(job => {
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
  }, [jobs, jobSearch]);

  /** Ключ слота: "none" или "hour-minute" (например "7-10"). */
  const jobsBySlot = useMemo(() => {
    const map = new Map<string, AutoParsingJob[]>();
    map.set("none", []);
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 10, 20, 30, 40, 50]) {
        map.set(`${h}-${m}`, []);
      }
    }
    filteredJobsForSchedule.forEach(job => {
      const hour = getValidScheduleHour(job.scheduleHour);
      const minute = job.scheduleMinute ?? 0;
      const key = hour === null ? "none" : `${hour}-${minute}`;
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    });
    return map;
  }, [filteredJobsForSchedule]);
  const getSlotCount = (slotKey: string) => jobsBySlot.get(slotKey)?.length ?? 0;
  const selectedSlotJobs = useMemo(() => {
    if (!selectedSlot) return [];
    if (selectedSlot.type === "none") return jobsBySlot.get("none") ?? [];
    return jobsBySlot.get(`${selectedSlot.hour}-${selectedSlot.minute}`) ?? [];
  }, [selectedSlot, jobsBySlot]);
  const selectedSlotLabel =
    !selectedSlot
      ? ""
      : selectedSlot.type === "none"
        ? "Без часа"
        : `${selectedSlot.hour}:${String(selectedSlot.minute).padStart(2, "0")} UTC`;
  const totalScheduledCount = useMemo(
    () =>
      Array.from(jobsBySlot.entries()).reduce(
        (acc, [key, list]) => (key === "none" ? acc : acc + list.length),
        0,
      ),
    [jobsBySlot],
  );
  const MINUTE_SLOTS = [0, 10, 20, 30, 40, 50] as const;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find(j => j._id === event.active.id);
    if (job) setActiveJob(job);
  };

  const hasScheduleSearch = jobSearch.trim().length > 0;

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over?.id || active.id === over.id) return;
    const jobId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("slot-")) return;
    let newHour: number | null = null;
    let newMinute: number | null = null;
    if (overId === "slot-none") {
      newHour = null;
      newMinute = null;
    } else {
      const match = /^slot-(\d+)-(\d+)$/.exec(overId);
      if (!match) return;
      const h = Number(match[1]);
      const m = Number(match[2]);
      if (h < 0 || h > 23 || !MINUTE_SLOTS.includes(m)) return;
      newHour = h;
      newMinute = m;
    }
    try {
      await updateJob({
        id: jobId,
        data:
          newHour === null
            ? { scheduleHour: null, scheduleMinute: null }
            : { scheduleHour: newHour, scheduleMinute: newMinute },
      }).unwrap();
    } catch (e) {
      console.error("Failed to update schedule slot:", e);
    }
  };

  /** Слоты 10 мин (hour, minute), исключая интервал отдыха [restFrom, restTo) в минутах от полуночи. */
  const buildAvailableSlots = useMemo(() => {
    return (
      fromMinutes: number,
      toMinutes: number,
    ): { hour: number; minute: number }[] => {
      const slots: { hour: number; minute: number }[] = [];
      for (let h = 0; h < 24; h++) {
        for (const m of [0, 10, 20, 30, 40, 50]) {
          const totalMinutes = h * 60 + m;
          if (totalMinutes >= toMinutes || totalMinutes < fromMinutes) {
            slots.push({ hour: h, minute: m });
          }
        }
      }
      return slots;
    };
  }, []);

  const handleDistribute = async () => {
    const fromMinutes = restFromHour * 60 + restFromMinute;
    const toMinutes = restToHour * 60 + restToMinute;
    const slots = buildAvailableSlots(fromMinutes, toMinutes);
    if (slots.length === 0) {
      setModalContent({
        title: "Ошибка",
        message: "Нет доступных слотов: интервал отдыха охватывает весь день. Уменьшите его.",
      });
      setIsModalOpen(true);
      return;
    }
    const jobsToDistribute = [...jobs].sort((a, b) => (a._id < b._id ? -1 : 1));
    if (jobsToDistribute.length === 0) {
      setModalContent({ title: "Нет задач", message: "Нет задач для распределения." });
      setIsModalOpen(true);
      return;
    }
    setDistributeProgress({ current: 0, total: jobsToDistribute.length });
    try {
      for (let i = 0; i < jobsToDistribute.length; i++) {
        const job = jobsToDistribute[i];
        const slot = slots[i % slots.length];
        await updateJob({
          id: job._id,
          data: { scheduleHour: slot.hour, scheduleMinute: slot.minute },
        }).unwrap();
        setDistributeProgress({ current: i + 1, total: jobsToDistribute.length });
      }
      setModalContent({
        title: "Готово",
        message: `Распределено ${jobsToDistribute.length} задач по ${slots.length} слотам (шаг 10 мин). Время отдыха: ${restFromHour}:${String(restFromMinute).padStart(2, "0")}–${restToHour}:${String(restToMinute).padStart(2, "0")} UTC.`,
      });
      setIsModalOpen(true);
      setIsDistributeModalOpen(false);
    } catch (e) {
      setModalContent({
        title: "Ошибка",
        message: e instanceof Error ? e.message : "Не удалось обновить расписание.",
      });
      setIsModalOpen(true);
    } finally {
      setDistributeProgress(null);
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
              <button onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-primary">
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
            type="button"
            onClick={() => setIsDistributeModalOpen(true)}
            className="admin-btn admin-btn-secondary flex items-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Равномерно распределить
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </button>
        </div>
      </div>

      {/* Modal: равномерное распределение по времени */}
      {isDistributeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Равномерное распределение по времени
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Все задачи получат слоты с шагом 10 минут. Укажите интервал отдыха (UTC), в который слоты не назначаются — например, ночные часы для снижения нагрузки.
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Время отдыха (UTC)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">с</span>
                  <select
                    value={restFromHour}
                    onChange={e => setRestFromHour(Number(e.target.value))}
                    className="admin-input w-16"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  <span className="text-[var(--muted-foreground)]">:</span>
                  <select
                    value={restFromMinute}
                    onChange={e => setRestFromMinute(Number(e.target.value))}
                    className="admin-input w-16"
                  >
                    {[0, 10, 20, 30, 40, 50].map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-[var(--muted-foreground)]">по</span>
                  <select
                    value={restToHour}
                    onChange={e => setRestToHour(Number(e.target.value))}
                    className="admin-input w-16"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  <span className="text-[var(--muted-foreground)]">:</span>
                  <select
                    value={restToMinute}
                    onChange={e => setRestToMinute(Number(e.target.value))}
                    className="admin-input w-16"
                  >
                    {[0, 10, 20, 30, 40, 50].map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Слоты в этом интервале не назначаются (например, 2:00–6:00 для ночного отдыха).
                </p>
              </div>
            </div>
            {distributeProgress && (
              <div className="mb-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  Обновлено {distributeProgress.current} из {distributeProgress.total}…
                </span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !distributeProgress && setIsDistributeModalOpen(false)}
                disabled={!!distributeProgress}
                className="admin-btn admin-btn-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDistribute}
                disabled={!!distributeProgress || jobs.length === 0}
                className="admin-btn admin-btn-primary flex items-center gap-2"
              >
                {distributeProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Распределение…
                  </>
                ) : (
                  "Распределить"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Всего задач" value={jobs.length} />
        <KpiCard label="Активные" value={enabledJobsCount} />
        <KpiCard label="Отключенные" value={disabledJobsCount} />
        <KpiCard label="С фикс. часом" value={scheduledJobsCount} />
      </div>

      {/* Schedule: heatmap (часы × минуты) + панель с задачами выбранного слота */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {viewMode === "hourly" && (
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4" />
                Расписание (UTC): тепловая карта слотов
              </h3>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <div className="grid flex-1 min-w-[160px] max-w-[280px]">
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    placeholder="Поиск по названию, id, источнику..."
                    className="admin-input col-start-1 row-start-1 w-full pl-9 pr-2 py-1.5 text-sm"
                  />
                  <span className="col-start-1 row-start-1 w-9 flex items-center justify-center pointer-events-none z-10 text-[var(--muted-foreground)]">
                    <Search className="w-4 h-4 shrink-0" aria-hidden />
                  </span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] whitespace-nowrap shrink-0">
                  {hasScheduleSearch ? (
                    <>Найдено: {filteredJobsForSchedule.length} из {jobs.length}</>
                  ) : (
                    <>В слотах: {totalScheduledCount} · Клик — список</>
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-4 min-h-0">
              <div className="flex-1 min-w-0 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="w-9 py-1.5 px-0.5 font-medium text-[var(--muted-foreground)] text-xs align-bottom" />
                      <th className="text-center py-1.5 px-1 font-medium text-[var(--muted-foreground)] text-xs min-w-[52px] align-bottom">
                        Без часа
                      </th>
                      {Array.from({ length: 24 }, (_, h) => (
                        <th
                          key={h}
                          className="text-center py-1.5 px-0.5 font-medium text-[var(--muted-foreground)] text-xs min-w-[40px] align-bottom"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MINUTE_SLOTS.map(minute => (
                      <tr key={minute} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="py-0.5 px-0.5 text-right text-[var(--muted-foreground)] text-[10px] align-middle font-medium w-9">
                          :{String(minute).padStart(2, "0")}
                        </td>
                        <HeatmapSlotCell
                          droppableId="slot-none"
                          count={getSlotCount("none")}
                          isNoneColumn
                          isSelected={selectedSlot?.type === "none"}
                          onClick={() => setSelectedSlot({ type: "none" })}
                          showCount={minute === 0}
                        />
                        {Array.from({ length: 24 }, (_, h) => {
                          const count = getSlotCount(`${h}-${minute}`);
                          return (
                            <HeatmapSlotCell
                              key={h}
                              droppableId={`slot-${h}-${minute}`}
                              count={count}
                              isSelected={
                                selectedSlot?.type === "slot" &&
                                selectedSlot.hour === h &&
                                selectedSlot.minute === minute
                              }
                              onClick={() => setSelectedSlot({ type: "slot", hour: h, minute })}
                              showCount
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Панель задач выбранного слота */}
              {selectedSlot && (
                <div className="w-[320px] shrink-0 flex flex-col rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--background)] overflow-hidden">
                  <div className="flex items-center justify-between gap-2 p-3 border-b border-[var(--border)] shrink-0">
                    <span className="font-medium text-[var(--foreground)] text-sm truncate">
                      {selectedSlotLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      className="p-1.5 rounded-[var(--admin-radius)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      aria-label="Закрыть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 min-h-0">
                    {selectedSlotJobs.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                        В этом слоте нет задач. Перетащите задачу сюда из списка или из другой ячейки.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedSlotJobs.map(job => (
                          <DraggableScheduleJobCard
                            key={job._id}
                            job={job}
                            getImageUrl={getImageUrl}
                            onEdit={setEditingJob}
                            onDelete={handleDeleteJob}
                            onCheck={handleCheckChapters}
                            onSync={handleSyncChapters}
                            syncingJobId={syncingJobId}
                            deleteLoading={deleteLoading}
                            checkLoading={checkLoading}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeJob ? (
                <ScheduleJobCard job={activeJob} getImageUrl={getImageUrl} isOverlay />
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
                  {jobs.length === 0
                    ? "Нет задач автоматического парсинга"
                    : "Ничего не найдено по фильтрам"}
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
                            src={getImageUrls(job.titleId.coverImage).primary}
                            fallbackSrc={getImageUrls(job.titleId.coverImage).fallback}
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
                          onClick={() => handleSyncChapters(job)}
                          disabled={!!syncingJobId || !getJobDisplaySources(job).length}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                          title="Синхронизировать страницы глав с источника"
                        >
                          {syncingJobId === job._id ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <FileDown className="w-6 h-6" />
                          )}
                        </button>
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

const SCHEDULE_MINUTE_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: ":00" },
  { value: "10", label: ":10" },
  { value: "20", label: ":20" },
  { value: "30", label: ":30" },
  { value: "40", label: ":40" },
  { value: "50", label: ":50" },
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
  const [scheduleMinute, setScheduleMinute] = useState<string>(
    job?.scheduleMinute !== undefined && job.scheduleMinute !== null
      ? String(job.scheduleMinute)
      : "0",
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
        scheduleMinute: scheduleHour === "" ? null : Number(scheduleMinute),
        enabled,
      };
      onUpdate(data);
    } else {
      const data: CreateAutoParsingJobDto = {
        titleId,
        sources: validSources,
        frequency: frequency || undefined,
        scheduleHour: scheduleHour === "" ? undefined : Number(scheduleHour),
        scheduleMinute: scheduleHour === "" ? undefined : Number(scheduleMinute),
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
              Время запуска (UTC, шаг 10 мин)
            </label>
            <div className="flex gap-2">
              <select
                value={scheduleHour}
                onChange={e => setScheduleHour(e.target.value)}
                className="admin-input flex-1"
              >
                {SCHEDULE_HOUR_OPTIONS.map(opt => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={scheduleMinute}
                onChange={e => setScheduleMinute(e.target.value)}
                className="admin-input w-24"
                disabled={scheduleHour === ""}
              >
                {SCHEDULE_MINUTE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Опционально. Задачи запускаются в выбранный слот каждые 10 минут (например 12:30 UTC).
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

/* Тепловая карта: ячейка только с числом, клик открывает панель с задачами */
interface HeatmapSlotCellProps {
  droppableId: string;
  count: number;
  isNoneColumn?: boolean;
  isSelected: boolean;
  onClick: () => void;
  showCount: boolean;
}

function HeatmapSlotCell({
  droppableId,
  count,
  isNoneColumn,
  isSelected,
  onClick,
  showCount,
}: HeatmapSlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const intensity =
    count === 0 ? 0 : count <= 2 ? 1 : count <= 6 ? 2 : count <= 12 ? 3 : 4;
  return (
    <td
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        py-1 px-0.5 align-middle min-h-[32px] min-w-[40px] text-center text-xs font-medium
        border-r border-b border-[var(--border)] last:border-r-0
        cursor-pointer select-none transition-colors
        ${isNoneColumn ? "min-w-[52px]" : ""}
        ${count > 0 ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}
        ${intensity === 0 ? "bg-[var(--card)] hover:bg-[var(--accent)]/50" : ""}
        ${intensity === 1 ? "bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15" : ""}
        ${intensity === 2 ? "bg-[var(--primary)]/20 hover:bg-[var(--primary)]/25" : ""}
        ${intensity === 3 ? "bg-[var(--primary)]/30 hover:bg-[var(--primary)]/35" : ""}
        ${intensity === 4 ? "bg-[var(--primary)]/40 hover:bg-[var(--primary)]/50" : ""}
        ${isOver ? "ring-2 ring-[var(--primary)] ring-inset" : ""}
        ${isSelected ? "ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--card)]" : ""}
      `}
      title={
        droppableId === "slot-none"
          ? `Без часа: ${count} задач`
          : (() => {
              const [, h, m] = droppableId.split("-");
              return `${h}:${m?.padStart(2, "0")} UTC — ${count} задач`;
            })()
      }
    >
      {showCount ? (count > 0 ? count : "—") : "—"}
    </td>
  );
}

/* Schedule table: columns = hours, rows = minutes; each cell is a droppable slot */
interface SlotCellProps {
  droppableId: string;
  jobs: AutoParsingJob[];
  getImageUrl: (coverImage?: string) => string;
  onEdit: (job: AutoParsingJob) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  onSync: (job: AutoParsingJob) => void;
  syncingJobId: string | null;
  deleteLoading: boolean;
  checkLoading: boolean;
  isNoneColumn?: boolean;
}

function SlotCell({
  droppableId,
  jobs,
  getImageUrl,
  onEdit,
  onDelete,
  onCheck,
  onSync,
  syncingJobId,
  deleteLoading,
  checkLoading,
  isNoneColumn,
}: SlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  return (
    <td
      ref={setNodeRef}
      className={`py-1 px-1 align-top border-r border-[var(--border)] last:border-r-0 min-h-[44px] ${
        isNoneColumn ? "min-w-[100px]" : "min-w-[64px]"
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
            onSync={onSync}
            syncingJobId={syncingJobId}
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
  onSync?: (job: AutoParsingJob) => void;
  syncingJobId?: string | null;
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
  onSync,
  syncingJobId,
  deleteLoading,
  checkLoading,
}: ScheduleJobCardProps) {
  const hasSource = (job.sources?.length ?? 0) > 0 || !!(job.url?.trim());
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
          {onSync && (
            <button
              type="button"
              onClick={e => (e.stopPropagation(), onSync(job))}
              disabled={!!syncingJobId || !hasSource}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
              title="Синхронизировать страницы глав с источника"
            >
              {syncingJobId === job._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
            </button>
          )}
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
  onSync,
  syncingJobId,
  deleteLoading,
  checkLoading,
}: Omit<ScheduleJobCardProps, "isOverlay"> & {
  onEdit: (job: AutoParsingJob) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  onSync: (job: AutoParsingJob) => void;
  syncingJobId: string | null;
  deleteLoading: boolean;
  checkLoading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job._id,
    data: { job },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50" : ""}
    >
      <ScheduleJobCard
        job={job}
        getImageUrl={getImageUrl}
        onEdit={onEdit}
        onDelete={onDelete}
        onCheck={onCheck}
        onSync={onSync}
        syncingJobId={syncingJobId}
        deleteLoading={deleteLoading}
        checkLoading={checkLoading}
      />
    </div>
  );
}
