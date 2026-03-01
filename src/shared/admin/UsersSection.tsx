import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, List, Grid3X3, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, Ban, Shield, CheckSquare, Square, X, RefreshCw } from "lucide-react";
import { useGetUsersQuery, useDeleteUserMutation, useBanUserMutation, useUpdateUserRoleMutation } from "@/store/api/usersApi";
import { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import { Pagination } from "@/shared/ui/pagination";
import { UserCard } from "./UserCard";
import Image from "next/image";
import { getCoverUrls } from "@/lib/asset-url";
import { ConfirmModal } from "./ui";

type ViewMode = "list" | "cards";
type UsersSortField = "createdAt" | "username" | "role" | "level";
type SortDirection = "asc" | "desc";
type RoleFilter = "all" | "admin" | "moderator" | "user";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Все роли" },
  { value: "admin", label: "Админы" },
  { value: "moderator", label: "Модераторы" },
  { value: "user", label: "Пользователи" },
];

export function UsersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "cards";
    const saved = localStorage.getItem("admin:users:viewMode") as ViewMode;
    if (saved) return saved;
    return window.innerWidth < 768 ? "cards" : "list";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState<UsersSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"ban" | "role" | null>(null);
  const [bulkRoleTarget, setBulkRoleTarget] = useState<"user" | "moderator">("user");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const { data: usersData, isLoading, refetch } = useGetUsersQuery({
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("admin:users:viewMode", viewMode);
  }, [viewMode]);

  const [deleteUser] = useDeleteUserMutation();
  const [banUser] = useBanUserMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const toast = useToast();

  // Извлекаем пользователей и данные пагинации
  const users = useMemo(() => usersData?.data?.users || [], [usersData]);
  const pagination = usersData?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 };
  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortField) {
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "username":
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case "role":
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case "level":
          aValue = a.level || 1;
          bValue = b.level || 1;
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "ru")
          : bValue.localeCompare(aValue, "ru");
      }

      return sortDirection === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
    return list;
  }, [users, sortField, sortDirection]);
  const roleStats = useMemo(
    () => ({
      admins: users.filter(user => user.role === "admin").length,
      moderators: users.filter(user => user.role === "moderator").length,
      regular: users.filter(user => user.role === "user").length,
    }),
    [users],
  );

  const handleDelete = async (id: string, username: string) => {
    if (
      confirm(
        `Вы уверены, что хотите удалить пользователя "${username}"? Это действие нельзя отменить.`,
      )
    ) {
      try {
        await deleteUser(id).unwrap();
        toast.success("Пользователь успешно удален");
      } catch (error) {
        console.error("Ошибка при удалении пользователя:", error);
        toast.error("Ошибка при удалении пользователя");
      }
    }
  };

  const handleViewUser = (userId: string) => {
    window.open(`/admin/users/${userId}`, "_blank");
  };

  const normalizeUrl = (url: string) => {
    return getCoverUrls(url, "").primary;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => setSearchTerm(value);
  const toggleSort = (field: UsersSortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  };

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === sortedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedUsers.map((u: UserProfile) => u._id));
    }
  }, [selectedIds.length, sortedUsers]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Username", "Email", "Role", "Level", "Created At"];
    const rows = sortedUsers.map((user: UserProfile) => [
      user._id,
      user.username,
      user.email,
      user.role,
      user.level || 1,
      formatDate(user.createdAt),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Экспорт завершён");
  }, [sortedUsers, toast]);

  const handleBulkBan = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => banUser({ userId: id, reason: "Массовая блокировка" }).unwrap())
      );
      const failed = results.filter(r => r.status === "rejected").length;
      const success = results.length - failed;
      if (failed === 0) {
        toast.success(`${success} пользователей заблокировано`);
      } else {
        toast.error(`Заблокировано: ${success}, ошибок: ${failed}`);
      }
      setSelectedIds([]);
      setBulkAction(null);
      refetch();
    } catch {
      toast.error("Ошибка при массовой блокировке");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => updateUserRole({ userId: id, role: bulkRoleTarget }).unwrap())
      );
      const failed = results.filter(r => r.status === "rejected").length;
      const success = results.length - failed;
      if (failed === 0) {
        toast.success(`Роль изменена для ${success} пользователей`);
      } else {
        toast.error(`Изменено: ${success}, ошибок: ${failed}`);
      }
      setSelectedIds([]);
      setBulkAction(null);
      refetch();
    } catch {
      toast.error("Ошибка при смене ролей");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2 sm:gap-3">
        <SummaryCard label="Всего" value={pagination.total} />
        <SummaryCard label="На странице" value={users.length} />
        <SummaryCard label="Админы/модеры" value={`${roleStats.admins}/${roleStats.moderators}`} />
        <SummaryCard label="Обычные" value={roleStats.regular} />
      </div>

      {/* Header with search and view toggle */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="admin-input w-full pl-10 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
              title="Фильтры"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              title="Экспорт CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              title="Обновить"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {searchTerm !== debouncedSearchTerm && (
          <p className="text-xs text-[var(--muted-foreground)]">Поиск...</p>
        )}

        {/* Filters panel */}
        {showFilters && (
          <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Роль:</span>
              {ROLE_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setRoleFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                    roleFilter === filter.value
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="admin-input h-9 text-xs sm:text-sm px-2 sm:px-3"
            title="Количество"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
          </select>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-1.5 sm:px-2 py-1 flex-1 min-w-0 max-w-[180px] sm:max-w-none sm:flex-none">
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted-foreground)] flex-shrink-0" />
            <select
              value={sortField}
              onChange={e => toggleSort(e.target.value as UsersSortField)}
              className="bg-transparent text-xs sm:text-sm text-[var(--foreground)] outline-none flex-1 min-w-0 truncate"
            >
              <option value="createdAt">По дате</option>
              <option value="username">По имени</option>
              <option value="role">По роли</option>
              <option value="level">По уровню</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
              title="Переключить направление"
            >
              {sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-0.5 sm:p-1 ml-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 sm:p-2 rounded-md transition-colors hidden sm:block ${
                viewMode === "list"
                  ? "bg-[var(--background)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Таблица"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-[var(--background)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Карточки"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
            <span className="text-sm font-medium text-[var(--primary)]">
              Выбрано: {selectedIds.length}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {selectedIds.length === sortedUsers.length ? "Снять все" : "Выбрать все"}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setBulkAction("ban")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Заблокировать</span>
            </button>
            <button
              onClick={() => setBulkAction("role")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Сменить роль</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Users display */}
      <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка пользователей...</p>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-4 sm:p-8 text-center">
            <p className="text-[var(--muted-foreground)]">Пользователи не найдены</p>
          </div>
        ) : viewMode === "list" ? (
          /* List view (table) */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="w-12 p-2 sm:p-4">
                    <input
                      type="checkbox"
                      checked={sortedUsers.length > 0 && selectedIds.length === sortedUsers.length}
                      onChange={handleSelectAll}
                      className="rounded border-[var(--border)] w-4 h-4"
                    />
                  </th>
                  <th className="text-left p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Пользователь
                  </th>
                  <th className="text-left p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Email
                  </th>
                  <th className="text-left p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Роль
                  </th>
                  <th className="text-left p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Уровень
                  </th>
                  <th className="text-left p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Дата регистрации
                  </th>
                  <th className="text-right p-2 sm:p-4 font-medium text-[var(--foreground)]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user: UserProfile) => (
                  <tr
                    key={user._id}
                    className={`border-t border-[var(--border)] hover:bg-[var(--accent)]/30 ${
                      selectedIds.includes(user._id) ? "bg-[var(--primary)]/5" : ""
                    }`}
                  >
                    <td className="p-2 sm:p-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="rounded border-[var(--border)] w-4 h-4"
                      />
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <Image
                              src={normalizeUrl(user.avatar || "")}
                              alt={user.username}
                              width={40}
                              height={40}
                              unoptimized
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">
                            {user.username}
                          </p>
                          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                            ID: {user._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--foreground)] text-sm sm:text-base">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "moderator"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Админ"
                          : user.role === "moderator"
                            ? "Модератор"
                            : "Пользователь"}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-[var(--foreground)] text-sm sm:text-base">
                      {user.level || 1}
                    </td>
                    <td className="p-2 sm:p-4">
                      <span className="text-[var(--foreground)] text-sm sm:text-base">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewUser(user._id)}
                          className="p-1 sm:p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                          title="Просмотреть профиль"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="p-1 sm:p-2 text-red-500 hover:text-red-700 transition-colors"
                          title="Удалить пользователя"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards view */
          <div className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sortedUsers.map((user: UserProfile) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onView={handleViewUser}
                  onDelete={handleDelete}
                  normalizeUrl={normalizeUrl}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted-foreground)]">
            Показано {sortedUsers.length} из {pagination.total} пользователей
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Bulk Ban Modal */}
      <ConfirmModal
        isOpen={bulkAction === "ban"}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkBan}
        title="Массовая блокировка"
        message={`Вы уверены, что хотите заблокировать ${selectedIds.length} пользователей? Они потеряют доступ к аккаунту.`}
        confirmText="Заблокировать"
        confirmVariant="danger"
        isLoading={isBulkLoading}
      />

      {/* Bulk Role Change Modal */}
      <ConfirmModal
        isOpen={bulkAction === "role"}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkRoleChange}
        title="Массовая смена роли"
        message={
          <div className="space-y-3">
            <p>Выберите новую роль для {selectedIds.length} пользователей:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkRoleTarget("user")}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  bulkRoleTarget === "user"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
                }`}
              >
                Пользователь
              </button>
              <button
                onClick={() => setBulkRoleTarget("moderator")}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  bulkRoleTarget === "moderator"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
                }`}
              >
                Модератор
              </button>
            </div>
          </div>
        }
        confirmText="Применить"
        isLoading={isBulkLoading}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 sm:px-3 py-2 sm:py-2.5">
      <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

