"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { useProgressNotification } from "@/contexts/ProgressNotificationContext";
import LevelUpModal from "./LevelUpModal";
import AchievementToast from "./AchievementToast";
import ExpGainToast from "./ExpGainToast";

export default function ProgressNotificationContainer() {
  const { 
    levelUpEvent, 
    achievementEvents, 
    expGainEvents,
    dismissLevelUp,
    dismissAchievement,
    dismissExpGain,
  } = useProgressNotification();

  return (
    <>
      {/* Level Up Modal - highest priority, fullscreen */}
      <LevelUpModal 
        event={levelUpEvent} 
        onClose={dismissLevelUp}
      />

      {/* Achievement and Exp toasts container */}
      <div
        className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-[90] flex flex-col gap-3 pointer-events-none max-w-[90vw] sm:max-w-[420px]"
        aria-live="polite"
        aria-label="Уведомления прогресса"
      >
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Achievement toasts */}
          <AnimatePresence mode="popLayout">
            {achievementEvents.map(event => (
              <AchievementToast
                key={event.id}
                event={event}
                onClose={() => dismissAchievement(event.id)}
              />
            ))}
          </AnimatePresence>

          {/* Exp gain toasts */}
          <AnimatePresence mode="popLayout">
            {expGainEvents.map(event => (
              <ExpGainToast
                key={event.id}
                event={event}
                onClose={() => dismissExpGain(event.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
