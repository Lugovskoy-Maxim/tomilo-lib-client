import React, { useEffect, useMemo, useState } from "react";
import { Search, List, Grid3X3, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useGetUsersQuery, useDeleteUserMutation } from "@/store/api/usersApi";
import { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import { Pagination } from "@/shared/ui/pagination";
import { UserCard } from "./UserCard";
import Image from "next/image";
import { getCoverUrls } from "@/lib/asset-url";

type ViewMode = "list" | "cards";
type UsersSortField = "createdAt" | "username" | "role" | "level";
type SortDirection = "asc" | "desc";

export function UsersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("admin:users:viewMode") as ViewMode) || "list";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState<UsersSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: usersData, isLoading } = useGetUsersQuery({
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Всего пользователей" value={pagination.total} />
        <SummaryCard label="На странице" value={users.length} />
        <SummaryCard label="Админы / модеры" value={`${roleStats.admins} / ${roleStats.moderators}`} />
        <SummaryCard label="Обычные" value={roleStats.regular} />
      </div>

      {/* Header with search and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="admin-input w-full pl-10"
          />
          {searchTerm !== debouncedSearchTerm && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Поиск...</p>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="admin-input h-[38px]"
            title="Количество пользователей на странице"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
            <option value={500}>500</option>
          </select>

          <div className="flex items-center gap-1 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] px-2 py-1">
            <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />
            <select
              value={sortField}
              onChange={e => toggleSort(e.target.value as UsersSortField)}
              className="bg-transparent text-sm text-[var(--foreground)] outline-none"
            >
              <option value="createdAt">По дате регистрации</option>
              <option value="username">По имени</option>
              <option value="role">По роли</option>
              <option value="level">По уровню</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title="Переключить направление сортировки"
            >
              {sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-[var(--admin-radius)] p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-[var(--background)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            title="Список"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`p-2 rounded-md transition-colors ${
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
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
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
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

