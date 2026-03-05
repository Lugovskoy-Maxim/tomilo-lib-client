"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/guard/AuthGuard";
import {
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useGetUserBanHistoryQuery,
  useUpdateUserBalanceMutation,
  useGetUserTransactionsQuery,
  useUpdateUserDataMutation,
  useUpdateAvatarAdminMutation,
  type UserRole,
  type UserBan,
  type BalanceTransaction,
} from "@/store/api/usersApi";
import LoadingState from "@/shared/profile/ProfileLoading";
import ErrorState from "@/shared/error-state/ErrorState";
import { Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { getEquippedBackgroundUrl } from "@/api/shop";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";
import { ProfileNav } from "@/shared/profile-tabs/ProfileNav";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import {
  ArrowLeft,
  Shield,
  Ban,
  Wallet,
  Edit3,
  History,
  X,
  Check,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProfileTab } from "@/shared/profile-tabs/profileTabConfig";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { authApi } from "@/store/api/authApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";

function AdminControlsPanel({
  userId,
  currentRole,
  currentBalance,
  username,
  bio = "",
  subscriptionExpiresAt = null,
}: {
  userId: string;
  currentRole: string;
  currentBalance: number;
  username: string;
  bio?: string;
  subscriptionExpiresAt?: string | null;
}) {
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const [activePanel, setActivePanel] = useState<"role" | "ban" | "balance" | "edit" | "premium" | null>(null);
  
  const invalidateAuthCache = useCallback(() => {
    dispatch(authApi.util.invalidateTags(["Auth"]));
  }, [dispatch]);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole as UserRole);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("permanent");
  const [customBanHours, setCustomBanHours] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<"add" | "subtract">("add");

  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const subscriptionDate = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
  const isPremiumActive = subscriptionDate && subscriptionDate.getTime() > Date.now();
  const [premiumDateInput, setPremiumDateInput] = useState(
    subscriptionDate && !Number.isNaN(subscriptionDate.getTime())
      ? subscriptionDate.toISOString().slice(0, 10)
      : "",
  );

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [banUser, { isLoading: isBanning }] = useBanUserMutation();
  const [unbanUser, { isLoading: isUnbanning }] = useUnbanUserMutation();
  const [updateBalance, { isLoading: isUpdatingBalance }] = useUpdateUserBalanceMutation();
  const [updateUserData, { isLoading: isUpdatingData }] = useUpdateUserDataMutation();
  const [updateAvatarAdmin, { isLoading: isUpdatingAvatar }] = useUpdateAvatarAdminMutation();

  const { data: banHistoryData, refetch: refetchBanHistory } = useGetUserBanHistoryQuery(userId);
  const { data: transactionsData, refetch: refetchTransactions } = useGetUserTransactionsQuery({
    userId,
    limit: 10,
  });

  const banHistory = banHistoryData?.data || [];
  const transactions = transactionsData?.data?.transactions || [];
  const activeBan = banHistory.find((ban: UserBan) => ban.isActive);

  const handleUpdateRole = async () => {
    try {
      await updateRole({ userId, role: selectedRole }).unwrap();
      toast.success(`Роль пользователя изменена на ${getRoleName(selectedRole)}`);
      setActivePanel(null);
      invalidateAuthCache();
    } catch (error) {
      toast.error("Ошибка при изменении роли");
    }
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error("Укажите причину бана");
      return;
    }

    let duration: number | undefined;
    if (banDuration !== "permanent") {
      if (banDuration === "custom") {
        duration = parseInt(customBanHours, 10);
        if (isNaN(duration) || duration <= 0) {
          toast.error("Укажите корректное количество часов");
          return;
        }
      } else {
        duration = parseInt(banDuration, 10);
      }
    }

    try {
      await banUser({ userId, reason: banReason, duration }).unwrap();
      toast.success("Пользователь заблокирован");
      setBanReason("");
      setBanDuration("permanent");
      setActivePanel(null);
      refetchBanHistory();
    } catch (error) {
      toast.error("Ошибка при блокировке пользователя");
    }
  };

  const handleUnbanUser = async () => {
    try {
      await unbanUser(userId).unwrap();
      toast.success("Пользователь разблокирован");
      refetchBanHistory();
    } catch (error) {
      toast.error("Ошибка при разблокировке пользователя");
    }
  };

  const handleUpdateBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    if (!balanceDescription.trim()) {
      toast.error("Укажите описание операции");
      return;
    }

    const finalAmount = balanceOperation === "subtract" ? -amount : amount;

    try {
      await updateBalance({ userId, amount: finalAmount, description: balanceDescription }).unwrap();
      toast.success(`Баланс ${balanceOperation === "add" ? "пополнен" : "уменьшен"} на ${amount}`);
      setBalanceAmount("");
      setBalanceDescription("");
      setActivePanel(null);
      refetchTransactions();
      invalidateAuthCache();
    } catch (error) {
      toast.error("Ошибка при изменении баланса");
    }
  };

  const handleSaveSubscription = async (value: string | null) => {
    try {
      await updateUserData({
        userId,
        data: { subscriptionExpiresAt: value },
      }).unwrap();
      toast.success(value ? "Подписка обновлена" : "Подписка снята");
      setActivePanel(null);
      invalidateAuthCache();
    } catch (error: unknown) {
      const msg = (error as { data?: { message?: string; errors?: string[] } })?.data?.errors?.[0]
        ?? (error as { data?: { message?: string } })?.data?.message
        ?? "Ошибка при сохранении";
      toast.error(msg);
    }
  };

  const addPremiumDays = (days: number) => {
    const base = subscriptionDate && subscriptionDate.getTime() > Date.now()
      ? subscriptionDate
      : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    setPremiumDateInput(next.toISOString().slice(0, 10));
  };

  const handleSaveProfile = async () => {
    const usernameChanged = editUsername.trim() !== username;
    const bioChanged = editBio !== (bio ?? "");
    if (!usernameChanged && !bioChanged && !avatarFile) {
      toast.error("Нет изменений для сохранения");
      return;
    }
    if (editUsername.trim().length < 3) {
      toast.error("Никнейм не менее 3 символов");
      return;
    }
    try {
      if (usernameChanged || bioChanged) {
        await updateUserData({
          userId,
          data: {
            ...(usernameChanged && { username: editUsername.trim() }),
            ...(bioChanged && { bio: editBio }),
          },
        }).unwrap();
      }
      if (avatarFile) {
        await updateAvatarAdmin({ userId, file: avatarFile }).unwrap();
        setAvatarFile(null);
      }
      toast.success("Профиль обновлён");
      setActivePanel(null);
      invalidateAuthCache();
    } catch (error: unknown) {
      const msg = (error as { data?: { message?: string; errors?: string[] } })?.data?.errors?.[0]
        ?? (error as { data?: { message?: string } })?.data?.message
        ?? "Ошибка при сохранении";
      toast.error(msg);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "moderator":
        return "Модератор";
      default:
        return "Пользователь";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-red-500 bg-red-500/10";
      case "moderator":
        return "text-blue-500 bg-blue-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  return (
    <div className="rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 sm:p-4 space-y-3 sm:space-y-4">
      <h3 className="text-sm sm:text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
        Управление
      </h3>

      {activeBan && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-1.5 sm:gap-2 text-red-500 font-medium mb-1 text-sm">
            <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Заблокирован
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Причина: {activeBan.reason}</p>
          <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">
            С: {formatDate(activeBan.bannedAt)}
            {activeBan.expiresAt && ` до ${formatDate(activeBan.expiresAt)}`}
          </p>
          <button
            onClick={handleUnbanUser}
            disabled={isUnbanning}
            className="mt-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isUnbanning ? "..." : "Разблокировать"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => setActivePanel(activePanel === "role" ? null : "role")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
            activePanel === "role"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Роль
        </button>
        {!activeBan && (
          <button
            onClick={() => setActivePanel(activePanel === "ban" ? null : "ban")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
              activePanel === "ban"
                ? "bg-red-500 text-white"
                : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden min-[400px]:inline">Заблокировать</span>
            <span className="min-[400px]:hidden">Бан</span>
          </button>
        )}
        <button
          onClick={() => setActivePanel(activePanel === "balance" ? null : "balance")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
            activePanel === "balance"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {currentBalance}
        </button>
        <button
          onClick={() => {
            setActivePanel(activePanel === "edit" ? null : "edit");
            setEditUsername(username);
            setEditBio(bio ?? "");
            setAvatarFile(null);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
            activePanel === "edit"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Профиль
        </button>
        <button
          onClick={() => {
            setActivePanel(activePanel === "premium" ? null : "premium");
            const d = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
            setPremiumDateInput(
              d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "",
            );
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
            activePanel === "premium"
              ? "bg-amber-500 text-white"
              : isPremiumActive
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Премиум
        </button>
      </div>

      {activePanel === "edit" && (
        <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-2 sm:space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
            Никнейм, био и аватар
          </h4>
          <p className="text-xs text-[var(--muted-foreground)]">
            Изменение данных пользователя для соблюдения правил (модерация).
          </p>
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Никнейм</label>
            <input
              type="text"
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              placeholder="Никнейм"
              minLength={3}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Био</label>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Краткое описание (до 200 символов)"
              maxLength={200}
              rows={3}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm resize-none"
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{editBio.length}/200</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Новый аватар</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs sm:text-sm text-[var(--foreground)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-[var(--primary-foreground)] file:text-xs"
            />
            {avatarFile && (
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Выбран: {avatarFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleSaveProfile}
              disabled={isUpdatingData || isUpdatingAvatar}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs sm:text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isUpdatingData || isUpdatingAvatar ? "..." : "Сохранить"}
            </button>
            <button
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {activePanel === "role" && (
        <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-2 sm:space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)]">Изменить роль</h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(["user", "moderator", "admin"] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${
                  selectedRole === role
                    ? getRoleColor(role) + " ring-2 ring-[var(--primary)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {getRoleName(role)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleUpdateRole}
              disabled={isUpdatingRole || selectedRole === currentRole}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs sm:text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isUpdatingRole ? "..." : "Сохранить"}
            </button>
            <button
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {activePanel === "ban" && (
        <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-2 sm:space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            Заблокировать
          </h4>
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Причина</label>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Причина блокировки..."
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Длительность</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { value: "1", label: "1ч" },
                { value: "24", label: "24ч" },
                { value: "168", label: "7д" },
                { value: "720", label: "30д" },
                { value: "permanent", label: "∞" },
                { value: "custom", label: "..." },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setBanDuration(option.value)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-all active:scale-[0.98] ${
                    banDuration === option.value
                      ? "bg-red-500 text-white"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {banDuration === "custom" && (
              <input
                type="number"
                value={customBanHours}
                onChange={e => setCustomBanHours(e.target.value)}
                placeholder="Часов"
                className="mt-1.5 sm:mt-2 w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm"
              />
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleBanUser}
              disabled={isBanning}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-500 text-white text-xs sm:text-sm font-medium hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isBanning ? "..." : "Заблокировать"}
            </button>
            <button
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {activePanel === "balance" && (
        <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-2 sm:space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
            Баланс
          </h4>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setBalanceOperation("add")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all active:scale-[0.98] ${
                balanceOperation === "add"
                  ? "bg-green-500 text-white"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Пополнить</span>
              <span className="min-[400px]:hidden">+</span>
            </button>
            <button
              onClick={() => setBalanceOperation("subtract")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all active:scale-[0.98] ${
                balanceOperation === "subtract"
                  ? "bg-red-500 text-white"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Списать</span>
              <span className="min-[400px]:hidden">−</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Сумма</label>
              <input
                type="number"
                value={balanceAmount}
                onChange={e => setBalanceAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Описание</label>
              <input
                type="text"
                value={balanceDescription}
                onChange={e => setBalanceDescription(e.target.value)}
                placeholder="Причина"
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleUpdateBalance}
              disabled={isUpdatingBalance}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-50 ${
                balanceOperation === "add" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isUpdatingBalance ? "..." : "OK"}
            </button>
            <button
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Отмена
            </button>
          </div>

          {transactions.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
              <h5 className="text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Транзакции
              </h5>
              <div className="space-y-1.5 sm:space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
                {transactions.map((tx: BalanceTransaction) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-[var(--card)] text-xs sm:text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[var(--foreground)] truncate">{tx.description}</p>
                      <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span
                      className={`font-medium flex-shrink-0 ml-2 ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activePanel === "premium" && (
        <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-2 sm:space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            Премиум-подписка
          </h4>
          {subscriptionExpiresAt && (
            <p className="text-xs text-[var(--muted-foreground)]">
              {isPremiumActive
                ? `Активна до ${subscriptionDate?.toLocaleDateString("ru-RU")}`
                : `Истекла ${subscriptionDate?.toLocaleDateString("ru-RU")}`}
            </p>
          )}
          <div>
            <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Премиум до (дата)</label>
            <input
              type="date"
              value={premiumDateInput}
              onChange={e => setPremiumDateInput(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => addPremiumDays(30)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              +1 мес
            </button>
            <button
              type="button"
              onClick={() => addPremiumDays(90)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              +3 мес
            </button>
            <button
              type="button"
              onClick={() => addPremiumDays(365)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              +1 год
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => handleSaveSubscription(premiumDateInput ? new Date(premiumDateInput + "T23:59:59.999Z").toISOString() : null)}
              disabled={isUpdatingData || !premiumDateInput}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-amber-500 text-white text-xs sm:text-sm font-medium hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isUpdatingData ? "..." : "Сохранить дату"}
            </button>
            <button
              onClick={() => handleSaveSubscription(null)}
              disabled={isUpdatingData}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Убрать подписку
            </button>
            <button
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--card)] text-[var(--foreground)] text-xs sm:text-sm font-medium hover:bg-[var(--accent)] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {banHistory.length > 0 && activePanel !== "ban" && (
        <div className="pt-3 sm:pt-4 border-t border-[var(--border)]">
          <h4 className="text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Баны
          </h4>
          <div className="space-y-1.5 sm:space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
            {banHistory.slice(0, 5).map((ban: UserBan) => (
              <div
                key={ban._id}
                className={`p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm ${
                  ban.isActive ? "bg-red-500/10" : "bg-[var(--secondary)]"
                }`}
              >
                <p className="text-[var(--foreground)] truncate">{ban.reason}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                  {formatDate(ban.bannedAt)}
                  {ban.expiresAt && ` — ${formatDate(ban.expiresAt)}`}
                  {ban.isActive && <span className="ml-1 sm:ml-2 text-red-500">Актив</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: userData, isLoading, error } = useGetUserByIdQuery(userId);
  const userProfile = userData?.data;

  useSEO({
    title: userProfile ? `Профиль: ${userProfile.username}` : "Профиль пользователя",
    description: userProfile
      ? `Профиль пользователя ${userProfile.username} на Tomilo Lib`
      : "Просмотр профиля пользователя",
  });

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />
        <div className="flex flex-1 flex-col min-h-0">
          <LoadingState />
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !userProfile) {
    return (
      <main className="min-h-screen flex flex-col bg-[var(--background)]">
        <Header />
        <div className="flex flex-1 flex-col min-h-0">
          <ErrorState message="Пользователь не найден" />
        </div>
        <Footer />
      </main>
    );
  }

  const profileBgUrl = getEquippedBackgroundUrl(userProfile.equippedDecorations) || "/user/banner.jpg";
  const basePath = `/admin/users/${userId}`;

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />

        {/* Баннер и карточка — как у личного профиля */}
        <div
          className="relative min-h-[50vh] sm:min-h-[55vh] flex flex-1 flex-col bg-[var(--background)] pt-12 sm:pt-36 bg-no-repeat bg-top"
          style={{
            backgroundImage: `url(${profileBgUrl})`,
            backgroundSize: "100% auto",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top center",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: "linear-gradient(to top, var(--background) 0%, var(--background) 45%, transparent 65%)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/10 from-0% via-transparent via-[35%] to-transparent to-[72%] pointer-events-none z-0"
            aria-hidden
          />

          <div className="relative z-10 flex flex-1 flex-col min-h-0">
            <div className="w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 py-4 sm:py-6 max-w-7xl min-w-0 overflow-x-hidden">
              <Breadcrumbs
                items={[
                  { name: "Главная", href: "/" },
                  { name: "Админка", href: "/admin" },
                  { name: "Пользователи", href: "/admin?tab=users" },
                  { name: userProfile.username ?? "Профиль", isCurrent: true },
                ]}
                className="mb-4"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="group flex items-center gap-1.5 sm:gap-2 px-2 py-2 min-[360px]:px-3 sm:px-4 sm:py-2.5 bg-[var(--card)]/90 backdrop-blur-sm text-[var(--foreground)] rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all duration-300 font-medium border border-[var(--border)] hover:border-[var(--primary)] shadow-sm hover:shadow-md"
                  aria-label="Назад"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-sm">Назад</span>
                </button>
                <Link
                  href="/profile"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Мой профиль
                </Link>
              </div>

              <div className="relative rounded-2xl bg-[var(--background)]/55 backdrop-blur-md border border-[var(--border)]/50 shadow-xl shadow-black/5 min-h-[50vh] overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-16 pointer-events-none z-0"
                  style={{
                    background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
                    opacity: 0.55,
                  }}
                  aria-hidden
                />
                <div className="relative z-10 p-4 sm:p-6 flex flex-col xl:flex-row gap-6 xl:gap-8 items-stretch xl:items-start">
                  <aside className="xl:w-72 xl:shrink-0 xl:flex xl:flex-col xl:gap-6 xl:sticky xl:top-4">
                    <ProfileSidebar
                      userProfile={userProfile}
                      isOwnProfile={false}
                    />
                    <div className="hidden xl:block">
                      <ProfileNav hideTabs={["settings"] as ProfileTab[]} />
                    </div>
                  </aside>
                  <div className="flex-1 min-w-0 w-full space-y-6">
                    <AdminControlsPanel
                      userId={userId}
                      currentRole={userProfile.role}
                      currentBalance={userProfile.balance || 0}
                      username={userProfile.username}
                      bio={userProfile.bio ?? ""}
                      subscriptionExpiresAt={userProfile.subscriptionExpiresAt ?? undefined}
                    />
                    <ProfileTabs
                      userProfile={userProfile}
                      breadcrumbPrefix={[
                        { name: "Главная", href: "/" },
                        { name: "Админка", href: "/admin" },
                        { name: "Пользователи", href: "/admin?tab=users" },
                        { name: userProfile.username ?? "Профиль", href: basePath },
                      ]}
                      hideTabs={["settings"]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
