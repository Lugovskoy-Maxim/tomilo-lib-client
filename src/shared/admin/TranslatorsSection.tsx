"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Users2,
  BookOpen,
  ExternalLink,
  X,
  Search,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { normalizeAssetUrl } from "@/lib/asset-url";
import {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useUploadTeamAvatarMutation,
  useAddTitleToTeamMutation,
  useRemoveTitleFromTeamMutation,
} from "@/store/api/translatorsApi";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import type { TranslatorTeam, TranslatorRole } from "@/types/translator";
import { translatorRoleLabels } from "@/types/translator";
import { ConfirmModal } from "./ui";
import { useToast } from "@/hooks/useToast";

const ROLES: TranslatorRole[] = [
  "leader",
  "translator",
  "editor",
  "proofreader",
  "cleaner",
  "typesetter",
];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  banner: "",
  members: [] as { name: string; role: TranslatorRole }[],
};

export function TranslatorsSection() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TranslatorTeam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TranslatorTeam | null>(null);
  const [addTitleTeamId, setAddTitleTeamId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- поиск по тайтлам для добавления в команду
  const [titleSearch, setTitleSearch] = useState("");

  const {
    data: teamsData,
    isLoading,
    refetch,
  } = useGetTeamsQuery({
    page,
    limit: 20,
    search: search.trim() || undefined,
  });
  const teams = teamsData?.teams ?? [];
  const pagination = {
    total: teamsData?.total ?? 0,
    page: teamsData?.page ?? 1,
    limit: teamsData?.limit ?? 20,
    pages: Math.ceil((teamsData?.total ?? 0) / (teamsData?.limit ?? 20)) || 1,
  };

  const { data: editingTeamData, refetch: refetchEditingTeam } = useGetTeamByIdQuery(
    editingTeam?._id ?? "",
    { skip: !editingTeam?._id },
  );
  const currentTeam = editingTeamData ?? editingTeam;

  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const [uploadTeamAvatar, { isLoading: isUploadingAvatar }] = useUploadTeamAvatarMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [addTitleToTeam] = useAddTitleToTeamMutation();
  const [removeTitleFromTeam] = useRemoveTitleFromTeamMutation();

  useEffect(() => {
    if (editingTeam) {
      setForm({
        name: editingTeam.name,
        slug: editingTeam.slug ?? "",
        description: editingTeam.description ?? "",
        banner: editingTeam.banner ?? "",
        members: (editingTeam.members ?? []).map(m => ({
          name: m.name,
          role: (m.role as TranslatorRole) || "translator",
        })),
      });
    } else if (!isFormOpen) {
      setForm(emptyForm);
    }
  }, [editingTeam, isFormOpen]);

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team: TranslatorTeam) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Введите название команды");
      return;
    }
    try {
      if (editingTeam) {
        await updateTeam({
          id: editingTeam._id,
          data: {
            name: form.name.trim(),
            slug: form.slug.trim() || undefined,
            description: form.description.trim() || undefined,
            banner: form.banner.trim() || undefined,
            members: form.members.map(m => ({
              name: m.name.trim(),
              role: m.role,
            })),
          },
        }).unwrap();
        toast.success("Команда обновлена");
      } else {
        await createTeam({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          banner: form.banner.trim() || undefined,
          members: form.members.map(m => ({
            name: m.name.trim(),
            role: m.role,
          })),
          titleIds: [],
        }).unwrap();
        toast.success("Команда создана");
      }
      handleCloseForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleAddMember = () => {
    setForm(prev => ({
      ...prev,
      members: [...prev.members, { name: "", role: "translator" }],
    }));
  };

  const handleRemoveMember = (index: number) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleMemberChange = (index: number, field: "name" | "role", value: string) => {
    setForm(prev => {
      const next = [...prev.members];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, members: next };
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeam(deleteTarget._id).unwrap();
      toast.success("Команда удалена");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const handleRemoveTitle = async (teamId: string, titleId: string) => {
    try {
      await removeTitleFromTeam({ teamId, titleId }).unwrap();
      toast.success("Тайтл отвязан от команды");
      refetch();
      refetchEditingTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Команды переводчиков</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="admin-input pl-9 w-48"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="admin-btn admin-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать команду
          </button>
        </div>
      </div>

      <div className="rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">Загрузка...</div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            {search ? "Команды не найдены" : "Нет команд. Создайте первую."}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {teams.map(team => (
              <li
                key={team._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-[var(--accent)]/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                    <Users2 className="w-5 h-5 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{team.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-3">
                      <span>{team.slug || team._id}</span>
                      <span>{team.members?.length ?? 0} участников</span>
                      <span>{team.titleIds?.length ?? 0} тайтлов</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {team.slug && (
                    <Link
                      href={`/translators/${team.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary p-2 inline-flex items-center justify-center"
                      title="Открыть страницу"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(team)}
                    className="admin-btn admin-btn-secondary p-2 inline-flex items-center justify-center"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTitleTeamId(team._id)}
                    className="admin-btn admin-btn-secondary text-xs inline-flex items-center gap-1"
                    title="Привязать тайтл"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Тайтлы
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(team)}
                    className="p-2 inline-flex items-center justify-center text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-3 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="admin-btn admin-btn-secondary disabled:opacity-50"
            >
              Назад
            </button>
            <span className="flex items-center px-3 text-sm text-[var(--muted-foreground)]">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage(p => p + 1)}
              className="admin-btn admin-btn-secondary disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingTeam ? "Редактировать команду" : "Новая команда"}
              </h3>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-2 rounded-lg hover:bg-[var(--accent)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="admin-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (для URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  className="admin-input w-full"
                  placeholder="автоматически из названия"
                />
              </div>
              {editingTeam && (
                <div>
                  <label className="block text-sm font-medium mb-1">Аватар</label>
                  <div className="flex items-center gap-4">
                    {currentTeam?.avatar ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[var(--secondary)] border border-[var(--border)]">
                        <Image
                          src={normalizeAssetUrl(currentTeam.avatar)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-[var(--muted-foreground)]" />
                      </div>
                    )}
                    <label className="admin-btn admin-btn-secondary cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {isUploadingAvatar ? "Загрузка…" : "Загрузить файл"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file || !editingTeam._id) return;
                          try {
                            await uploadTeamAvatar({
                              teamId: editingTeam._id,
                              avatar: file,
                            }).unwrap();
                            toast.success("Аватар загружен");
                            refetch();
                            refetchEditingTeam();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    JPG, PNG или WebP, до 2 МБ
                  </p>
                </div>
              )}
              {!editingTeam && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Аватар можно загрузить после создания команды.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Баннер (URL)</label>
                <input
                  type="url"
                  value={form.banner}
                  onChange={e => setForm(p => ({ ...p, banner: e.target.value }))}
                  className="admin-input w-full"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="admin-input w-full resize-y min-h-[80px]"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Участники</label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    + Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {form.members.map((m, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center p-2 rounded-lg bg-[var(--secondary)]/50"
                    >
                      <input
                        type="text"
                        value={m.name}
                        onChange={e => handleMemberChange(i, "name", e.target.value)}
                        placeholder="Имя"
                        className="admin-input flex-1 min-w-0"
                      />
                      <select
                        value={m.role}
                        onChange={e => handleMemberChange(i, "role", e.target.value)}
                        className="admin-input w-36"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>
                            {translatorRoleLabels[r]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(i)}
                        className="p-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {currentTeam && (currentTeam.titleIds?.length ?? 0) > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Привязанные тайтлы (при выборе команды в главе эти тайтлы показываются вверху)
                  </label>
                  <ul className="space-y-1">
                    {currentTeam.titleIds!.map((titleId: string) => (
                      <li key={titleId} className="flex items-center justify-between text-sm py-1">
                        <Link
                          href={`/admin/titles/edit/${titleId}`}
                          className="text-[var(--primary)] hover:underline truncate"
                        >
                          {titleId}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveTitle(currentTeam._id, titleId)}
                          className="p-1 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="admin-btn admin-btn-primary flex-1"
                >
                  {editingTeam ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add title to team modal */}
      {addTitleTeamId && (
        <AddTitleModal
          teamId={addTitleTeamId}
          onClose={() => setAddTitleTeamId(null)}
          onAdded={() => {
            refetch();
            setAddTitleTeamId(null);
          }}
          addTitleToTeam={addTitleToTeam}
          toast={toast}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Удалить команду?"
        message={
          deleteTarget
            ? `Команда «${deleteTarget.name}» будет удалена. Это действие нельзя отменить.`
            : ""
        }
      />
    </div>
  );
}

function AddTitleModal({
  teamId,
  onClose,
  onAdded,
  addTitleToTeam,
  toast,
}: {
  teamId: string;
  onClose: () => void;
  onAdded: () => void;
  addTitleToTeam: (arg: { teamId: string; titleId: string }) => { unwrap: () => Promise<unknown> };
  toast: { success: (s: string) => void; error: (s: string) => void };
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: searchData } = useSearchTitlesQuery(
    { search: debounced, limit: 15 },
    { skip: debounced.length < 2 },
  );
  const titles = searchData?.data?.data ?? [];

  const handleAdd = async (titleId: string) => {
    try {
      await addTitleToTeam({ teamId, titleId }).unwrap();
      toast.success("Тайтл привязан к команде");
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-lg font-semibold">Добавить тайтл к команде</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--accent)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-[var(--border)]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию тайтла..."
            className="admin-input w-full"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {debounced.length < 2 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              Введите минимум 2 символа для поиска
            </p>
          ) : titles.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              Ничего не найдено
            </p>
          ) : (
            <ul className="space-y-1">
              {titles.map((title: { _id?: string; id?: string; title?: string; name?: string }) => {
                const id = title._id ?? title.id;
                const name = title.title ?? title.name ?? id;
                if (!id) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]"
                  >
                    <span className="text-sm truncate flex-1">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleAdd(id)}
                      className="admin-btn admin-btn-primary text-xs py-1 px-2"
                    >
                      Добавить
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
