"use client";

import { useState } from "react";
import {
  useGetIpStatsQuery,
  useGetBlockedIpsQuery,
  useBlockIpMutation,
  useUnblockIpMutation,
} from "@/store/api/ipApi";
import { BlockedIp } from "@/types/ip";
import { useToast } from "@/hooks/useToast";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  Clock,
  Globe,
  AlertTriangle,
} from "lucide-react";
import Button from "@/shared/ui/button";

export function IpManagementSection() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [blockIpForm, setBlockIpForm] = useState({ ip: "", reason: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: statsData, isLoading: isStatsLoading } = useGetIpStatsQuery();
  const {
    data: blockedIpsData,
    isLoading: isBlockedIpsLoading,
    refetch,
  } = useGetBlockedIpsQuery({ page, limit });

  const [blockIp, { isLoading: isBlocking }] = useBlockIpMutation();
  const [unblockIp, { isLoading: isUnblocking }] = useUnblockIpMutation();
  const toast = useToast();

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIpForm.ip.trim()) {
      toast.error("Введите IP адрес");
      return;
    }

    try {
      await blockIp({
        ip: blockIpForm.ip,
        reason: blockIpForm.reason || "Причина не указана",
      }).unwrap();
      toast.success("IP успешно заблокирован");
      setBlockIpForm({ ip: "", reason: "" });
      refetch();
    } catch (error) {
      toast.error(`Не удалось заблокировать IP: ${error}`);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    if (!confirm(`Вы уверены, что хотите разблокировать IP ${ip}?`)) {
      return;
    }

    try {
      await unblockIp(ip).unwrap();
      toast.success("IP успешно разблокирован");
      refetch();
    } catch (error) {
      toast.error(`Не удалось разблокировать IP: ${error}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredIps = blockedIpsData?.data?.ips?.filter(
    (ip: BlockedIp) =>
      ip.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ip.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Всего запросов
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.totalRequests?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Уникальных IP
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.uniqueIps?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Заблокировано
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.blockedCount?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Топ IP
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.topIps?.length || 0
            )}
          </p>
        </div>
      </div>

      {/* Block IP Form */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Заблокировать IP
        </h3>
        <form
          onSubmit={handleBlockIp}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder="IP адрес (например: 192.168.1.1)"
              value={blockIpForm.ip}
              onChange={e => setBlockIpForm({ ...blockIpForm, ip: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
            />
          </div>
          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder="Причина блокировки"
              value={blockIpForm.reason}
              onChange={e =>
                setBlockIpForm({ ...blockIpForm, reason: e.target.value })
              }
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
            />
          </div>
          <div className="sm:col-span-1">
            <Button
              type="submit"
              disabled={isBlocking}
              className="w-full"
              variant="destructive"
            >
              {isBlocking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Блокировка...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Заблокировать
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Blocked IPs List */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[var(--border)]">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                Заблокированные IP адреса
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Управление заблокированными IP адресами
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по IP или причине..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {isBlockedIpsLoading ? (
          <div className="p-4 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">Загрузка заблокированных IP...</p>
          </div>
        ) : filteredIps && filteredIps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    IP адрес
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Причина
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Заблокирован
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Заблокировал
                  </th>
                  <th className="text-right p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIps.map((blockedIp: BlockedIp) => (
                  <tr
                    key={blockedIp._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="font-mono text-[var(--foreground)] text-sm sm:text-base">
                          {blockedIp.ip}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                        <span className="text-[var(--foreground)] text-sm sm:text-base">
                          {blockedIp.reason}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="text-[var(--foreground)] text-sm sm:text-base">
                          {formatDate(blockedIp.blockedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-[var(--foreground)] text-sm sm:text-base">
                      {blockedIp.blockedBy || "Система"}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleUnblockIp(blockedIp.ip)}
                          disabled={isUnblocking}
                          className="p-1.5 sm:p-2 text-green-500 hover:text-green-700 transition-colors disabled:opacity-50"
                          title="Разблокировать IP"
                        >
                          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">
              {searchTerm
                ? "IP адреса не найдены по вашему запросу"
                : "Нет заблокированных IP адресов"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {blockedIpsData?.data?.pagination &&
          blockedIpsData.data.pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--muted-foreground)]">
                Страница {page} из {blockedIpsData.data.pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Назад
                </Button>
                <Button
                  onClick={() =>
                    setPage(prev => prev + 1)
                  }
                  disabled={page === blockedIpsData.data.pagination.pages}
                  variant="outline"
                  size="sm"
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Top IPs Table */}
      {statsData?.data?.topIps && statsData.data.topIps.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--primary)]" />
              Топ активных IP адресов
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    #
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    IP адрес
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Количество запросов
                  </th>
                  <th className="text-left p-3 sm:p-4 font-medium text-[var(--foreground)]">
                    Последний доступ
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsData.data.topIps.map((ip, index: number) => (
                  <tr
                    key={ip.ip}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="p-3 sm:p-4 text-[var(--muted-foreground)]">{index + 1}</td>
                    <td className="p-3 sm:p-4">
                      <span className="font-mono text-[var(--foreground)] text-sm sm:text-base">
                        {ip.ip}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="font-semibold text-[var(--foreground)]">
                        {ip.requestCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-[var(--muted-foreground)] text-sm">
                      {formatDate(ip.lastAccess)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

