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
import {
  getDecorationImageUrls,
  VOTES_FOR_RARITY,
  DECORATION_PRICE_BY_RARITY,
  VOTE_REWARD_COINS,
  WEEKLY_SUGGESTION_WINNERS_COUNT,
} from "@/api/shop";
import {
  suggestionToDecoration,
  SUGGESTION_TYPES,
  DECORATION_RULES,
  isWithinOneHour,
  getNextAcceptanceDate,
  formatCountdown,
} from "@/lib/suggestions";

/** Типы для формы предложения: карточки предлагать нельзя. */
const SUGGESTION_TYPES_FOR_SUBMIT = SUGGESTION_TYPES.filter((t) => t.id !== "card");
import { Lightbulb, Upload, ThumbsUp, ChevronDown, ChevronUp, Pencil, FileText, Trash2, Clock, EyeOff, Eye } from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { DecorationCard } from "@/shared/shop/DecorationCard";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const STORAGE_KEY_HIDDEN = "shop:suggestions-block-hidden";

/** Доля от цены украшения, которая отправляется автору при покупке (0–100). Должно совпадать с сервером (shop.service: requiredPrice * 0.1 = 10%). Берётся из NEXT_PUBLIC_AUTHOR_REVENUE_PERCENT или fallback 10. */
const AUTHOR_REVENUE_PERCENT =
  typeof process.env.NEXT_PUBLIC_AUTHOR_REVENUE_PERCENT !== "undefined" &&
  process.env.NEXT_PUBLIC_AUTHOR_REVENUE_PERCENT !== ""
    ? Math.min(100, Math.max(0, Number(process.env.NEXT_PUBLIC_AUTHOR_REVENUE_PERCENT) || 10))
    : 10;

export function ShopSuggestionsBlock() {
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = user?.id ?? (user as { _id?: string })?._id ?? null;
  const isAdmin = (user as { role?: string })?.role === "admin";
  const [isMounted, setIsMounted] = useState(false);

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
  const [isBlockHidden, setIsBlockHidden] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      setIsBlockHidden(localStorage.getItem(STORAGE_KEY_HIDDEN) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const setBlockHidden = (hidden: boolean) => {
    setIsBlockHidden(hidden);
    try {
      if (hidden) localStorage.setItem(STORAGE_KEY_HIDDEN, "true");
      else localStorage.removeItem(STORAGE_KEY_HIDDEN);
    } catch {
      /* ignore */
    }
  };

  const nextAcceptance = useMemo(() => getNextAcceptanceDate(), []);
  const [countdownMs, setCountdownMs] = useState(0);
  useEffect(() => {
    const tick = () => setCountdownMs(() => Math.max(0, nextAcceptance.getTime() - Date.now()));
    const id = setInterval(tick, 60_000);
    tick();
    return () => clearInterval(id);
  }, [nextAcceptance]);

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
        setFormExpanded(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
      setFormExpanded(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (isBlockHidden) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-[var(--muted-foreground)]">
              <Lightbulb className="w-4 h-4 text-amber-500/70 shrink-0" aria-hidden />
              Предложенные украшения
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                beta
              </span>
              <span className="text-sm font-normal text-[var(--muted-foreground)]">(блок скрыт)</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {AUTHOR_REVENUE_PERCENT}% от цены — авторам
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBlockHidden(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden />
            Показать блок
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Шапка: заголовок + таймер + действия */}
      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border-b border-[var(--border)]/60 bg-[var(--card)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <Lightbulb className="w-4 h-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)] truncate">
              Предложенные украшения
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                beta
              </span>
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
              {AUTHOR_REVENUE_PERCENT}% авторам · {WEEKLY_SUGGESTION_WINNERS_COUNT} лучших по голосам каждый понедельник
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--muted)]/60 border border-[var(--border)]/60 text-[11px] font-medium text-[var(--foreground)]">
            <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-hidden />
            {formatCountdown(countdownMs)}
          </span>
          <button
            type="button"
            onClick={() => setBlockHidden(true)}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] transition-colors"
            title="Скрыть блок"
          >
            <EyeOff className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Ранги по голосам и награда за голос */}
        <div className="mb-4 space-y-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            По числу голосов победителям назначается ранг и цена в магазине:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["common", "rare", "epic", "legendary"] as const).map((r) => {
              const label = r === "common" ? "Обычная" : r === "rare" ? "Редкая" : r === "epic" ? "Эпическая" : "Легендарная";
              const boxStyles = {
                common: "bg-[var(--muted)]/30 border-[var(--border)]",
                rare: "bg-blue-500/10 border-blue-500/30",
                epic: "bg-violet-500/10 border-violet-500/30",
                legendary: "bg-amber-500/10 border-amber-500/30",
              };
              const labelStyles = {
                common: "text-[var(--foreground)]",
                rare: "text-blue-700 dark:text-blue-300",
                epic: "text-violet-700 dark:text-violet-300",
                legendary: "text-amber-700 dark:text-amber-300",
              };
              return (
                <div
                  key={r}
                  className={`rounded-lg border px-3 py-2 ${boxStyles[r]}`}
                >
                  <div className={`text-[11px] font-semibold ${labelStyles[r]}`}>{label}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                    от {VOTES_FOR_RARITY[r]} голосов → {DECORATION_PRICE_BY_RARITY[r]} монет
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              <ThumbsUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
              За первый голос в неделю — <strong>{VOTE_REWARD_COINS} монет</strong>
            </span>
          </div>
        </div>

        {/* Форма или призыв войти */}
        {isMounted && isAuthenticated ? (
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 p-3">
            <button
              type="button"
              onClick={() => setFormExpanded((v) => !v)}
              className="flex w-full items-center gap-2 text-left"
            >
              <Upload className="w-4 h-4 shrink-0 text-[var(--primary)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {editingSuggestionId ? "Редактирование" : "Добавить предложение"}
              </span>
              {editingSuggestionId && (
                <span className="text-[11px] text-[var(--muted-foreground)]">(до 1 ч после отправки)</span>
              )}
              {formExpanded ? (
                <ChevronUp className="w-4 h-4 shrink-0 ml-auto text-[var(--muted-foreground)]" aria-hidden />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0 ml-auto text-[var(--muted-foreground)]" aria-hidden />
              )}
            </button>
            {(formExpanded || editingSuggestionId) && (
            <form onSubmit={handleSubmitSuggestion} className="space-y-2 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-0.5">Тип</label>
                  <select
                    value={form.type === "card" ? "avatar" : form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as SuggestedDecoration["type"] }))
                    }
                    disabled={!!editingSuggestionId}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs disabled:opacity-60"
                  >
                    {SUGGESTION_TYPES_FOR_SUBMIT.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Предложения карточек не принимаются.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-0.5">Название *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Название"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-0.5">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Кратко"
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-0.5">
                  Изображение {editingSuggestionId ? "(пусто = не менять)" : "*"}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  onChange={handleFileChange}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
                />
                {(imageFile || (editingSuggestion && editingSuggestion.imageUrl && !imageFile)) && (
                  <div className="mt-1.5 w-16 h-16 rounded-md overflow-hidden bg-[var(--muted)] flex-shrink-0">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-full object-cover" />
                    ) : editingSuggestion?.imageUrl ? (
                      <OptimizedImage
                        src={getDecorationImageUrls(editingSuggestion.imageUrl).primary}
                        fallbackSrc={getDecorationImageUrls(editingSuggestion.imageUrl).fallback}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating || uploading || updating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {creating || uploading || updating ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {editingSuggestionId ? "Сохранить" : "Отправить"}
                </button>
                {editingSuggestionId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                  >
                    Отмена
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRulesOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {rulesOpen ? "Скрыть правила" : "Правила"}
                </button>
              </div>
              {rulesOpen && (
                <ul className="text-[11px] text-[var(--muted-foreground)] space-y-0.5 list-disc list-inside pt-2 border-t border-[var(--border)]/60 mt-2">
                  {DECORATION_RULES.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              )}
            </form>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Войдите, чтобы предложить украшение или голосовать.
          </p>
        )}

        {/* Сетка предложений */}
        {loadingSuggestions ? (
          <div className="flex justify-center py-6">
            <span className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] py-3">
            Пока нет предложений. Станьте первым!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 justify-items-stretch items-stretch min-w-0">
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
                    compactGrid
                  />
                </div>
                <div
                  className="p-1.5 border-t border-[var(--border)] bg-[var(--card)] rounded-b-lg sm:rounded-b-xl -mt-px flex flex-wrap items-center justify-between gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border shrink-0 ${
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
                          : "Голос"}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--muted-foreground)]">
                      <ThumbsUp className="w-2.5 h-2.5 shrink-0" aria-hidden />
                      {s.votesCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAuthenticated && s.status === "pending" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleVote(s.id);
                        }}
                        disabled={s.userHasVoted || voting}
                        className="py-0.5 px-1.5 rounded text-[9px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {s.userHasVoted ? "Учтён" : "Голосовать"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
