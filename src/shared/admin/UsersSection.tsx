import React, { useState } from "react";
import { Search, Trash2, Eye, User, Mail, Calendar } from "lucide-react";
import { useGetUsersQuery, useDeleteUserMutation } from "@/store/api/usersApi";
import { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function UsersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { data: usersData, isLoading } = useGetUsersQuery({
    search: searchTerm,
    page: 1,
    limit: 50,
  });
  const [deleteUser] = useDeleteUserMutation();
  const toast = useToast();

  // Извлекаем пользователей из данных
  const users = usersData?.data?.users || [];

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

  const normalizeUrl = (url: string) => {
    return process.env.NEXT_PUBLIC_URL + url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>


      {/* Users list */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--muted-foreground)]">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm">
                    Пользователь
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden lg:table-cell">
                    Роль
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden sm:table-cell">
                    Уровень
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden xl:table-cell">
                    Дата
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-[var(--foreground)] text-sm">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: UserProfile) => (
                  <tr
                    key={user._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--secondary)] rounded-full flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <Image
                              loader={({ src, width }) => `${src}?w=${width}`}
                              src={normalizeUrl(user.avatar || "")}
                              alt={user.username}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--foreground)] text-sm truncate max-w-[120px] sm:max-w-[150px]">
                            {user.username}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] hidden xs:table-cell">
                            ID: {user._id.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-[var(--foreground)] text-sm truncate max-w-[150px] block">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : user.role === "moderator"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Админ"
                          : user.role === "moderator"
                            ? "Модер"
                            : "Юзер"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-[var(--foreground)] text-sm font-medium">
                        {user.level || 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      <span className="text-[var(--foreground)] text-sm">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`/admin/users/${user._id}`, "_blank")}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                          title="Просмотреть"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
