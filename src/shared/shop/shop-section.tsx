"use client";

import { useState, useEffect } from "react";
import { Decoration } from "@/api/shop";
import {
  getDecorationsByType,
  getUserDecorations,
  purchaseDecoration,
  equipDecoration,
  unequipDecoration,
} from "@/api/shop";
import { DecorationCard } from "./decoration-card";
import { useAuth } from "@/hooks/useAuth";

interface ShopSectionProps {
  type: "avatar" | "background" | "card";
}

interface UserDecorations {
  owned: string[];
  equipped: string[];
}

export function ShopSection({ type }: ShopSectionProps) {
  const { isAuthenticated } = useAuth();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [userDecorations, setUserDecorations] = useState<UserDecorations>({
    owned: [],
    equipped: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Загрузка украшений
  const loadDecorations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getDecorationsByType(type);

      if (response.success && response.data) {
        setDecorations(response.data);
      } else {
        setError(response.message || "Ошибка при загрузке товаров");
      }
    } catch (err) {
      setError("Ошибка при загрузке товаров");
      console.error("Error loading decorations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка пользовательских украшений
  const loadUserDecorations = async () => {
    if (!isAuthenticated) {
      setUserDecorations({ owned: [], equipped: [] });
      return;
    }

    try {
      const response = await getUserDecorations();

      if (response.success && response.data) {
        // Предполагаем, что API возвращает owned и equipped отдельно
        // Если нет, то все украшения в data будут owned
        setUserDecorations({
          owned: response.data.map(d => d.id),
          equipped: response.data.filter(d => d.isEquipped).map(d => d.id),
        });
      }
    } catch (err) {
      console.error("Error loading user decorations:", err);
    }
  };

  // Загрузка данных при изменении типа или аутентификации
  useEffect(() => {
    loadDecorations();
  }, [type]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDecorations();
    } else {
      setUserDecorations({ owned: [], equipped: [] });
    }
  }, [isAuthenticated]);

  // Обработчик покупки
  const handlePurchase = async (decorationId: string) => {
    setActionLoading(decorationId);
    try {
      const response = await purchaseDecoration(type, decorationId);

      if (response.success) {
        // Добавляем в owned
        setUserDecorations(prev => ({
          ...prev,
          owned: [...prev.owned, decorationId],
        }));

        // Перезагружаем пользовательские данные
        if (isAuthenticated) {
          await loadUserDecorations();
        }
      } else {
        throw new Error(response.message || "Ошибка при покупке");
      }
    } catch (err) {
      throw err; // Перебрасываем ошибку для обработки в компоненте
    } finally {
      setActionLoading(null);
    }
  };

  // Обработчик экипировки
  const handleEquip = async (decorationId: string) => {
    setActionLoading(decorationId);
    try {
      const response = await equipDecoration(type, decorationId);

      if (response.success) {
        // Добавляем в equipped
        setUserDecorations(prev => ({
          ...prev,
          equipped: [...prev.equipped.filter(id => id !== decorationId), decorationId],
        }));
      } else {
        throw new Error(response.message || "Ошибка при экипировке");
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  // Обработчик снятия
  const handleUnequip = async () => {
    setActionLoading("unequip");
    try {
      const response = await unequipDecoration(type);

      if (response.success) {
        // Убираем из equipped
        setUserDecorations(prev => ({
          ...prev,
          equipped: [],
        }));
      } else {
        throw new Error(response.message || "Ошибка при снятии");
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case "avatar":
        return "Аватары";
      case "background":
        return "Фоны";
      case "card":
        return "Карточки";
      default:
        return "Товары";
    }
  };

  const getTypeDescription = () => {
    switch (type) {
      case "avatar":
        return "Украсьте свой профиль стильными аватарами";
      case "background":
        return "Выберите красивый фон для своего профиля";
      case "card":
        return "Персонализируйте свои карточки с уникальными дизайнами";
      default:
        return "Выберите товары для украшения профиля";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-6 max-w-md mx-auto">
          <p className="text-[var(--foreground)] mb-4">{error}</p>
          <button
            onClick={loadDecorations}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)] text-lg mb-2">Нет доступных товаров</p>
        <p className="text-[var(--muted-foreground)]">
          Попробуйте позже или выберите другую категорию
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок секции */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">{getTypeTitle()}</h2>
        <p className="text-[var(--muted-foreground)]">{getTypeDescription()}</p>
      </div>

      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {decorations.map(decoration => (
          <DecorationCard
            key={decoration.id}
            decoration={decoration}
            isOwned={userDecorations.owned.includes(decoration.id)}
            isEquipped={userDecorations.equipped.includes(decoration.id)}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            isLoading={actionLoading === decoration.id}
          />
        ))}
      </div>

      {/* Информация о пустой коллекции */}
      {!isAuthenticated && (
        <div className="mt-8 text-center">
          <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-[var(--muted-foreground)] mb-2">
              Войдите в аккаунт, чтобы покупать и использовать товары
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
