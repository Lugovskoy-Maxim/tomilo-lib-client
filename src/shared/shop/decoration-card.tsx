"use client";

import { useState } from "react";
import { ShoppingBag, Check, Star } from "lucide-react";
import Image from "next/image";
import { Decoration } from "@/api/shop";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export interface DecorationCardProps {
  decoration: Decoration;
  isOwned?: boolean;
  isEquipped?: boolean;
  onPurchase?: (id: string) => void;
  onEquip?: (id: string) => void;
  onUnequip?: () => void;
  isLoading?: boolean;
}

export function DecorationCard({
  decoration,
  isOwned = false,
  isEquipped = false,
  onPurchase,
  onEquip,
  onUnequip,
  isLoading = false,
}: DecorationCardProps) {
  const { isAuthenticated } = useAuth();

  const { success, error: showError } = useToast();
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      showError("Необходимо войти в аккаунт для покупки");
      return;
    }

    try {
      await onPurchase?.(decoration.id);
      success(`"${decoration.name}" успешно куплено!`);
    } catch (error) {
      showError("Ошибка при покупке");
    }
  };

  const handleEquip = async () => {
    if (!isAuthenticated) {
      showError("Необходимо войти в аккаунт для экипировки");
      return;
    }

    try {
      await onEquip?.(decoration.id);
      success(`"${decoration.name}" надето!`);
    } catch (error) {
      showError("Ошибка при экипировке");
    }
  };

  const handleUnequip = async () => {
    if (!isAuthenticated) {
      showError("Необходимо войти в аккаунт");
      return;
    }

    try {
      await onUnequip?.();
      success(`"${decoration.name}" снято!`);
    } catch (error) {
      showError("Ошибка при снятии");
    }
  };

  const getActionButton = () => {
    if (!isAuthenticated) {
      return (
        <div className="text-center text-[var(--muted-foreground)] text-sm">
          Войдите в аккаунт для покупки
        </div>
      );
    }

    if (!isOwned) {
      return (
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Купить за {decoration.price}
            </>
          )}
        </button>
      );
    }

    if (isEquipped) {
      return (
        <button
          onClick={handleUnequip}
          disabled={isLoading}
          className="w-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 disabled:opacity-50 text-[var(--foreground)] px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-[var(--foreground)]/30 border-t-[var(--foreground)] rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Снять
            </>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={handleEquip}
        disabled={isLoading}
        className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Star className="w-4 h-4" />
            Надеть
          </>
        )}
      </button>
    );
  };

  const getTypeIcon = () => {
    switch (decoration.type) {
      case "avatar":
        return "👤";
      case "background":
        return "🖼️";
      case "card":
        return "🃏";
      default:
        return "🎨";
    }
  };

  return (
    <div className="bg-[var(--secondary)] rounded-lg overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all duration-200 group">
      {/* Изображение */}
      <div className="relative aspect-square overflow-hidden">
        {isImageLoading && (
          <div className="absolute inset-0 bg-[var(--muted)] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--muted-foreground)]/30 border-t-[var(--muted-foreground)] rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={decoration.imageUrl}
          alt={decoration.name}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-200 ${
            isImageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)}
        />

        {/* Статусы */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isEquipped && (
            <div className="bg-[var(--primary)] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Надето
            </div>
          )}
          {isOwned && !isEquipped && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Куплено
            </div>
          )}
        </div>

        {/* Тип */}
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
          {getTypeIcon()}
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-1">{decoration.name}</h3>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">
            {decoration.description}
          </p>
        </div>

        {/* Цена для не купленных */}
        {!isOwned && (
          <div className="mb-3">
            <span className="text-lg font-bold text-[var(--primary)]">
              {decoration.price} монет
            </span>
          </div>
        )}

        {/* Кнопка действия */}
        <div className="mt-auto">{getActionButton()}</div>
      </div>
    </div>
  );
}
