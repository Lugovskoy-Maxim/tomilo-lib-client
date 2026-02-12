"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import {
  useGetStatsHistoryQuery,
  useGetDailyStatsQuery,
  useGetStatsRangeQuery,
  useGetMonthlyStatsQuery,
  useGetYearlyStatsQuery,
  useGetRecentStatsQuery,
  useGetAvailableYearsQuery,
  useRecordStatsMutation,
} from "@/store/api/statsApi";
import { StatCard } from "./ui";
import { formatNumber } from "@/lib/utils";
import {
  DailyStatsHistory,
  MonthlyStatsHistory,
  YearlyStatsHistory,
} from "@/types/stats";

type StatsView = "history" | "daily" | "range" | "monthly" | "yearly" | "recent";

const COLORS = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  muted: "var(--muted)",
  chart1: "#8884d8",
  chart2: "#82ca9d",
  chart3: "#ffc658",
  chart4: "#ff7c7c",
  chart5: "#8dd1e1",
};

export function StatsSection() {
  const [activeView, setActiveView] = useState<StatsView>("history");
  const [historyType, setHistoryType] = useState<"daily" | "monthly" | "yearly">("daily");
  const [historyDays, setHistoryDays] = useState(30);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [recentDays, setRecentDays] = useState(30);

  // Queries
  const { data: historyData, isLoading: isHistoryLoading } = useGetStatsHistoryQuery(
    { type: historyType, days: historyType === "daily" ? historyDays : undefined, year: selectedYear, month: selectedMonth },
    { skip: activeView !== "history" }
  );

  const { data: dailyData, isLoading: isDailyLoading } = useGetDailyStatsQuery(
    { date: selectedDate },
    { skip: activeView !== "daily" }
  );

  const { data: rangeData, isLoading: isRangeLoading } = useGetStatsRangeQuery(
    { start: dateRange.start, end: dateRange.end },
    { skip: activeView !== "range" || !dateRange.start || !dateRange.end }
  );

  const { data: monthlyData, isLoading: isMonthlyLoading } = useGetMonthlyStatsQuery(
    { year: selectedYear, month: selectedMonth },
    { skip: activeView !== "monthly" }
  );

  const { data: yearlyData, isLoading: isYearlyLoading } = useGetYearlyStatsQuery(
    { year: selectedYear },
    { skip: activeView !== "yearly" }
  );

  const { data: recentData, isLoading: isRecentLoading } = useGetRecentStatsQuery(
    { days: recentDays },
    { skip: activeView !== "recent" }
  );

  const { data: availableYears } = useGetAvailableYearsQuery();
  const [recordStats, { isLoading: isRecording }] = useRecordStatsMutation();

  // Prepare chart data
  const chartData = useMemo(() => {
    if (activeView === "history" && historyData?.data?.data) {
      return (historyData.data.data as (DailyStatsHistory | MonthlyStatsHistory | YearlyStatsHistory)[]).map((item) => ({
        name: "date" in item ? item.date : `${item.year}-${"month" in item ? item.month : ""}`,
        views: item.views,
        newUsers: item.newUsers,
        newTitles: item.newTitles,
        newChapters: item.newChapters,
      }));
    }
    if (activeView === "recent" && recentData?.data) {
      return recentData.data.map((item) => ({
        name: item.date,
        views: item.views,
        newUsers: item.newUsers,
        newTitles: item.newTitles,
        newChapters: item.newChapters,
      }));
    }
    if (activeView === "range" && rangeData?.data) {
      return rangeData.data.map((item) => ({
        name: item.date,
        views: item.views,
        newUsers: item.newUsers,
        newTitles: item.newTitles,
        newChapters: item.newChapters,
      }));
    }
    return [];
  }, [activeView, historyData, recentData, rangeData]);

  const handleRecordStats = async () => {
    try {
      await recordStats().unwrap();
      alert("Статистика успешно записана!");
    } catch (error) {
      alert("Ошибка при записи статистики");
    }
  };

  const exportData = () => {
    let dataToExport: unknown = {};
    
    switch (activeView) {
      case "history":
        dataToExport = historyData?.data;
        break;
      case "daily":
        dataToExport = dailyData?.data;
        break;
      case "range":
        dataToExport = rangeData?.data;
        break;
      case "monthly":
        dataToExport = monthlyData?.data;
        break;
      case "yearly":
        dataToExport = yearlyData?.data;
        break;
      case "recent":
        dataToExport = recentData?.data;
        break;
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stats-${activeView}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isLoading = isHistoryLoading || isDailyLoading || isRangeLoading || 
                    isMonthlyLoading || isYearlyLoading || isRecentLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Детальная статистика</h2>
          <p className="text-[var(--muted-foreground)]">Исторические данные и аналитика</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecordStats}
            disabled={isRecording}
            className="admin-btn admin-btn-primary flex items-center gap-2 bg-[var(--chart-2)] hover:bg-[var(--chart-2)]/90 text-white border-0"
          >
            <Play className="w-4 h-4" />
            {isRecording ? "Запись..." : "Записать сегодня"}
          </button>
          <button
            onClick={exportData}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "history", label: "История", icon: BarChart3 },
          { key: "daily", label: "За день", icon: Calendar },
          { key: "range", label: "Диапазон", icon: TrendingUp },
          { key: "monthly", label: "За месяц", icon: Calendar },
          { key: "yearly", label: "За год", icon: Calendar },
          { key: "recent", label: "Последние дни", icon: RefreshCw },
        ].map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as StatsView)}
              className={`admin-btn flex items-center gap-2 ${
                activeView === view.key
                  ? "admin-btn-primary"
                  : "admin-btn-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
        {activeView === "history" && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Тип:</span>
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value as "daily" | "monthly" | "yearly")}
                className="admin-input"
              >
                <option value="daily">По дням</option>
                <option value="monthly">По месяцам</option>
                <option value="yearly">По годам</option>
              </select>
            </div>
            {historyType === "daily" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Дней:</span>
                <input
                  type="number"
                  value={historyDays}
                  onChange={(e) => setHistoryDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="admin-input w-20"
                />
              </div>
            )}
            {historyType !== "daily" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Год:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="admin-input"
                  >
                    {availableYears?.data?.years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    )) || (
                      <>
                        <option value={2024}>2024</option>
                        <option value={2023}>2023</option>
                      </>
                    )}
                  </select>
                </div>
                {historyType === "monthly" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Месяц:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="admin-input"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString("ru", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeView === "daily" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Дата:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="admin-input"
            />
          </div>
        )}

        {activeView === "range" && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">С:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="admin-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">По:</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="admin-input"
              />
            </div>
          </div>
        )}

        {activeView === "monthly" && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Год:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="admin-input"
              >
                {availableYears?.data?.years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                )) || (
                  <>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Месяц:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="admin-input"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("ru", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeView === "yearly" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Год:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="admin-input"
            >
              {availableYears?.data?.years.map((year) => (
                <option key={year} value={year}>{year}</option>
              )) || (
                <>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </>
              )}
            </select>
          </div>
        )}

        {activeView === "recent" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Последних дней:</span>
            <input
              type="number"
              value={recentDays}
              onChange={(e) => setRecentDays(Number(e.target.value))}
              min={1}
              max={365}
              className="admin-input w-20"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 bg-[var(--muted)] rounded-[var(--admin-radius)] animate-pulse"></div>
          <div className="h-64 bg-[var(--muted)] rounded-[var(--admin-radius)] animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                График активности
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} />
                  <XAxis dataKey="name" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke={COLORS.chart1}
                    fill={COLORS.chart1}
                    fillOpacity={0.6}
                    name="Просмотры"
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="2"
                    stroke={COLORS.chart2}
                    fill={COLORS.chart2}
                    fillOpacity={0.6}
                    name="Новые пользователи"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden">
            <h3 className="text-lg font-semibold text-[var(--foreground)] p-4 border-b border-[var(--border)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
              Данные
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      {activeView === "monthly" || activeView === "yearly" ? "Период" : "Дата"}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">Просмотры</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">Новые пользователи</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">Новые тайтлы</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">Новые главы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {activeView === "history" && historyData?.data?.data?.map((item, index: number) => (
                    <tr key={index} className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                        {"date" in item ? item.date : `${item.year}-${"month" in item ? item.month : ""}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newChapters)}</td>
                    </tr>
                  ))}
                  {activeView === "daily" && dailyData?.data && (
                    <tr className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{dailyData.data.date}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(dailyData.data.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(dailyData.data.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(dailyData.data.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(dailyData.data.newChapters)}</td>
                    </tr>
                  )}
                  {activeView === "range" && rangeData?.data?.map((item, index: number) => (
                    <tr key={index} className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.date}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newChapters)}</td>
                    </tr>
                  ))}
                  {activeView === "monthly" && monthlyData?.data && (
                    <tr className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{monthlyData.data.year}-{monthlyData.data.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(monthlyData.data.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(monthlyData.data.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(monthlyData.data.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(monthlyData.data.newChapters)}</td>
                    </tr>
                  )}
                  {activeView === "yearly" && yearlyData?.data && (
                    <tr className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{yearlyData.data.year}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(yearlyData.data.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(yearlyData.data.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(yearlyData.data.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(yearlyData.data.newChapters)}</td>
                    </tr>
                  )}
                  {activeView === "recent" && recentData?.data?.map((item, index: number) => (
                    <tr key={index} className="hover:bg-[var(--accent)]/30">
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.date}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.views)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newUsers)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newTitles)}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatNumber(item.newChapters)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Всего просмотров"
              value={formatNumber(
                activeView === "history" 
                  ? (historyData?.data?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.views || 0), 0) || 0
                  : activeView === "daily"
                  ? dailyData?.data?.views || 0
                  : activeView === "range"
                  ? (rangeData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.views || 0), 0) || 0
                  : activeView === "monthly"
                  ? monthlyData?.data?.views || 0
                  : activeView === "yearly"
                  ? yearlyData?.data?.views || 0
                  : (recentData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.views || 0), 0) || 0
              )}
              icon={<Eye className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="Новые пользователи"
              value={formatNumber(
                activeView === "history" 
                  ? (historyData?.data?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newUsers || 0), 0) || 0
                  : activeView === "daily"
                  ? dailyData?.data?.newUsers || 0
                  : activeView === "range"
                  ? (rangeData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newUsers || 0), 0) || 0
                  : activeView === "monthly"
                  ? monthlyData?.data?.newUsers || 0
                  : activeView === "yearly"
                  ? yearlyData?.data?.newUsers || 0
                  : (recentData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newUsers || 0), 0) || 0
              )}
              icon={<Users className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              label="Новые тайтлы"
              value={formatNumber(
                activeView === "history" 
                  ? (historyData?.data?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newTitles || 0), 0) || 0
                  : activeView === "daily"
                  ? dailyData?.data?.newTitles || 0
                  : activeView === "range"
                  ? (rangeData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newTitles || 0), 0) || 0
                  : activeView === "monthly"
                  ? monthlyData?.data?.newTitles || 0
                  : activeView === "yearly"
                  ? yearlyData?.data?.newTitles || 0
                  : (recentData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newTitles || 0), 0) || 0
              )}
              icon={<BookOpen className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              label="Новые главы"
              value={formatNumber(
                activeView === "history" 
                  ? (historyData?.data?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newChapters || 0), 0) || 0
                  : activeView === "daily"
                  ? dailyData?.data?.newChapters || 0
                  : activeView === "range"
                  ? (rangeData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newChapters || 0), 0) || 0
                  : activeView === "monthly"
                  ? monthlyData?.data?.newChapters || 0
                  : activeView === "yearly"
                  ? yearlyData?.data?.newChapters || 0
                  : (recentData?.data as DailyStatsHistory[])?.reduce((sum, item) => sum + (item.newChapters || 0), 0) || 0
              )}
              icon={<TrendingUp className="w-5 h-5" />}
              color="orange"
            />
          </div>
        </>
      )}
    </div>
  );
}
