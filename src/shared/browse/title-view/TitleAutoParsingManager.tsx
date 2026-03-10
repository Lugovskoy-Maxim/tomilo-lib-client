"use client";

import { useState } from "react";
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  useGetAutoParsingJobsQuery,
  useCreateAutoParsingJobMutation,
  useUpdateAutoParsingJobMutation,
  useDeleteAutoParsingJobMutation,
  useCheckNewChaptersMutation,
} from "@/store/api/autoParsingApi";
import { CreateAutoParsingJobDto, UpdateAutoParsingJobDto } from "@/types/auto-parsing";
import { useMemo } from "react";

interface TitleAutoParsingManagerProps {
  titleId: string;
  titleName: string;
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

export function TitleAutoParsingManager({ titleId, titleName }: TitleAutoParsingManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: allJobs, isLoading: jobLoading, error: jobError } = useGetAutoParsingJobsQuery();

  const existingJob = useMemo(() => {
    if (!allJobs || !Array.isArray(allJobs)) return null;
    return allJobs.find(job => job.titleId?._id === titleId) || null;
  }, [allJobs, titleId]);
  const [createJob, { isLoading: createLoading }] = useCreateAutoParsingJobMutation();
  const [updateJob, { isLoading: updateLoading }] = useUpdateAutoParsingJobMutation();
  const [deleteJob, { isLoading: deleteLoading }] = useDeleteAutoParsingJobMutation();
  const [checkChapters, { isLoading: checkLoading }] = useCheckNewChaptersMutation();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (data: CreateAutoParsingJobDto) => {
    try {
      await createJob(data).unwrap();
      setIsModalOpen(false);
      showNotification("success", "Задача автопарсинга создана");
    } catch {
      showNotification("error", "Не удалось создать задачу");
    }
  };

  const handleUpdate = async (data: UpdateAutoParsingJobDto) => {
    if (!existingJob) return;
    try {
      await updateJob({ id: existingJob._id, data }).unwrap();
      setIsModalOpen(false);
      setIsEditing(false);
      showNotification("success", "Задача обновлена");
    } catch {
      showNotification("error", "Не удалось обновить задачу");
    }
  };

  const handleDelete = async () => {
    if (!existingJob) return;
    if (!confirm("Удалить задачу автопарсинга?")) return;
    try {
      await deleteJob(existingJob._id).unwrap();
      showNotification("success", "Задача удалена");
    } catch {
      showNotification("error", "Не удалось удалить задачу");
    }
  };

  const handleCheckChapters = async () => {
    if (!existingJob) return;
    try {
      const result = await checkChapters(existingJob._id).unwrap();
      showNotification(
        "success",
        `Найдено глав: ${result.chaptersFound}, добавлено: ${result.chaptersAdded}`,
      );
    } catch {
      showNotification("error", "Ошибка при проверке глав");
    }
  };

  const handleOpenModal = (editing: boolean) => {
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const hasJob = !!existingJob;
  const hasError = !!jobError;

  const actionButtonClass =
    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--primary)]/30 hover:shadow-md";

  return (
    <>
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
            notification.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {jobLoading ? (
          <div className={actionButtonClass}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Загрузка...</span>
          </div>
        ) : hasError ? (
          <div className={`${actionButtonClass} text-red-500`}>
            <AlertCircle className="w-4 h-4" />
            <span>Ошибка загрузки</span>
          </div>
        ) : hasJob ? (
          <>
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium">Автопарсинг</span>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    existingJob.enabled ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={existingJob.enabled ? "Активен" : "Отключен"}
                />
              </div>

              <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="capitalize">{existingJob.frequency}</span>
                  {existingJob.scheduleHour !== undefined && existingJob.scheduleHour !== null && (
                    <span>
                      {" "}
                      • {existingJob.scheduleHour}:
                      {String(existingJob.scheduleMinute ?? 0).padStart(2, "0")} UTC
                    </span>
                  )}
                </div>
                {existingJob.sources && existingJob.sources.length > 0 && (
                  <div className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>{existingJob.sources.length} источник(ов)</span>
                  </div>
                )}
              </div>

              <div className="flex gap-1 pt-1">
                <button
                  onClick={handleCheckChapters}
                  disabled={checkLoading}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                  title="Проверить новые главы"
                >
                  <RefreshCw className={`w-3 h-3 ${checkLoading ? "animate-spin" : ""}`} />
                  Проверить
                </button>
                <button
                  onClick={() => handleOpenModal(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-3 h-3" />
                  Изменить
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex items-center justify-center py-1.5 px-2 text-xs rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button onClick={() => handleOpenModal(false)} className={actionButtonClass}>
            <Plus className="w-4 h-4" />
            <span>Автопарсинг</span>
          </button>
        )}
      </div>

      {isModalOpen && (
        <AutoParsingModal
          titleId={titleId}
          titleName={titleName}
          existingJob={isEditing ? existingJob : null}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditing(false);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          isLoading={createLoading || updateLoading}
        />
      )}
    </>
  );
}

interface AutoParsingModalProps {
  titleId: string;
  titleName: string;
  existingJob:
    | {
        _id: string;
        sources?: string[];
        url?: string;
        frequency: string;
        scheduleHour?: number;
        enabled: boolean;
      }
    | null
    | undefined;
  onClose: () => void;
  onCreate: (data: CreateAutoParsingJobDto) => void;
  onUpdate: (data: UpdateAutoParsingJobDto) => void;
  isLoading: boolean;
}

function AutoParsingModal({
  titleId,
  titleName,
  existingJob,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
}: AutoParsingModalProps) {
  const [sources, setSources] = useState<string[]>(() => {
    if (existingJob?.sources && existingJob.sources.length > 0) return existingJob.sources;
    if (existingJob?.url?.trim()) return [existingJob.url.trim()];
    return [""];
  });
  const [frequency, setFrequency] = useState(existingJob?.frequency || "daily");
  const [scheduleHour, setScheduleHour] = useState<string>(
    existingJob?.scheduleHour !== undefined && existingJob.scheduleHour !== null
      ? String(existingJob.scheduleHour)
      : "",
  );
  const [scheduleMinute, setScheduleMinute] = useState<string>(
    existingJob?.scheduleMinute !== undefined && existingJob.scheduleMinute !== null
      ? String(existingJob.scheduleMinute)
      : "0",
  );
  const [enabled, setEnabled] = useState(existingJob?.enabled ?? true);

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

    if (existingJob) {
      const data: UpdateAutoParsingJobDto = {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {existingJob ? "Редактировать автопарсинг" : "Создать автопарсинг"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">Тайтл:</p>
          <p className="font-medium">{titleName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Источники
            </label>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={source}
                    onChange={e => handleSourceChange(index, e.target.value)}
                    placeholder="https://example.com/manga/title"
                    className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    required={index === 0}
                  />
                  {sources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
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
              Частота
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
                className="w-24 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
              Опционально. Задача запускается в выбранный слот каждые 10 минут.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
            />
            <label htmlFor="enabled" className="text-sm text-[var(--foreground)]">
              Активная задача
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {existingJob ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
