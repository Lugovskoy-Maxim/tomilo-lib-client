import React, { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Calendar, TrendingUp, Users, BookOpen, Eye, Download } from "lucide-react";
import { useGetStatsQuery } from "@/store/api/statsApi";

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

export function ChartsSection() {
  const { data: statsData, isLoading } = useGetStatsQuery();
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  if (isLoading || !statsData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
              <div className="h-4 bg-[var(--muted)] rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-[var(--muted)] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = statsData.data;
  const periodData = stats[selectedPeriod];

  // Prepare data for charts
  const viewsData = [
    { name: "Сегодня", views: stats.daily.views, users: stats.daily.newUsers },
    { name: "Неделя", views: stats.weekly.views, users: stats.weekly.newUsers },
    { name: "Месяц", views: stats.monthly.views, users: stats.monthly.newUsers },
  ];

  const titlesData = [
    { name: "Онгоинг", value: stats.ongoingTitles, color: COLORS.chart1 },
    { name: "Завершённые", value: stats.completedTitles, color: COLORS.chart2 },
    { name: "Всего", value: stats.totalTitles, color: COLORS.chart3 },
  ];

  const popularTitlesChart = stats.popularTitles.slice(0, 10).map((title) => ({
    name: title.name.length > 20 ? title.name.substring(0, 20) + "..." : title.name,
    views: title.views,
    dayViews: title.dayViews,
    weekViews: title.weekViews,
  }));

  const activityData = [
    { name: "Просмотры", value: periodData.views, icon: Eye },
    { name: "Новые пользователи", value: periodData.newUsers, icon: Users },
    { name: "Новые тайтлы", value: periodData.newTitles, icon: BookOpen },
    { name: "Новые главы", value: periodData.newChapters, icon: TrendingUp },
  ];

  const exportData = () => {
    const data = {
      stats,
      periodData,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-stats-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Аналитика</h2>
          <p className="text-[var(--muted-foreground)]">Визуализация данных и статистики</p>
        </div>
        <button
          onClick={exportData}
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Экспорт данных
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[var(--muted-foreground)]" />
        <span className="text-sm font-medium text-[var(--foreground)]">Период:</span>
        <div className="flex bg-[var(--secondary)] rounded-[var(--admin-radius)] p-1">
          {[
            { key: "daily", label: "Сегодня" },
            { key: "weekly", label: "Неделя" },
            { key: "monthly", label: "Месяц" },
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as typeof selectedPeriod)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedPeriod === period.key
                  ? "bg-[var(--background)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views and Users Over Time */}
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
            Просмотры и пользователи
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={viewsData}>
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
                dataKey="users"
                stackId="2"
                stroke={COLORS.chart2}
                fill={COLORS.chart2}
                fillOpacity={0.6}
                name="Новые пользователи"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Title Status Distribution */}
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            Распределение тайтлов
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={titlesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {titlesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Titles */}
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[var(--primary)]" />
            Популярные тайтлы
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularTitlesChart} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} />
              <XAxis type="number" stroke={COLORS.muted} />
              <YAxis dataKey="name" type="category" width={100} stroke={COLORS.muted} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="views" fill={COLORS.chart1} name="Всего просмотров" />
              <Bar dataKey="dayViews" fill={COLORS.chart2} name="Сегодня" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Metrics */}
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            Активность ({selectedPeriod === "daily" ? "сегодня" : selectedPeriod === "weekly" ? "за неделю" : "за месяц"})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
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
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-[var(--foreground)]">Просмотры</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{periodData.views.toLocaleString()}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {selectedPeriod === "daily" ? "сегодня" : selectedPeriod === "weekly" ? "за неделю" : "за месяц"}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-[var(--foreground)]">Новые пользователи</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{periodData.newUsers}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {selectedPeriod === "daily" ? "сегодня" : selectedPeriod === "weekly" ? "за неделю" : "за месяц"}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-[var(--foreground)]">Новые тайтлы</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{periodData.newTitles}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {selectedPeriod === "daily" ? "сегодня" : selectedPeriod === "weekly" ? "за неделю" : "за месяц"}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-[var(--foreground)]">Новые главы</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{periodData.newChapters}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {selectedPeriod === "daily" ? "сегодня" : selectedPeriod === "weekly" ? "за неделю" : "за месяц"}
          </p>
        </div>
      </div>
    </div>
  );
}
