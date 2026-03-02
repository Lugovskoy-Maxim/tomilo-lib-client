"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, Settings, Check, Loader2 } from "lucide-react";
import {
  useCheckTitleSubscriptionQuery,
  useSubscribeToTitleMutation,
  useUnsubscribeFromTitleMutation,
  useUpdateTitleSubscriptionMutation,
  useGetTitleSubscribersCountQuery,
} from "@/store/api/subscriptionsApi";
import { useAuth } from "@/hooks/useAuth";

interface SubscribeButtonProps {
  titleId: string;
  onLoginRequired?: () => void;
}

export function SubscribeButton({ titleId, onLoginRequired }: SubscribeButtonProps) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const { data: subscriptionData, isLoading: checkingSubscription } = useCheckTitleSubscriptionQuery(
    titleId,
    { skip: !user }
  );
  const { data: subscribersCount } = useGetTitleSubscribersCountQuery(titleId);

  const [subscribe, { isLoading: subscribing }] = useSubscribeToTitleMutation();
  const [unsubscribe, { isLoading: unsubscribing }] = useUnsubscribeFromTitleMutation();
  const [updateSubscription, { isLoading: updating }] = useUpdateTitleSubscriptionMutation();

  const isSubscribed = subscriptionData?.isSubscribed ?? false;
  const subscription = subscriptionData?.subscription;
  const isLoading = checkingSubscription || subscribing || unsubscribing || updating;

  const handleToggleSubscription = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    try {
      if (isSubscribed) {
        await unsubscribe(titleId).unwrap();
      } else {
        await subscribe({ titleId, notifyOnNewChapter: true, notifyOnAnnouncement: true }).unwrap();
      }
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  const handleUpdateSettings = async (key: "notifyOnNewChapter" | "notifyOnAnnouncement", value: boolean) => {
    if (!subscription) return;

    try {
      await updateSubscription({ titleId, [key]: value }).unwrap();
    } catch (error) {
      console.error("Update subscription error:", error);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleSubscription}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
            isSubscribed
              ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              : "bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <BellRing className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSubscribed ? "Подписка" : "Подписаться"}
          </span>
          {typeof subscribersCount === "number" && subscribersCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isSubscribed
                ? "bg-white/20"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}>
              {subscribersCount > 999 ? `${(subscribersCount / 1000).toFixed(1)}k` : subscribersCount}
            </span>
          )}
        </button>

        {isSubscribed && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl bg-[var(--secondary)]/80 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSettings && isSubscribed && subscription && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSettings(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--card)] rounded-xl p-4 z-50 shadow-2xl border border-[var(--border)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-[var(--foreground)]">Настройки уведомлений</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)]"
              >
                <BellOff className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-[var(--secondary)]/50 rounded-lg cursor-pointer hover:bg-[var(--secondary)]/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">Новые главы</span>
                    <p className="text-xs text-[var(--muted-foreground)]">Уведомлять о выходе глав</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateSettings("notifyOnNewChapter", !subscription.notifyOnNewChapter)}
                  disabled={updating}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    subscription.notifyOnNewChapter
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    subscription.notifyOnNewChapter ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </label>

              <label className="flex items-center justify-between p-3 bg-[var(--secondary)]/50 rounded-lg cursor-pointer hover:bg-[var(--secondary)]/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <BellRing className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">Анонсы</span>
                    <p className="text-xs text-[var(--muted-foreground)]">Важные объявления</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateSettings("notifyOnAnnouncement", !subscription.notifyOnAnnouncement)}
                  disabled={updating}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    subscription.notifyOnAnnouncement
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    subscription.notifyOnAnnouncement ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </label>
            </div>

            <button
              onClick={handleToggleSubscription}
              disabled={isLoading}
              className="w-full mt-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <BellOff className="w-4 h-4" />
              Отписаться
            </button>
          </div>
        </>
      )}
    </div>
  );
}
