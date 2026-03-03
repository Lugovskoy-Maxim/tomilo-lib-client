export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const timeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "только что";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин назад`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ч назад`;
  } else if (diffInDays < 7) {
    return `${diffInDays} д назад`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} нед назад`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} мес назад`;
  } else {
    return `${diffInYears} г назад`;
  }
};

/** Для уведомлений: недавние — относительное время, старые — короткая дата */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return timeAgo(dateString);
  }
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return "вчера, " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffInHours < 7 * 24) {
    return date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
