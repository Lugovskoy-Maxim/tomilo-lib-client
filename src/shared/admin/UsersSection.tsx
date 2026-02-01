import React, { useState } from "react";
import { Search, List, Grid3X3, Trash2, Eye } from "lucide-react";
import { useGetUsersQuery, useDeleteUserMutation } from "@/store/api/usersApi";
import { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/ui/pagination";
import { UserCard } from "./UserCard";

type ViewMode = "list" | "cards";

export function UsersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20); // Show 20 users per page for better UX
  const router = useRouter();

  const { data: usersData, isLoading } = useGetUsersQuery({
    search: searchTerm,
    page: currentPage,
    limit,
  });
  const [deleteUser] = useDeleteUserMutation();
  const toast = useToast();

  // Извлекаем пользователей и данные пагинации
  const users = usersData?.data?.users || [];
  const pagination = usersData?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 };

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
    return process.env.NEXT_PUBLIC_URL + url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with search and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-lg p-1">
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

      {/* Users display */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 ? (
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
                {users.map((user: UserProfile) => (
                  <tr
                    key={user._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={normalizeUrl(user.avatar || "")}
                              alt={user.username}
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
                            ID: {user._id.slice(-8)}
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
              {users.map((user: UserProfile) => (
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
            Показано {users.length} из {pagination.total} пользователей
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

