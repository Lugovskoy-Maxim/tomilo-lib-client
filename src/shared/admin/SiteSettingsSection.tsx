"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  Globe,
  Users,
  MessageCircle,
  Star,
  Shield,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useClearCacheMutation,
  useGetSystemHealthQuery,
  type SiteSettings,
} from "@/store/api/siteSettingsApi";
import { AdminCard } from "./ui";
import { useToast } from "@/hooks/useToast";

export function SiteSettingsSection() {
  const toast = useToast();
  const { data: settingsData, isLoading, refetch } = useGetSiteSettingsQuery();
  const { data: healthData, refetch: refetchHealth } = useGetSystemHealthQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSiteSettingsMutation();
  const [clearCache, { isLoading: isClearing }] = useClearCacheMutation();

  const settings = settingsData?.data;
  const health = healthData?.data;

  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (settings && form) {
      const changed = JSON.stringify(form) !== JSON.stringify(settings);
      setHasChanges(changed);
    }
  }, [form, settings]);

  const handleSave = async () => {
    try {
      await updateSettings(form).unwrap();
      toast.success("Настройки сохранены");
      setHasChanges(false);
      refetch();
    } catch (err) {
      toast.error("Ошибка при сохранении настроек");
    }
  };

  const handleClearCache = async (cacheType?: string) => {
    try {
      const result = await clearCache({ cacheType }).unwrap();
      toast.success(`Кэш очищен: ${result.data?.cleared?.join(", ") || "все"}`);
    } catch (err) {
      toast.error("Ошибка при очистке кэша");
    }
  };

  const getHealthColor = (status?: string) => {
    switch (status) {
      case "healthy":
      case "connected":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
      case "disconnected":
        return "text-red-500";
      default:
        return "text-[var(--muted-foreground)]";
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}д ${hours}ч ${minutes}м`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {health && (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted-foreground)]" />
              <span className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Статус</span>
            </div>
            <p className={`text-base sm:text-lg font-semibold ${getHealthColor(health.status)}`}>
              {health.status === "healthy" ? "OK" : health.status === "degraded" ? "Замедлен" : "Откл"}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted-foreground)]" />
              <span className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Uptime</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{formatUptime(health.uptime)}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted-foreground)]" />
              <span className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">БД</span>
            </div>
            <p className={`text-base sm:text-lg font-semibold ${getHealthColor(health.dbStatus)}`}>
              {health.dbStatus === "connected" ? "OK" : "Откл"}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">RAM</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
              {health.memoryUsage ? `${Math.round(health.memoryUsage)}%` : "—"}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">CPU</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
              {health.cpuUsage ? `${Math.round(health.cpuUsage)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      <AdminCard
        title="Настройки сайта"
        icon={<Settings className="w-4 h-4 sm:w-5 sm:h-5" />}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleClearCache()}
              disabled={isClearing}
              className="admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">{isClearing ? "..." : "Кэш"}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
              className="admin-btn-primary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">{isUpdating ? "..." : "Сохранить"}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-5 sm:space-y-8">
          <section>
            <h3 className="text-sm sm:text-lg font-medium text-[var(--foreground)] mb-3 sm:mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              Режим обслуживания
            </h3>
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg bg-[var(--secondary)]">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.maintenanceMode || false}
                  onChange={e => setForm({ ...form, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--border)]"
                />
                <span className="text-sm sm:text-base text-[var(--foreground)]">Включить режим обслуживания</span>
              </label>
              {form.maintenanceMode && (
                <div>
                  <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">
                    Сообщение для пользователей
                  </label>
                  <textarea
                    value={form.maintenanceMessage || ""}
                    onChange={e => setForm({ ...form, maintenanceMessage: e.target.value })}
                    placeholder="Сайт временно недоступен..."
                    className="admin-input w-full resize-none text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm sm:text-lg font-medium text-[var(--foreground)] mb-3 sm:mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              Основные настройки
            </h3>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Название сайта
                </label>
                <input
                  type="text"
                  value={form.siteName || ""}
                  onChange={e => setForm({ ...form, siteName: e.target.value })}
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail || ""}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  className="admin-input w-full text-sm"
                />
              </div>
              <div className="min-[400px]:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Описание сайта
                </label>
                <textarea
                  value={form.siteDescription || ""}
                  onChange={e => setForm({ ...form, siteDescription: e.target.value })}
                  className="admin-input w-full resize-none text-sm"
                  rows={2}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm sm:text-lg font-medium text-[var(--foreground)] mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              Функции сайта
            </h3>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-[var(--secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.registrationEnabled ?? true}
                  onChange={e => setForm({ ...form, registrationEnabled: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--border)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">Регистрация</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">Новые пользователи</p>
                </div>
              </label>
              <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-[var(--secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.commentsEnabled ?? true}
                  onChange={e => setForm({ ...form, commentsEnabled: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--border)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">Комментарии</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">Обсуждения контента</p>
                </div>
              </label>
              <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-[var(--secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ratingsEnabled ?? true}
                  onChange={e => setForm({ ...form, ratingsEnabled: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--border)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">Рейтинги</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">Оценки контента</p>
                </div>
              </label>
              <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-[var(--secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.adultContentEnabled ?? false}
                  onChange={e => setForm({ ...form, adultContentEnabled: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[var(--border)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">18+</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">Контент для взрослых</p>
                </div>
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm sm:text-lg font-medium text-[var(--foreground)] mb-3 sm:mb-4">Социальные сети</h3>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Telegram</label>
                <input
                  type="url"
                  value={form.socialLinks?.telegram || ""}
                  onChange={e =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, telegram: e.target.value } })
                  }
                  placeholder="t.me/..."
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Discord</label>
                <input
                  type="url"
                  value={form.socialLinks?.discord || ""}
                  onChange={e =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, discord: e.target.value } })
                  }
                  placeholder="discord.gg/..."
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">VK</label>
                <input
                  type="url"
                  value={form.socialLinks?.vk || ""}
                  onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, vk: e.target.value } })}
                  placeholder="vk.com/..."
                  className="admin-input w-full text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm sm:text-lg font-medium text-[var(--foreground)] mb-3 sm:mb-4">SEO настройки</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={form.seoSettings?.defaultTitle || ""}
                  onChange={e =>
                    setForm({ ...form, seoSettings: { ...form.seoSettings, defaultTitle: e.target.value } })
                  }
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Описание
                </label>
                <textarea
                  value={form.seoSettings?.defaultDescription || ""}
                  onChange={e =>
                    setForm({ ...form, seoSettings: { ...form.seoSettings, defaultDescription: e.target.value } })
                  }
                  className="admin-input w-full resize-none text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                  Ключевые слова
                </label>
                <input
                  type="text"
                  value={form.seoSettings?.defaultKeywords || ""}
                  onChange={e =>
                    setForm({ ...form, seoSettings: { ...form.seoSettings, defaultKeywords: e.target.value } })
                  }
                  placeholder="манга, манхва, онлайн"
                  className="admin-input w-full text-sm"
                />
              </div>
            </div>
          </section>
        </div>
      </AdminCard>
    </div>
  );
}
