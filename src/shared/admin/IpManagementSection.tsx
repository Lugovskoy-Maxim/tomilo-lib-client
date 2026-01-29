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
    <div className="space-y-6 p-2">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Всего</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.totalRequests?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Уник.</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.uniqueIps?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Блок.</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.blockedCount?.toLocaleString() || 0
            )}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Топ</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {isStatsLoading ? (
              <div className="h-6 w-16 bg-[var(--accent)] animate-pulse rounded" />
            ) : (
              statsData?.data?.topIps?.length || 0
            )}
          </p>
        </div>
      </div>

      {/* Block IP Form */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <form onSubmit={handleBlockIp} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="IP адрес"
            value={blockIpForm.ip}
            onChange={e => setBlockIpForm({ ...blockIpForm, ip: e.target.value })}
            className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
          />
          <input
            type="text"
            placeholder="Причина"
            value={blockIpForm.reason}
            onChange={e => setBlockIpForm({ ...blockIpForm, reason: e.target.value })}
            className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
          />
          <Button type="submit" disabled={isBlocking} variant="destructive" size="sm">
            {isBlocking ? "..." : "Блок."}
          </Button>
        </form>
      </div>

      {/* Blocked IPs List */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Header with search */}
        <div className="p-3 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm"
            />
          </div>
        </div>

        {isBlockedIpsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">Загрузка...</p>
          </div>
        ) : filteredIps && filteredIps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs">
                    IP
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs hidden md:table-cell">
                    Причина
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs hidden lg:table-cell">
                    Дата
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-[var(--foreground)] text-xs">
                    Действ.
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIps.map((blockedIp: BlockedIp) => (
                  <tr
                    key={blockedIp._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        <span className="font-mono text-[var(--foreground)] text-sm">
                          {blockedIp.ip}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-[var(--foreground)] text-sm truncate max-w-[150px] block">
                        {blockedIp.reason}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {formatDate(blockedIp.blockedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleUnblockIp(blockedIp.ip)}
                          disabled={isUnblocking}
                          className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                          title="Разблокировать"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <ShieldCheck className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
            <p className="text-[var(--muted-foreground)] text-sm">
              {searchTerm ? "Не найдено" : "Нет заблокированных IP"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {blockedIpsData?.data?.pagination && blockedIpsData.data.pagination.pages > 1 && (
          <div className="flex justify-between items-center p-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted-foreground)]">
              {page} / {blockedIpsData.data.pagination.pages}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                ←
              </Button>
              <Button
                onClick={() => setPage(prev => prev + 1)}
                disabled={page === blockedIpsData.data.pagination.pages}
                variant="outline"
                size="sm"
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Top IPs Table */}
      {statsData?.data?.topIps && statsData.data.topIps.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--primary)]" />
              Топ IP
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs w-10">
                    #
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs">
                    IP
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs hidden sm:table-cell">
                    Запросы
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-xs hidden lg:table-cell">
                    Последний
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsData.data.topIps.map((ip, index: number) => (
                  <tr
                    key={ip.ip}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-[var(--muted-foreground)] text-sm">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[var(--foreground)] text-sm">{ip.ip}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="font-semibold text-[var(--foreground)] text-sm">
                        {ip.requestCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {new Date(ip.lastAccess).toLocaleDateString()}
                      </span>
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
