"use client";

import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import type { Decoration } from "@/api/shop";
import type { DecorationType } from "@/api/shop";
import {
  useGetDecorationsQuery,
  useCreateDecorationMutation,
  useUpdateDecorationMutation,
  useDeleteDecorationMutation,
} from "@/store/api/shopApi";
import { AdminCard } from "./ui";
import { AdminModal, ConfirmModal } from "./ui";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const DECORATION_TYPES: { value: DecorationType; label: string }[] = [
  { value: "avatar", label: "Аватар" },
  { value: "background", label: "Фон" },
  { value: "card", label: "Карточка" },
];

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  type: "avatar" as DecorationType,
};

export function ShopManagementSection() {
  const [typeFilter, setTypeFilter] = useState<DecorationType | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: decorations = [], isLoading, refetch } = useGetDecorationsQuery();
  const [createDecoration, { isLoading: isCreating }] = useCreateDecorationMutation();
  const [updateDecoration, { isLoading: isUpdating }] = useUpdateDecorationMutation();
  const [deleteDecoration] = useDeleteDecorationMutation();

  const filtered = useMemo(() => {
    if (typeFilter === "all") return decorations;
    return decorations.filter(d => d.type === typeFilter);
  }, [decorations, typeFilter]);

  const openCreate = () => {
    setEditingDecoration(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (d: Decoration) => {
    setEditingDecoration(d);
    setForm({
      name: d.name,
      description: d.description,
      price: d.price,
      imageUrl: d.imageUrl,
      type: d.type,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDecoration(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price < 0) return;

    try {
      if (editingDecoration) {
        await updateDecoration({
          id: editingDecoration.id,
          dto: {
            name: form.name.trim(),
            description: form.description.trim(),
            price: form.price,
            imageUrl: form.imageUrl.trim() || undefined,
            type: form.type,
          },
        }).unwrap();
        closeForm();
        refetch();
      } else {
        await createDecoration({
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price,
          imageUrl: form.imageUrl.trim(),
          type: form.type,
        }).unwrap();
        closeForm();
        refetch();
      }
    } catch {
      // Error handled by mutation / could add toast
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDecoration(deleteTarget.id).unwrap();
      setDeleteTarget(null);
      refetch();
    } catch {
      // Error handled by mutation
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeLabel = (t: DecorationType) =>
    DECORATION_TYPES.find(x => x.value === t)?.label ?? t;

  return (
    <div className="space-y-6">
      <AdminCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Украшения магазина
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Добавляйте и редактируйте аватары, фоны и карточки для магазина
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tomilo-shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть магазин
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Добавить украшение
            </button>
          </div>
        </div>

        {/* Фильтр по типу */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            Все
          </button>
          {DECORATION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {decorations.length === 0
              ? "Нет украшений. Добавьте первое."
              : "Нет украшений выбранного типа."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Изображение
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Название
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Тип
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Цена
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="py-2 px-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                        {d.imageUrl ? (
                          <img
                            src={d.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-medium text-[var(--foreground)]">
                        {d.name}
                      </span>
                      {d.description && (
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                          {d.description}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[var(--muted-foreground)]">
                      {typeLabel(d.type)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {d.price} монет
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Модалка создания/редактирования */}
      <AdminModal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingDecoration ? "Редактировать украшение" : "Добавить украшение"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="shop-decoration-form"
              disabled={isCreating || isUpdating}
              className="admin-btn admin-btn-primary disabled:opacity-50"
            >
              {isCreating || isUpdating
                ? "Сохранение..."
                : editingDecoration
                  ? "Сохранить"
                  : "Добавить"}
            </button>
          </div>
        }
      >
        <form
          id="shop-decoration-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Название
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Название украшения"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[80px]"
              placeholder="Краткое описание"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Цена (монеты)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e =>
                  setForm(f => ({ ...f, price: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={e =>
                  setForm(f => ({ ...f, type: e.target.value as DecorationType }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {DECORATION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              URL изображения
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="https://..."
            />
            {form.imageUrl && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-[var(--muted)]">
                <img
                  src={form.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить украшение?"
        message={
          deleteTarget
            ? `Украшение «${deleteTarget.name}» будет удалено. Это действие нельзя отменить.`
            : ""
        }
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
