"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  useGetSuggestionsQuery,
  useUploadSuggestionImageMutation,
  useCreateSuggestionMutation,
  useVoteSuggestionMutation,
  useUpdateSuggestionMutation,
  useDeleteSuggestionMutation,
  type SuggestedDecoration,
} from "@/store/api/shopApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getDecorationImageUrls } from "@/api/shop";
import type { Decoration } from "@/api/shop";
import { Lightbulb, Upload, ThumbsUp, Image as ImageIcon, ChevronDown, ChevronUp, Pencil, FileText, Trash2, Clock } from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { DecorationCard } from "@/shared/shop/DecorationCard";

const SUGGESTION_TYPES: { id: SuggestedDecoration["type"]; label: string }[] = [
  { id: "avatar", label: "Аватар" },
  { id: "frame", label: "Рамка" },
  { id: "background", label: "Фон" },
  { id: "card", label: "Карточка" },
];

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ONE_HOUR_MS = 60 * 60 * 1000;

function isWithinOneHour(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < ONE_HOUR_MS;
}

const DECORATION_RULES = [
  "Изображение: PNG, JPG, WEBP или GIF, не более 20 МБ.",
  "Только своя работа или работа с разрешения автора; не нарушайте авторские права.",
  "Контент должен соответствовать правилам сайта: без оскорбительного, неприемлемого и NSFW-материала.",
  "Один аккаунт — одно предложение в неделю. Редактировать можно только в течение 1 часа после отправки.",
];

/** Следующий понедельник 00:00 (локальное время) — момент принятия победителя недели. */
function getNextAcceptanceDate(): Date {
  const now = new Date();
  const next = new Date(now);
  const day = now.getDay();
  const daysToAdd = day === 0 ? 1 : (8 - day) % 7;
  next.setDate(now.getDate() + daysToAdd);
  next.setHours(0, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
  return next;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0 мин.";
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} д.`);
  if (h > 0) parts.push(`${h} ч.`);
  parts.push(`${m} мин.`);
  return parts.join(" ");
}

export function ShopSuggestionsBlock() {
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = user?.id ?? (user as { _id?: string })?._id ?? null;
  const isAdmin = (user as { role?: string })?.role === "admin";

  const { data: suggestions = [], isLoading: loadingSuggestions } = useGetSuggestionsQuery();
  const [uploadImage, { isLoading: uploading }] = useUploadSuggestionImageMutation();
  const [createSuggestion, { isLoading: creating }] = useCreateSuggestionMutation();
  const [updateSuggestion, { isLoading: updating }] = useUpdateSuggestionMutation();
  const [deleteSuggestion, { isLoading: deleting }] = useDeleteSuggestionMutation();
  const [voteSuggestion, { isLoading: voting }] = useVoteSuggestionMutation();

  const [form, setForm] = useState({
    type: "avatar" as SuggestedDecoration["type"],
    name: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [previewSuggestionId, setPreviewSuggestionId] = useState<string | null>(null);

  const nextAcceptance = useMemo(() => getNextAcceptanceDate(), []);
  const [countdownMs, setCountdownMs] = useState(() =>
    Math.max(0, nextAcceptance.getTime() - Date.now()),
  );
  useEffect(() => {
    const tick = () => setCountdownMs((prev) => Math.max(0, nextAcceptance.getTime() - Date.now()));
    const id = setInterval(tick, 60_000);
    tick();
    return () => clearInterval(id);
  }, [nextAcceptance]);

  /** Преобразовать предложение в вид Decoration для превью и карточки */
  const suggestionToDecoration = (s: SuggestedDecoration): Decoration => ({
    id: s.id,
    name: s.name,
    description: s.description || "",
    price: 0,
    imageUrl: s.imageUrl,
    type: s.type,
    rarity: "common",
    authorId: s.authorId,
    authorUsername: s.authorUsername,
    authorLevel: s.authorLevel,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой (макс. 20 МБ)");
      e.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const editingSuggestion = editingSuggestionId
    ? suggestions.find((s) => s.id === editingSuggestionId)
    : null;

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (editingSuggestionId) {
      try {
        const payload: { name: string; description?: string; imageUrl?: string } = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        };
        if (imageFile) {
          const { imageUrl } = await uploadImage(imageFile).unwrap();
          if (imageUrl) payload.imageUrl = imageUrl;
        }
        await updateSuggestion({ id: editingSuggestionId, ...payload }).unwrap();
        toast.success("Предложение обновлено");
        setEditingSuggestionId(null);
        setForm({ type: "avatar", name: "", description: "" });
        setImageFile(null);
        fileInputRef.current && (fileInputRef.current.value = "");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "data" in err
            ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
            : "Не удалось обновить предложение";
        toast.error(msg);
      }
      return;
    }
    if (!imageFile) {
      toast.error("Загрузите изображение");
      return;
    }
    try {
      const { imageUrl } = await uploadImage(imageFile).unwrap();
      if (!imageUrl) {
        toast.error("Не удалось загрузить изображение");
        return;
      }
      await createSuggestion({
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        imageUrl,
      }).unwrap();
      toast.success("Предложение отправлено");
      setForm({ type: "avatar", name: "", description: "" });
      setImageFile(null);
      fileInputRef.current && (fileInputRef.current.value = "");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось отправить предложение";
      toast.error(msg);
    }
  };

  const startEdit = (s: SuggestedDecoration) => {
    setEditingSuggestionId(s.id);
    setForm({
      type: s.type,
      name: s.name,
      description: s.description ?? "",
    });
    setImageFile(null);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const cancelEdit = () => {
    setEditingSuggestionId(null);
    setForm({ type: "avatar", name: "", description: "" });
    setImageFile(null);
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm("Удалить это предложение? Действие нельзя отменить.")) return;
    try {
      await deleteSuggestion(id).unwrap();
      toast.success("Предложение удалено");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось удалить";
      toast.error(msg);
    }
  };

  const handleVote = async (id: string) => {
    try {
      await voteSuggestion(id).unwrap();
      toast.success("Голос учтён");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось проголосовать";
      toast.error(msg);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={isOpen}
        aria-controls="shop-suggestions-content"
        id="shop-suggestions-heading"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
          Предложенные украшения
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
            beta
          </span>
        </h2>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
        )}
      </button>

      <p className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]" role="status">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
        До принятия топ‑1: {formatCountdown(countdownMs)}
      </p>

      <div
        id="shop-suggestions-content"
        role="region"
        aria-labelledby="shop-suggestions-heading"
        className={`mt-4 min-w-0 ${!isOpen ? "max-h-[300px] overflow-hidden" : ""}`}
      >
        {isOpen && (
          <>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Предложите своё украшение или голосуйте за понравившиеся. Раз в неделю победитель по голосам добавляется в магазин (цена зависит от числа голосов). Автор получает 10% от продаж.
            </p>

            <div className="mb-4 p-3 rounded-lg bg-[var(--muted)]/20 border border-[var(--border)]">
              <p className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)] mb-2">
                <FileText className="w-4 h-4 shrink-0" aria-hidden />
                Требования к декорациям
              </p>
              <ul className="text-xs text-[var(--muted-foreground)] space-y-1 list-disc list-inside">
                {DECORATION_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>

            {isAuthenticated && (
        <form
          onSubmit={handleSubmitSuggestion}
          className="mb-6 p-4 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] space-y-3"
        >
          {editingSuggestionId && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Редактирование (доступно в течение 1 часа после отправки). Изображение можно не менять.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as SuggestedDecoration["type"] }))
                }
                disabled={!!editingSuggestionId}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm disabled:opacity-60"
              >
                {SUGGESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Название *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Название украшения"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Краткое описание"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Изображение {editingSuggestionId ? "(оставьте пустым, чтобы не менять)" : "* (только загрузка файла)"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={handleFileChange}
              className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
            />
            {imageFile && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {editingSuggestion && !imageFile && editingSuggestion.imageUrl && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-[var(--muted)]">
                <OptimizedImage
                  src={getDecorationImageUrls(editingSuggestion.imageUrl).primary}
                  fallbackSrc={getDecorationImageUrls(editingSuggestion.imageUrl).fallback}
                  alt=""
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={creating || uploading || updating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {creating || uploading || updating ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {editingSuggestionId ? "Сохранить" : "Предложить"}
            </button>
            {editingSuggestionId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      )}

            {!isAuthenticated && (
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Войдите в аккаунт, чтобы предложить украшение или проголосовать.
              </p>
            )}

            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 mt-4">
              Уже предложенные (ниже)
            </p>
          </>
        )}

        {/* Один ряд карточек всегда виден; при развороте — полная сетка */}
        {loadingSuggestions ? (
          <div className="flex justify-center py-8">
            <span className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4">
            Пока нет предложений. Станьте первым!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 justify-items-stretch items-stretch">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="relative group w-full min-w-0 flex flex-col items-center justify-start overflow-hidden"
              >
                <div className="relative w-full min-w-0 flex flex-col items-center justify-start overflow-hidden">
                  {(isAdmin ||
                    (isAuthenticated &&
                      s.status === "pending" &&
                      currentUserId &&
                      s.authorId === currentUserId &&
                      isWithinOneHour(s.createdAt))) && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {isAuthenticated &&
                        s.status === "pending" &&
                        currentUserId &&
                        s.authorId === currentUserId &&
                        isWithinOneHour(s.createdAt) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(s);
                            }}
                            className="p-1.5 sm:p-2 rounded-lg bg-black/35 text-white hover:bg-black/55 backdrop-blur-sm"
                            title="Редактировать"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSuggestion(s.id);
                          }}
                          disabled={deleting}
                          className="p-1.5 sm:p-2 rounded-lg bg-black/35 text-white hover:bg-red-500/80 backdrop-blur-sm"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <DecorationCard
                    decoration={suggestionToDecoration(s)}
                    sectionType={s.type}
                    hidePurchase
                    isOwned={false}
                    isEquipped={false}
                    authorDisplay="cultivator"
                    cultivatorLevel={s.authorLevel ?? 0}
                  />
                </div>
                <div
                  className="p-2 border-t border-[var(--border)] bg-[var(--card)] rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl -mt-px space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        s.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : s.status === "rejected"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {s.status === "accepted"
                        ? "Принято"
                        : s.status === "rejected"
                          ? "Отклонено"
                          : "На голосовании"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                      <ThumbsUp className="w-3 h-3 shrink-0" aria-hidden />
                      {s.votesCount}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                    {s.authorUsername
                      ? `Автор: ${s.authorUsername}${s.authorLevel ? ` · ур. ${s.authorLevel}` : ""}`
                      : s.authorLevel
                        ? `Автор: уровень ${s.authorLevel}`
                        : "Автор скрыт"}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSuggestionId(s.id)}
                      className="py-1 px-2 rounded-lg text-[10px] font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    >
                      Предпросмотр
                    </button>
                    {isAuthenticated && s.status === "pending" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleVote(s.id);
                        }}
                        disabled={s.userHasVoted || voting}
                        className="py-1 px-2 rounded-lg text-[10px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {s.userHasVoted ? "Голос учтён" : "Голосовать"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewSuggestionId && (() => {
        const s = suggestions.find((x) => x.id === previewSuggestionId);
        if (!s) return null;
        const deco = suggestionToDecoration(s);
        return (
          <DecorationCard
            decoration={deco}
            hidePurchase
            previewOnly
            onPreviewClose={() => setPreviewSuggestionId(null)}
            sectionType={s.type}
            authorDisplay="cultivator"
            cultivatorLevel={s.authorLevel ?? 0}
          />
        );
      })()}
    </section>
  );
}
