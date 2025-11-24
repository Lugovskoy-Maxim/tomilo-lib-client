"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, X, Clock } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import {
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";

interface NotificationCardProps {
  notification: Notification;
}

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const handleClick = async () => {
    const titleId =
      typeof notification.titleId === "object"
        ? notification.titleId._id
        : notification.titleId;
    if (titleId) {
      router.push(`/browse/${titleId}`);
    }
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(notification._id).unwrap();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification._id).unwrap();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    if (coverImage.startsWith("http")) {
      return coverImage;
    }

    return `${
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    }${coverImage}`;
    return `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    }${coverImage}`;
  };

  const getCoverImage = () => {
    if (
      typeof notification.titleId === "object" &&
      notification.titleId?.coverImage
    ) {
      return notification.titleId.coverImage;
    }
    return undefined;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "update":
        return "bg-blue-500";
      case "user":
        return "bg-green-500";
      case "system":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`w-full bg-card rounded-lg border transition-all duration-200 group cursor-pointer hover:shadow-md ${
        notification.isRead
          ? "border-border opacity-75"
          : "border-primary/50 bg-primary/5"
      }`}
      onClick={handleClick}
    >
      <div className="flex">
        {/* Индикатор типа и изображения */}
        <div className="flex flex-col items-center px-3 py-4">
          <div
            className={`w-2 h-2 rounded-full ${getTypeColor(
              notification.type
            )} mb-2`}
          />
          {getCoverImage() && !imageError && (
            <div className="relative w-8 h-12 rounded overflow-hidden">
              <Image
                src={getImageUrl(getCoverImage())}
                alt=""
                fill
                className="object-cover"
                sizes="32px"
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-sm mb-1 ${
                  notification.isRead
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {notification.title}
              </h3>
              <p
                className={`text-sm mb-2 line-clamp-2 ${
                  notification.isRead
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {notification.message}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(notification.createdAt).toLocaleString("ru-RU")}
                </span>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Отметить как прочитанное"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleRemove}
                className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Удалить уведомление"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
