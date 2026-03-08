"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Gift,
  Coins,
  Crown,
  Palette,
  Users,
  Calendar,
  Hash,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  PromoCode,
  PromoCodeReward,
  PromoCodeRewardType,
  PromoCodeStatus,
  CreatePromoCodeDto,
} from "@/types/promocode";
import {
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  useGetPromoCodeUsageQuery,
  useLazyGeneratePromoCodeQuery,
} from "@/store/api/promocodesApi";
import { useGetDecorationsQuery } from "@/store/api/shopApi";
import { AdminCard } from "./ui";
import { AdminModal, ConfirmModal } from "./ui";
import { ErrorState as SharedErrorState } from "@/shared/error-state";
import { useToast } from "@/hooks/useToast";

const STATUS_OPTIONS: { value: PromoCodeStatus; label: string; color: string }[] = [
  {
    value: "active",
    label: "Активен",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "inactive",
    label: "Неактивен",
    color: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  },
  { value: "expired", label: "Истёк", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  {
    value: "exhausted",
    label: "Исчерпан",
    color: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
];

const REWARD_TYPE_OPTIONS: { value: PromoCodeRewardType; label: string; icon: typeof Coins }[] = [
  { value: "balance", label: "Монеты", icon: Coins },
  { value: "decoration", label: "Декорация", icon: Palette },
  { value: "premium", label: "Премиум", icon: Crown },
];

interface RewardFormItem {
  type: PromoCodeRewardType;
  amount: number;
  decorationId: string;
}

const emptyReward: RewardFormItem = {
  type: "balance",
  amount: 100,
  decorationId: "",
};

const emptyForm = {
  code: "",
  description: "",
  rewards: [{ ...emptyReward }] as RewardFormItem[],
  maxUses: "" as number | "",
  maxUsesPerUser: 1,
  startsAt: "",
  expiresAt: "",
  status: "active" as PromoCodeStatus,
  newUsersOnly: false,
  minLevel: "" as number | "",
};

export function PromoCodesSection() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PromoCodeStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingUsage, setViewingUsage] = useState<PromoCode | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    data: promoCodesData,
    isLoading,
    error,
    refetch,
  } = useGetPromoCodesQuery({
    page,
    limit: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const { data: decorations = [] } = useGetDecorationsQuery();
  const [createPromoCode, { isLoading: isCreating }] = useCreatePromoCodeMutation();
  const [updatePromoCode, { isLoading: isUpdating }] = useUpdatePromoCodeMutation();
  const [deletePromoCode] = useDeletePromoCodeMutation();
  const [triggerGenerateCode] = useLazyGeneratePromoCodeQuery();

  const { data: usageData, isLoading: isLoadingUsage } = useGetPromoCodeUsageQuery(
    { promoCodeId: viewingUsage?.id ?? "", page: 1, limit: 50 },
    { skip: !viewingUsage },
  );

  const promoCodes = promoCodesData?.data ?? [];
  const totalPages = Math.ceil((promoCodesData?.total ?? 0) / 20);

  const openCreate = () => {
    setEditingPromoCode(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (p: PromoCode) => {
    setEditingPromoCode(p);
    setForm({
      code: p.code,
      description: p.description ?? "",
      rewards: p.rewards.map(r => ({
        type: r.type,
        amount: r.amount ?? 0,
        decorationId: r.decorationId ?? "",
      })),
      maxUses: p.maxUses ?? "",
      maxUsesPerUser: p.maxUsesPerUser,
      startsAt: p.startsAt ? p.startsAt.slice(0, 16) : "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : "",
      status: p.status,
      newUsersOnly: p.newUsersOnly ?? false,
      minLevel: p.minLevel ?? "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPromoCode(null);
    setForm(emptyForm);
  };

  const handleGenerateCode = async () => {
    try {
      const result = await triggerGenerateCode({ length: 8, prefix: "" }).unwrap();
      setForm(f => ({ ...f, code: result.code }));
    } catch {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setForm(f => ({ ...f, code }));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Код скопирован");
  };

  const addReward = () => {
    setForm(f => ({ ...f, rewards: [...f.rewards, { ...emptyReward }] }));
  };

  const removeReward = (index: number) => {
    setForm(f => ({
      ...f,
      rewards: f.rewards.filter((_, i) => i !== index),
    }));
  };

  const updateReward = (index: number, field: keyof RewardFormItem, value: unknown) => {
    setForm(f => ({
      ...f,
      rewards: f.rewards.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Введите код промокода");
      return;
    }
    if (form.rewards.length === 0) {
      toast.error("Добавьте хотя бы одну награду");
      return;
    }

    const rewards: PromoCodeReward[] = form.rewards
      .filter(r => {
        if (r.type === "decoration") return !!r.decorationId;
        return r.amount > 0;
      })
      .map(r => {
        const reward: PromoCodeReward = { type: r.type };
        if (r.type === "balance" || r.type === "premium") {
          reward.amount = r.amount;
        }
        if (r.type === "decoration") {
          reward.decorationId = r.decorationId;
          const dec = decorations.find(d => d.id === r.decorationId);
          if (dec) reward.displayName = dec.name;
        }
        return reward;
      });

    if (rewards.length === 0) {
      toast.error("Укажите корректные награды");
      return;
    }

    const dto: CreatePromoCodeDto = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      rewards,
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      maxUsesPerUser: form.maxUsesPerUser,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      status: form.status,
      newUsersOnly: form.newUsersOnly || undefined,
      minLevel: form.minLevel === "" ? undefined : Number(form.minLevel),
    };

    try {
      if (editingPromoCode) {
        await updatePromoCode({ id: editingPromoCode.id, dto }).unwrap();
        toast.success("Промокод обновлён");
      } else {
        await createPromoCode(dto).unwrap();
        toast.success("Промокод создан");
      }
      closeForm();
      refetch();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка сохранения")
          : "Ошибка сохранения";
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePromoCode(deleteTarget.id).unwrap();
      toast.success("Промокод удалён");
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка удаления")
          : "Ошибка удаления";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusBadge = (status: PromoCodeStatus) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${opt?.color}`}
      >
        {opt?.label}
      </span>
    );
  };

  const getRewardIcon = (type: PromoCodeRewardType) => {
    const Icon = REWARD_TYPE_OPTIONS.find(r => r.value === type)?.icon ?? Gift;
    return <Icon className="w-4 h-4" />;
  };

  const formatRewards = (rewards: PromoCodeReward[]) => {
    return rewards.map((r, i) => {
      let text = "";
      switch (r.type) {
        case "balance":
          text = `${r.amount} монет`;
          break;
        case "premium":
          text = `${r.amount} дней премиума`;
          break;
        case "decoration":
          text = r.displayName ?? "Декорация";
          break;
      }
      return (
        <span key={i} className="inline-flex items-center gap-1 mr-2">
          {getRewardIcon(r.type)}
          <span>{text}</span>
        </span>
      );
    });
  };

  if (error) {
    let errMsg = "Не удалось загрузить промокоды.";
    if (error && typeof error === "object") {
      const e = error as { status?: number; data?: { message?: string } };
      if (e.status === 404) errMsg = "API промокодов не найден (404).";
      else if (e.status === 401 || e.status === 403) errMsg = "Доступ запрещён.";
      else if (e.data?.message) errMsg = String(e.data.message);
    }
    return (
      <div className="space-y-4">
        <SharedErrorState title="Ошибка загрузки" message={errMsg} />
        <div className="flex justify-center">
          <button type="button" onClick={() => refetch()} className="admin-btn admin-btn-primary">
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Промокоды</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Создавайте промокоды для выдачи монет, декораций и премиума
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Создать промокод
          </button>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по коду..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              Все
            </button>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === value
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {searchQuery || statusFilter !== "all"
              ? "Промокоды не найдены."
              : "Нет промокодов. Создайте первый."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Код
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Награды
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Использований
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Статус
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Срок действия
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map(p => {
                    const isExpanded = expandedRows.has(p.id);
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(p.id)}
                                className="p-1 rounded hover:bg-[var(--accent)]"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                                )}
                              </button>
                              <code className="font-mono font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                {p.code}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(p.code)}
                                className="p-1 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                                title="Копировать"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            {p.description && (
                              <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-7">
                                {p.description}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex flex-wrap items-center gap-1 text-xs">
                              {formatRewards(p.rewards)}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="font-medium text-[var(--foreground)]">
                              {p.usedCount}
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              {" "}
                              / {p.maxUses ?? "∞"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">{getStatusBadge(p.status)}</td>
                          <td className="py-2 px-2 text-center text-xs text-[var(--muted-foreground)]">
                            {p.expiresAt ? (
                              <span>
                                до{" "}
                                {new Date(p.expiresAt).toLocaleDateString("ru", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              "Бессрочный"
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUsage(p)}
                                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                                title="История использования"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(p)}
                                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[var(--secondary)]/30">
                            <td colSpan={6} className="py-3 px-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-[var(--muted-foreground)]">
                                    Макс. на пользователя:
                                  </span>
                                  <span className="ml-2 font-medium">{p.maxUsesPerUser}</span>
                                </div>
                                {p.newUsersOnly && (
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">
                                      Только новые:
                                    </span>
                                    <span className="ml-2 font-medium text-amber-500">Да</span>
                                  </div>
                                )}
                                {p.minLevel && (
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">
                                      Мин. уровень:
                                    </span>
                                    <span className="ml-2 font-medium">{p.minLevel}</span>
                                  </div>
                                )}
                                {p.startsAt && (
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">Начало:</span>
                                    <span className="ml-2 font-medium">
                                      {new Date(p.startsAt).toLocaleDateString("ru")}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[var(--muted-foreground)]">Создан:</span>
                                  <span className="ml-2 font-medium">
                                    {new Date(p.createdAt).toLocaleDateString("ru")}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="admin-btn admin-btn-secondary disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="admin-btn admin-btn-secondary disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}
      </AdminCard>

      {/* Модалка создания/редактирования */}
      <AdminModal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingPromoCode ? "Редактировать промокод" : "Создать промокод"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="admin-btn admin-btn-secondary">
              Отмена
            </button>
            <button
              type="submit"
              form="promo-code-form"
              disabled={isCreating || isUpdating}
              className="admin-btn admin-btn-primary disabled:opacity-50"
            >
              {isCreating || isUpdating
                ? "Сохранение..."
                : editingPromoCode
                  ? "Сохранить"
                  : "Создать"}
            </button>
          </div>
        }
      >
        <form id="promo-code-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Код */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Код промокода
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="WELCOME2024"
                required
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
                title="Сгенерировать"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Описание (необязательно)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Промокод для новых пользователей"
            />
          </div>

          {/* Награды */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Награды
            </label>
            <div className="space-y-3">
              {form.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-[var(--secondary)]/50"
                >
                  <select
                    value={reward.type}
                    onChange={e =>
                      updateReward(index, "type", e.target.value as PromoCodeRewardType)
                    }
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {REWARD_TYPE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {reward.type === "balance" && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <input
                        type="number"
                        min={1}
                        value={reward.amount}
                        onChange={e =>
                          updateReward(index, "amount", parseInt(e.target.value, 10) || 0)
                        }
                        className="w-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="100"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">монет</span>
                    </div>
                  )}

                  {reward.type === "premium" && (
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-500" />
                      <input
                        type="number"
                        min={1}
                        value={reward.amount}
                        onChange={e =>
                          updateReward(index, "amount", parseInt(e.target.value, 10) || 0)
                        }
                        className="w-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="30"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">дней</span>
                    </div>
                  )}

                  {reward.type === "decoration" && (
                    <div className="flex items-center gap-2 flex-1">
                      <Palette className="w-4 h-4 text-pink-500" />
                      <select
                        value={reward.decorationId}
                        onChange={e => updateReward(index, "decorationId", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Выберите декорацию</option>
                        {decorations.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.rewards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReward(index)}
                      className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addReward}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить награду
              </button>
            </div>
          </div>

          {/* Ограничения */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                <Hash className="w-4 h-4 inline mr-1" />
                Макс. использований
              </label>
              <input
                type="number"
                min={0}
                value={form.maxUses}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    maxUses: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Без лимита"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Макс. на пользователя
              </label>
              <input
                type="number"
                min={1}
                value={form.maxUsesPerUser}
                onChange={e =>
                  setForm(f => ({ ...f, maxUsesPerUser: parseInt(e.target.value, 10) || 1 }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Начало действия
              </label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Окончание действия
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Дополнительные условия */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Статус
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as PromoCodeStatus }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Мин. уровень (необязательно)
              </label>
              <input
                type="number"
                min={0}
                value={form.minLevel}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    minLevel: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newUsersOnly"
              checked={form.newUsersOnly}
              onChange={e => setForm(f => ({ ...f, newUsersOnly: e.target.checked }))}
              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <label htmlFor="newUsersOnly" className="text-sm font-medium text-[var(--foreground)]">
              Только для новых пользователей
            </label>
          </div>
        </form>
      </AdminModal>

      {/* Модалка истории использования */}
      <AdminModal
        isOpen={!!viewingUsage}
        onClose={() => setViewingUsage(null)}
        title={`История использования: ${viewingUsage?.code ?? ""}`}
        size="lg"
      >
        {isLoadingUsage ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : !usageData?.data.length ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Промокод ещё не использовался
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2 font-medium text-[var(--muted-foreground)]">
                    Пользователь
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-[var(--muted-foreground)]">
                    Награды
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-[var(--muted-foreground)]">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageData.data.map(u => (
                  <tr key={u.id} className="border-b border-[var(--border)]">
                    <td className="py-2 px-2 font-medium text-[var(--foreground)]">
                      {u.username ?? u.userId}
                    </td>
                    <td className="py-2 px-2 text-xs">{formatRewards(u.rewardsGranted)}</td>
                    <td className="py-2 px-2 text-right text-xs text-[var(--muted-foreground)]">
                      {new Date(u.usedAt).toLocaleString("ru")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить промокод?"
        message={
          deleteTarget
            ? `Промокод «${deleteTarget.code}» будет удалён. Это действие нельзя отменить.`
            : ""
        }
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
