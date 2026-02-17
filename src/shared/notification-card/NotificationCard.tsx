"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { Check, X, Clock, MailOpen, Mail, Trash2 } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

import { useMarkAsReadMutation, useMarkAsUnreadMutation, useDeleteNotificationMutation } from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";
import { getTitlePath } from "@/lib/title-paths";

interface NotificationCardProps {
  notification: Notification;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export default function NotificationCard({ 
  notification, 
  isSelected = false, 
  onSelect,
  selectionMode = false 
}: NotificationCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const handleClick = async () => {
    if (typeof notification.titleId === "object" && notification.titleId._id) {
      // Если titleId это объект с _id, используем его для навигации
      const titleData = {
        id: notification.titleId._id,
        slug: notification.titleId.slug,
      };
      router.push(getTitlePath(titleData));
    } else if (typeof notification.titleId === "string" && notification.titleId.trim()) {
      // Если titleId это строка и не пустая, используем её как id
      const titleId = notification.titleId.trim();
      if (titleId) {
        router.push(getTitlePath({ id: titleId }));
      }
    }

    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch {
        // Error handling is done by the RTK Query
      }
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(notification._id).unwrap();
    } catch {
      // Error handling is done by the RTK Query
    }
  };

  const handleMarkAsUnread = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsUnread(notification._id).unwrap();
    } catch {
      // Error handling is done by the RTK Query
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteNotification(notification._id).unwrap();
    } catch {
      setIsDeleting(false);
      // Error handling is done by the RTK Query
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(notification._id, e.target.checked);
  };

  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    if (coverImage.startsWith("http")) {
      return coverImage;
    }
    // Ensure proper URL construction
    const baseUrl = process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:3001";
    const cleanPath = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
    return `${baseUrl}${cleanPath}`;
  };

  const getCoverImage = () => {
    if (typeof notification.titleId === "object" && notification.titleId?._id) {
      // Try to get coverImage from the populated title object
      if (notification.titleId.coverImage) {
        return notification.titleId.coverImage;
      }
      // Fallback: construct path from title ID
      return `/uploads/titles/${notification.titleId._id}/cover.jpg`;
    }
    return undefined;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "bg-blue-500";
      case "update":
        return "bg-purple-500";
      case "user":
        return "bg-green-500";
      case "system":
        return "bg-orange-500";
      case "report_response":
      case "complaint_response":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "Новая глава";
      case "update":
        return "Обновление";
      case "user":
        return "Пользователь";
      case "system":
        return "Система";
      case "report_response":
      case "complaint_response":
        return "Ответ на жалобу";
      default:
        return "Другое";
    }
  };

  if (isDeleting) {
    return null;
  }

  const coverImageUrl = getCoverImage();

  return (
    <div
      className={`relative w-full bg-card rounded-xl border card-hover-soft group cursor-pointer ${
        notification.isRead 
          ? "border-border/50 opacity-80" 
          : "border-primary/30 bg-gradient-to-r from-primary/5 to-transparent shadow-sm"
      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onClick={handleClick}
    >
      {/* Индикатор непрочитанного */}
      {!notification.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
      )}
      
      <div className="flex items-stretch">
        {/* Чекбокс для выбора */}
        {selectionMode && (
          <div className="flex items-center px-3 py-4 border-r border-border/50" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        )}

        {/* Изображение тайтла */}
        <div className="flex-shrink-0 p-3">
          <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-muted shadow-sm">
            <img
              src={getImageUrl(coverImageUrl)}
              alt={typeof notification.titleId === "object" ? notification.titleId?.name || "Обложка" : "Обложка"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {/* Бейдж типа уведомления */}
            <div 
              className={`absolute top-1 left-1 w-2 h-2 rounded-full ${getTypeColor(notification.type)} ring-2 ring-white`} 
              title={getTypeLabel(notification.type)}
            />
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-sm leading-tight mb-1 ${
                  notification.isRead ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {notification.title}
              </h3>
              <p
                className={`text-sm line-clamp-2 leading-relaxed ${
                  notification.isRead ? "text-muted-foreground/80" : "text-foreground/90"
                }`}
              >
                {notification.message}
              </p>
              {(notification.metadata?.reportResponse || notification.metadata?.response) && (
                <p className="mt-2 text-sm text-[var(--foreground)]/80 line-clamp-3 whitespace-pre-wrap">
                  Ответ: {notification.metadata.reportResponse || notification.metadata.response}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock className="w-3 h-3" />
                <span>{new Date(notification.createdAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}</span>
                <span className="mx-1">•</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full bg-muted ${getTypeColor(notification.type).replace("bg-", "text-")}`}>
                  {getTypeLabel(notification.type)}
                </span>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {notification.isRead ? (
                <button
                  onClick={handleMarkAsUnread}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Отметить как непрочитанное"
                >
                  <Mail className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleMarkAsRead}
                  className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors"
                  title="Отметить как прочитанное"
                >
                  <MailOpen className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleRemove}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Удалить уведомление"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
