"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Pin,
  Megaphone,
  Image as ImageIcon,
} from "lucide-react";
import {
  useGetAdminAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useUploadAnnouncementImageMutation,
} from "@/store/api/announcementsApi";
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementLayout,
} from "@/types/announcement";
import { AdminCard, AdminModal, ConfirmModal, AlertModal } from "@/shared/admin/ui";
import LoadingSkeleton from "@/shared/skeleton/skeleton";
import { ErrorState as SharedErrorState } from "@/shared/error-state";
import Pagination from "@/shared/browse/pagination";
import { getAnnouncementImageUrl } from "@/api/config";

const LAYOUTS: { value: AnnouncementLayout; label: string }[] = [
  { value: "default", label: "Обычный" },
  { value: "wide", label: "Широкий" },
  { value: "compact", label: "Компактный" },
  { value: "minimal", label: "Минимальный" },
];

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04ff-]/g, "");
}

/** id объявления (бэкенд может отдавать _id) */
function getAnnouncementId(a: Announcement | null): string {
  if (!a) return "";
  return (a as Announcement & { _id?: string }).id ?? (a as Announcement & { _id?: string })._id ?? "";
}

const emptyForm: CreateAnnouncementDto = {
  title: "",
  slug: "",
  shortDescription: "",
  body: "",
  coverImage: "",
  layout: "default",
  isPublished: false,
  isPinned: false,
  tags: [],
};

export function AnnouncementsSection() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [includeDraft, setIncludeDraft] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState<{ title: string; message: string }>({
    title: "",
    message: "",
  });
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [form, setForm] = useState<CreateAnnouncementDto>(emptyForm);
  const [slugManual, setSlugManual] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useGetAdminAnnouncementsQuery({
    page,
    limit,
    includeDraft,
  });

  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadAnnouncementImageMutation();

  const announcements = response?.data?.announcements ?? [];
  const totalPages = response?.data?.totalPages ?? 1;
  const total = response?.data?.total ?? 0;

  useEffect(() => {
    if (selected && isEditOpen) {
      setForm({
        title: selected.title,
        slug: selected.slug,
        shortDescription: selected.shortDescription ?? "",
        body: selected.body ?? "",
        coverImage: selected.coverImage ?? "",
        layout: selected.layout ?? "default",
        isPublished: selected.isPublished,
        isPinned: selected.isPinned ?? false,
        tags: selected.tags ?? [],
      });
      setSlugManual(true);
    }
  }, [selected, isEditOpen]);

  const openCreate = () => {
    setForm(emptyForm);
    setSlugManual(false);
    setIsCreateOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setSelected(a);
    setIsEditOpen(true);
  };

  const openDelete = (a: Announcement) => {
    setSelected(a);
    setIsDeleteOpen(true);
  };

  const showAlert = (title: string, message: string) => {
    setAlertContent({ title, message });
    setAlertOpen(true);
  };

  const handleCreate = async () => {
    try {
      const payload: CreateAnnouncementDto = {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : (form.tags as string || "").split(",").map(t => t.trim()).filter(Boolean),
      };
      await createAnnouncement(payload).unwrap();
      showAlert("Успешно", "Объявление создано");
      setIsCreateOpen(false);
      refetch();
    } catch {
      showAlert("Ошибка", "Не удалось создать объявление");
    }
  };

  const handleUpdate = async () => {
    const id = getAnnouncementId(selected);
    if (!selected || !id) return;
    try {
      const payload: UpdateAnnouncementDto = {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : (form.tags as string || "").split(",").map(t => t.trim()).filter(Boolean),
      };
      await updateAnnouncement({ id, data: payload }).unwrap();
      showAlert("Успешно", "Объявление обновлено");
      setIsEditOpen(false);
      setSelected(null);
      refetch();
    } catch {
      showAlert("Ошибка", "Не удалось обновить объявление");
    }
  };

  const handleDelete = async () => {
    const id = getAnnouncementId(selected);
    if (!selected || !id) return;
    try {
      await deleteAnnouncement(id).unwrap();
      showAlert("Успешно", "Объявление удалено");
      setIsDeleteOpen(false);
      setSelected(null);
      refetch();
    } catch {
      showAlert("Ошибка", "Не удалось удалить объявление");
    }
  };

  const onTitleChange = (title: string) => {
    setForm(f => ({ ...f, title }));
    if (!slugManual) setForm(f => ({ ...f, slug: slugFromTitle(title) }));
  };

  const handleFileUpload = async (file: File, forCover: boolean) => {
    try {
      const res = await uploadImage({
        file,
        announcementId: getAnnouncementId(selected) || undefined,
      }).unwrap();
      const url = res?.data?.url ?? res?.url;
      if (url) {
        if (forCover) setForm(f => ({ ...f, coverImage: url }));
        showAlert("Успешно", `Изображение загружено. URL: ${url}`);
      }
    } catch {
      showAlert("Ошибка", "Не удалось загрузить изображение");
    }
  };

  const filteredList = search.trim()
    ? announcements.filter(
        a =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.slug && a.slug.toLowerCase().includes(search.toLowerCase())),
      )
    : announcements;

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Заголовок</label>
        <input
          type="text"
          value={form.title}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
          placeholder="Заголовок"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Slug (ЧПУ)</label>
        <input
          type="text"
          value={form.slug}
          onChange={e => {
            setSlugManual(true);
            setForm(f => ({ ...f, slug: e.target.value }));
          }}
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
          placeholder="url-slug"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Краткое описание (до 500 символов)</label>
        <textarea
          value={form.shortDescription ?? ""}
          onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
          rows={2}
          maxLength={500}
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
          placeholder="Краткое описание"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Контент (HTML)</label>
        <textarea
          value={form.body ?? ""}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          rows={6}
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] font-mono"
          placeholder="<p>HTML-контент</p>"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Обложка (URL)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.coverImage ?? ""}
            onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
            className="flex-1 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="https://..."
          />
          <label className="admin-btn admin-btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Загрузить
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, true);
                e.target.value = "";
              }}
              disabled={isUploading}
            />
          </label>
        </div>
        {form.coverImage && (
          <div className="mt-2 relative w-24 h-24 rounded overflow-hidden border border-[var(--border)]">
            <img
              src={getAnnouncementImageUrl(form.coverImage ?? "")}
              alt="Обложка"
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Раскладка</label>
        <select
          value={form.layout ?? "default"}
          onChange={e => setForm(f => ({ ...f, layout: e.target.value as AnnouncementLayout }))}
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
        >
          {LAYOUTS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Теги (через запятую)</label>
        <input
          type="text"
          value={Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags as string) ?? ""}
          onChange={e =>
            setForm(f => ({
              ...f,
              tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean),
            }))
          }
          className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
          placeholder="новости, обновления"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm text-[var(--foreground)]">Опубликовано</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPinned ?? false}
            onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm text-[var(--foreground)]">Закрепить</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminCard
        title="Объявления и новости"
        icon={<Megaphone className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={includeDraft}
                onChange={e => setIncludeDraft(e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              Черновики
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="pl-8 pr-3 py-1.5 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] w-40"
              />
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="admin-btn admin-btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div>
              <SharedErrorState
                title="Ошибка загрузки списка"
                message="Не удалось загрузить объявления. Вы можете создать новое объявление или повторить загрузку."
              />
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="admin-btn admin-btn-secondary"
                >
                  Повторить загрузку
                </button>
              </div>
            </div>
          ) : filteredList.length === 0 ? (
            <p className="text-[var(--muted-foreground)] py-8 text-center">
              Нет объявлений. Нажмите «Создать», чтобы добавить первое.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--border)]">
                {filteredList.map((a, idx) => (
                  <li
                    key={getAnnouncementId(a) || `ann-${idx}`}
                    className="flex items-center gap-4 py-3 first:pt-0"
                  >
                    <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                      {a.coverImage ? (
                        <img
                          src={getAnnouncementImageUrl(a.coverImage)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--foreground)] truncate">{a.title}</span>
                        {a.isPinned && <Pin className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />}
                        {!a.isPublished && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            Черновик
                          </span>
                        )}
                      </div>
                      {a.shortDescription && (
                        <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                          {a.shortDescription}
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        /{a.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="p-2 rounded-[var(--admin-radius)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(a)}
                        className="p-2 rounded-[var(--admin-radius)] text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </AdminCard>

      <AdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Новое объявление"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !form.title.trim() || !form.slug.trim()}
              className="admin-btn admin-btn-primary"
            >
              {isCreating ? "Создание..." : "Создать"}
            </button>
          </div>
        }
      >
        {formFields}
      </AdminModal>

      <AdminModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        title="Редактировать объявление"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditOpen(false);
                setSelected(null);
              }}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating || !getAnnouncementId(selected)}
              className="admin-btn admin-btn-primary"
            >
              {isUpdating ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        }
      >
        {formFields}
      </AdminModal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        title="Удалить объявление?"
        message={
          selected
            ? `Будет удалено объявление «${selected.title}» и все связанные изображения.`
            : ""
        }
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertContent.title}
        message={alertContent.message}
      />
    </div>
  );
}
