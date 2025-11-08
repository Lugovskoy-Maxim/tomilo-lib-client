"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, X, Clock } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface Notification {
  id: string;
  type: "update" | "user" | "system";
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
  titleId?: string;
  chapterNumber?: number;
  coverImage?: string;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onRemove
}: NotificationCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (notification.titleId) {
      router.push(`/browse/${notification.titleId}`);
    }
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(notification.id);
  };

  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;

    if (coverImage.startsWith('http')) {
      return coverImage;
    }

    return `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${coverImage}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'update':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      case 'system':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`w-full bg-card rounded-lg border transition-all duration-200 group cursor-pointer hover:shadow-md ${
        notification.isRead ? 'border-border opacity-75' : 'border-primary/50 bg-primary/5'
      }`}
      onClick={handleClick}
    >
      <div className="flex">
        {/* Индикатор типа и изображения */}
        <div className="flex flex-col items-center px-3 py-4">
          <div className={`w-2 h-2 rounded-full ${getTypeColor(notification.type)} mb-2`} />
          {notification.coverImage && !imageError && (
            <div className="relative w-8 h-12 rounded overflow-hidden">
              <Image
                src={getImageUrl(notification.coverImage)}
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
              <h3 className={`font-semibold text-sm mb-1 ${
                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {notification.title}
              </h3>
              <p className={`text-sm mb-2 line-clamp-2 ${
                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{notification.timeAgo}</span>
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
