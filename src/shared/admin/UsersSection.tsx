import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  List,
  Grid3X3,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Ban,
  Shield,
  X,
  RefreshCw,
  MessageCircle,
  UserCheck,
  UserX,
  Edit,
  Wallet,
  History,
  ChevronRight,
  Save,
  Plus,
  Minus,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useBanUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserBalanceMutation,
  useGetUserBanHistoryQuery,
  useGetUserTransactionsQuery,
  useUpdateUserDataMutation,
  useGetUserByIdQuery,
} from "@/store/api/usersApi";
import {
  useUnbanUserMutation,
  useDeleteUserCommentsMutation,
  useLazyExportUsersQuery,
} from "@/store/api/adminApi";
import { authApi } from "@/store/api/authApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
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
type StatusFilter = "all" | "active" | "banned";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Все роли" },
  { value: "admin", label: "Админы" },
  { value: "moderator", label: "Модераторы" },
  { value: "user", label: "Пользователи" },
];

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "Все", icon: Filter },
  { value: "active", label: "Активные", icon: UserCheck },
  { value: "banned", label: "Заблокированные", icon: UserX },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"ban" | "role" | null>(null);
  const [bulkRoleTarget, setBulkRoleTarget] = useState<"user" | "moderator">("user");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // User detail modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "balance" | "bans">("info");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<{
    username?: string;
    email?: string;
    level?: number;
    bio?: string;
  }>({});
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>();

  const {
    data: usersData,
    isLoading,
    refetch,
  } = useGetUsersQuery({
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
  const [unbanUser] = useUnbanUserMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUserComments] = useDeleteUserCommentsMutation();
  const [updateUserBalance] = useUpdateUserBalanceMutation();
  const [updateUserData] = useUpdateUserDataMutation();
  const [triggerExportUsers] = useLazyExportUsersQuery();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const invalidateAuthCache = useCallback(() => {
    dispatch(authApi.util.invalidateTags(["Auth"]));
  }, [dispatch]);

  // Selected user queries
  const { data: selectedUserData, refetch: refetchSelectedUser } = useGetUserByIdQuery(
    selectedUserId!,
    { skip: !selectedUserId },
  );
  const { data: banHistoryData } = useGetUserBanHistoryQuery(selectedUserId!, {
    skip: !selectedUserId || detailTab !== "bans",
  });
  const { data: transactionsData } = useGetUserTransactionsQuery(
    { userId: selectedUserId!, limit: 20 },
    { skip: !selectedUserId || detailTab !== "balance" },
  );

  const selectedUser = selectedUserData?.data;
  const banHistory = banHistoryData?.data || [];
  const transactions = transactionsData?.data?.transactions || [];

  // Извлекаем пользователей и данные пагинации
  const users = useMemo(() => usersData?.data?.users || [], [usersData]);
  const pagination = usersData?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 };
  const sortedUsers = useMemo(() => {
    let list = [...users];

    // Apply status filter
    if (statusFilter !== "all") {
      list = list.filter((user: UserProfile & { isBanned?: boolean }) => {
        const isBanned = user.isBanned === true;
        return statusFilter === "banned" ? isBanned : !isBanned;
      });
    }

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
  }, [users, sortField, sortDirection, statusFilter]);
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
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId],
    );
  }, []);

  const handleExportCSV = useCallback(async () => {
    try {
      // Пробуем серверный экспорт
      const result = await triggerExportUsers({ format: "csv" }).unwrap();
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const link = document.createElement("a");
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Экспорт завершён (сервер)");
        return;
      }
    } catch {
      // Fallback на локальный экспорт
    }

    // Локальный экспорт
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
  }, [sortedUsers, toast, triggerExportUsers]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- зарезервировано для массового удаления комментариев
  const handleDeleteUserComments = useCallback(
    async (userId: string, username: string) => {
      if (
        !confirm(
          `Удалить все комментарии пользователя "${username}"? Это действие нельзя отменить.`,
        )
      )
        return;

      try {
        const result = await deleteUserComments(userId).unwrap();
        toast.success(`Удалено ${result.data?.deletedCount ?? 0} комментариев`);
      } catch {
        toast.error("Ошибка при удалении комментариев");
      }
    },
    [deleteUserComments, toast],
  );

  const handleUnbanUser = useCallback(
    async (userId: string) => {
      try {
        await unbanUser(userId).unwrap();
        toast.success("Пользователь разблокирован");
        refetch();
        if (selectedUserId === userId) refetchSelectedUser();
      } catch {
        toast.error("Ошибка при разблокировке");
      }
    },
    [unbanUser, toast, refetch, selectedUserId, refetchSelectedUser],
  );

  const openUserDetail = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setDetailTab("info");
    setIsEditMode(false);
    setEditData({});
  }, []);

  const closeUserDetail = useCallback(() => {
    setSelectedUserId(null);
    setIsEditMode(false);
    setEditData({});
    setBanReason("");
    setBanDuration(undefined);
    setBalanceAmount("");
    setBalanceDescription("");
  }, []);

  const handleSaveUserData = useCallback(async () => {
    if (!selectedUserId || Object.keys(editData).length === 0) return;

    try {
      await updateUserData({ userId: selectedUserId, data: editData }).unwrap();
      toast.success("Данные пользователя обновлены");
      setIsEditMode(false);
      setEditData({});
      refetch();
      refetchSelectedUser();
      invalidateAuthCache();
    } catch {
      toast.error("Ошибка при обновлении данных");
    }
  }, [
    selectedUserId,
    editData,
    updateUserData,
    toast,
    refetch,
    refetchSelectedUser,
    invalidateAuthCache,
  ]);

  const handleUpdateBalance = useCallback(
    async (isAdd: boolean) => {
      if (!selectedUserId || !balanceAmount || !balanceDescription) {
        toast.error("Заполните сумму и описание");
        return;
      }

      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Некорректная сумма");
        return;
      }

      try {
        await updateUserBalance({
          userId: selectedUserId,
          amount: isAdd ? amount : -amount,
          description: balanceDescription,
        }).unwrap();
        toast.success(isAdd ? "Баланс пополнен" : "Баланс списан");
        setBalanceAmount("");
        setBalanceDescription("");
        refetchSelectedUser();
        invalidateAuthCache();
      } catch {
        toast.error("Ошибка при обновлении баланса");
      }
    },
    [
      selectedUserId,
      balanceAmount,
      balanceDescription,
      updateUserBalance,
      toast,
      refetchSelectedUser,
      invalidateAuthCache,
    ],
  );

  const handleBanFromModal = useCallback(async () => {
    if (!selectedUserId || !banReason) {
      toast.error("Укажите причину блокировки");
      return;
    }

    try {
      await banUser({ userId: selectedUserId, reason: banReason, duration: banDuration }).unwrap();
      toast.success("Пользователь заблокирован");
      setBanReason("");
      setBanDuration(undefined);
      refetch();
      refetchSelectedUser();
    } catch {
      toast.error("Ошибка при блокировке");
    }
  }, [selectedUserId, banReason, banDuration, banUser, toast, refetch, refetchSelectedUser]);

  const handleRoleChange = useCallback(
    async (userId: string, newRole: "user" | "moderator" | "admin") => {
      try {
        await updateUserRole({ userId, role: newRole }).unwrap();
        toast.success("Роль изменена");
        refetch();
        if (selectedUserId === userId) refetchSelectedUser();
        invalidateAuthCache();
      } catch {
        toast.error("Ошибка при смене роли");
      }
    },
    [updateUserRole, toast, refetch, selectedUserId, refetchSelectedUser, invalidateAuthCache],
  );

  const handleDeleteCommentsFromList = useCallback(
    async (userId: string, username: string) => {
      if (
        !confirm(
          `Удалить все комментарии пользователя "${username}"? Это действие нельзя отменить.`,
        )
      )
        return;

      try {
        const result = await deleteUserComments(userId).unwrap();
        toast.success(`Удалено ${result.data?.deletedCount ?? 0} комментариев`);
      } catch {
        toast.error("Ошибка при удалении комментариев");
      }
    },
    [deleteUserComments, toast],
  );

  const handleBulkBan = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => banUser({ userId: id, reason: "Массовая блокировка" }).unwrap()),
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
        selectedIds.map(id => updateUserRole({ userId: id, role: bulkRoleTarget }).unwrap()),
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Статус:</span>
              {STATUS_FILTERS.map(filter => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                      statusFilter === filter.value
                        ? filter.value === "banned"
                          ? "bg-red-500 text-white"
                          : filter.value === "active"
                            ? "bg-green-500 text-white"
                            : "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {filter.label}
                  </button>
                );
              })}
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
              {sortDirection === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
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
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                          {user.avatar &&
                          !user.avatar.includes("undefined") &&
                          !user.avatar.includes("null") ? (
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
                          {(user as UserProfile & { isBanned?: boolean }).isBanned && (
                            <div
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                              title="Заблокирован"
                            >
                              <Ban className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">
                              {user.username}
                            </p>
                            {(user as UserProfile & { isBanned?: boolean }).isBanned && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-500">
                                БАН
                              </span>
                            )}
                          </div>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openUserDetail(user._id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-lg transition-colors"
                          title="Подробнее"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setDetailTab("info");
                            setIsEditMode(true);
                            setEditData({
                              username: user.username,
                              email: user.email,
                              level: user.level,
                              bio: "",
                            });
                          }}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(user as UserProfile & { isBanned?: boolean }).isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user._id)}
                            className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Разблокировать"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUserId(user._id);
                              setBanReason("");
                              setBanDuration(undefined);
                            }}
                            className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-lg transition-colors"
                            title="Заблокировать"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCommentsFromList(user._id, user.username)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          title="Удалить все комментарии"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить пользователя"
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
        ) : (
          /* Cards view */
          <div className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sortedUsers.map((user: UserProfile) => (
                <UserCard
                  key={user._id}
                  user={user as UserProfile & { isBanned?: boolean }}
                  onView={openUserDetail}
                  onDelete={handleDelete}
                  onEdit={userId => {
                    const u = sortedUsers.find((x: UserProfile) => x._id === userId);
                    if (u) {
                      setSelectedUserId(userId);
                      setDetailTab("info");
                      setIsEditMode(true);
                      setEditData({ username: u.username, email: u.email, level: u.level });
                    }
                  }}
                  onBan={userId => {
                    setSelectedUserId(userId);
                    setBanReason("");
                    setBanDuration(undefined);
                  }}
                  onUnban={handleUnbanUser}
                  onDeleteComments={handleDeleteCommentsFromList}
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

      {/* User Detail Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeUserDetail}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                {selectedUser?.avatar &&
                !selectedUser.avatar.includes("undefined") &&
                !selectedUser.avatar.includes("null") ? (
                  <Image
                    src={normalizeUrl(selectedUser.avatar)}
                    alt={selectedUser.username}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[var(--primary)]">
                      {selectedUser?.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-[var(--foreground)]">
                    {selectedUser?.username || "Загрузка..."}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedUser?.email}</p>
                </div>
              </div>
              <button
                onClick={closeUserDetail}
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
              {[
                { id: "info" as const, label: "Информация", icon: Edit },
                { id: "balance" as const, label: "Баланс", icon: Wallet },
                { id: "bans" as const, label: "История банов", icon: History },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      detailTab === tab.id
                        ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailTab === "info" && selectedUser && (
                <div className="space-y-4">
                  {/* User stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Уровень</p>
                      <p className="text-xl font-bold text-[var(--foreground)]">
                        {selectedUser.level || 1}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Баланс</p>
                      <p className="text-xl font-bold text-[var(--foreground)]">
                        {selectedUser.balance || 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Роль</p>
                      <p
                        className={`text-sm font-semibold ${
                          selectedUser.role === "admin"
                            ? "text-red-500"
                            : selectedUser.role === "moderator"
                              ? "text-blue-500"
                              : "text-[var(--foreground)]"
                        }`}
                      >
                        {selectedUser.role === "admin"
                          ? "Админ"
                          : selectedUser.role === "moderator"
                            ? "Модератор"
                            : "Пользователь"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Регистрация</p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Role change */}
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                      Изменить роль
                    </h3>
                    <div className="flex gap-2">
                      {(["user", "moderator", "admin"] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(selectedUser._id, role)}
                          disabled={selectedUser.role === role}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedUser.role === role
                              ? role === "admin"
                                ? "bg-red-500 text-white"
                                : role === "moderator"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[var(--primary)] text-[var(--primary-foreground)]"
                              : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                          }`}
                        >
                          {role === "admin"
                            ? "Админ"
                            : role === "moderator"
                              ? "Модератор"
                              : "Пользователь"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edit form */}
                  {isEditMode ? (
                    <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
                      <h3 className="text-sm font-medium text-[var(--foreground)]">
                        Редактирование
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)]">
                            Имя пользователя
                          </label>
                          <input
                            type="text"
                            value={editData.username ?? selectedUser.username}
                            onChange={e =>
                              setEditData(prev => ({ ...prev, username: e.target.value }))
                            }
                            className="admin-input w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)]">Email</label>
                          <input
                            type="email"
                            value={editData.email ?? selectedUser.email}
                            onChange={e =>
                              setEditData(prev => ({ ...prev, email: e.target.value }))
                            }
                            className="admin-input w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)]">Уровень</label>
                          <input
                            type="number"
                            value={editData.level ?? selectedUser.level ?? 1}
                            onChange={e =>
                              setEditData(prev => ({
                                ...prev,
                                level: parseInt(e.target.value) || 1,
                              }))
                            }
                            className="admin-input w-full mt-1"
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveUserData}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                        >
                          <Save className="w-4 h-4" />
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setIsEditMode(false);
                            setEditData({});
                          }}
                          className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditMode(true);
                        setEditData({
                          username: selectedUser.username,
                          email: selectedUser.email,
                          level: selectedUser.level,
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать данные
                    </button>
                  )}

                  {/* Ban section */}
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                    <h3 className="text-sm font-medium text-red-500 flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Блокировка
                    </h3>
                    {(selectedUser as UserProfile & { isBanned?: boolean }).isBanned ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-500 font-medium">
                          Пользователь заблокирован
                        </span>
                        <button
                          onClick={() => handleUnbanUser(selectedUser._id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          Разблокировать
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[var(--muted-foreground)]">
                              Причина
                            </label>
                            <input
                              type="text"
                              value={banReason}
                              onChange={e => setBanReason(e.target.value)}
                              placeholder="Укажите причину..."
                              className="admin-input w-full mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[var(--muted-foreground)]">
                              Срок (часы, пусто = навсегда)
                            </label>
                            <input
                              type="number"
                              value={banDuration ?? ""}
                              onChange={e =>
                                setBanDuration(
                                  e.target.value ? parseInt(e.target.value) : undefined,
                                )
                              }
                              placeholder="Навсегда"
                              className="admin-input w-full mt-1"
                              min={1}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleBanFromModal}
                          disabled={!banReason}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Ban className="w-4 h-4" />
                          Заблокировать
                        </button>
                      </>
                    )}
                  </div>

                  {/* Delete comments */}
                  <button
                    onClick={() =>
                      handleDeleteCommentsFromList(selectedUser._id, selectedUser.username)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Удалить все комментарии
                  </button>
                </div>
              )}

              {detailTab === "balance" && selectedUser && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[var(--primary)]/10 p-6 text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">Текущий баланс</p>
                    <p className="text-4xl font-bold text-[var(--primary)]">
                      {selectedUser.balance || 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
                    <h3 className="text-sm font-medium text-[var(--foreground)]">
                      Изменить баланс
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[var(--muted-foreground)]">Сумма</label>
                        <input
                          type="number"
                          value={balanceAmount}
                          onChange={e => setBalanceAmount(e.target.value)}
                          placeholder="100"
                          className="admin-input w-full mt-1"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--muted-foreground)]">Описание</label>
                        <input
                          type="text"
                          value={balanceDescription}
                          onChange={e => setBalanceDescription(e.target.value)}
                          placeholder="Причина изменения..."
                          className="admin-input w-full mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateBalance(true)}
                        disabled={!balanceAmount || !balanceDescription}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        Начислить
                      </button>
                      <button
                        onClick={() => handleUpdateBalance(false)}
                        disabled={!balanceAmount || !balanceDescription}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                        Списать
                      </button>
                    </div>
                  </div>

                  {/* Transactions history */}
                  <div className="rounded-lg border border-[var(--border)]">
                    <div className="p-3 border-b border-[var(--border)]">
                      <h3 className="text-sm font-medium text-[var(--foreground)]">
                        История транзакций
                      </h3>
                    </div>
                    {transactions.length === 0 ? (
                      <div className="p-6 text-center text-[var(--muted-foreground)]">
                        Нет транзакций
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {transactions.map(tx => (
                          <div key={tx._id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${tx.amount >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}
                              >
                                {tx.amount >= 0 ? (
                                  <Plus className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Minus className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">
                                  {tx.description}
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {formatDate(tx.createdAt)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {tx.amount >= 0 ? "+" : ""}
                              {tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === "bans" && (
                <div className="space-y-4">
                  {banHistory.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
                      <History className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" />
                      <p className="text-[var(--muted-foreground)]">История банов пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {banHistory.map(ban => (
                        <div
                          key={ban._id}
                          className={`rounded-lg border p-4 ${
                            ban.isActive
                              ? "border-red-500/50 bg-red-500/5"
                              : "border-[var(--border)]"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {ban.isActive ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                              )}
                              <span
                                className={`text-sm font-medium ${ban.isActive ? "text-red-500" : "text-[var(--foreground)]"}`}
                              >
                                {ban.isActive ? "Активный бан" : "Истёкший бан"}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {formatDate(ban.bannedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--foreground)] mb-2">{ban.reason}</p>
                          {ban.expiresAt && (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              Истекает: {formatDate(ban.expiresAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--secondary)]/30">
              <button
                onClick={() => handleViewUser(selectedUserId)}
                className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Открыть профиль
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={closeUserDetail}
                className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 sm:px-3 py-2 sm:py-2.5">
      <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
