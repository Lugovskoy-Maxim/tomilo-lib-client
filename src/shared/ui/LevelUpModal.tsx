"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Sparkles, ArrowUp, X } from "lucide-react";
import { LevelUpEvent } from "@/types/progress";
import { getRankColor } from "@/lib/rank-utils";

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  type: "spark" | "confetti" | "star";
  rotation: number;
}

function generateFireworks(rankColor: string): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  const colors = [rankColor, "#FFD700", "#FF6B35", "#F7931E", "#FFCC00", "#FF4500", "#FFA500"];
  
  for (let i = 0; i < 60; i++) {
    const type = i < 20 ? "star" : i < 40 ? "spark" : "confetti";
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: type === "star" ? 16 + Math.random() * 12 : type === "spark" ? 6 + Math.random() * 8 : 8 + Math.random() * 6,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 2,
      type,
      rotation: Math.random() * 360,
    });
  }
  
  return particles;
}

interface LevelUpModalProps {
  event: LevelUpEvent | null;
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function LevelUpModal({ 
  event, 
  onClose, 
  autoCloseDelay = 8000 
}: LevelUpModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const newRankColor = event ? getRankColor(event.newRank.rank) : "#FFD700";
  const oldRankColor = event ? getRankColor(event.oldRank.rank) : "#FFD700";
  const isRankUp = event ? event.newRank.rank > event.oldRank.rank : false;

  const fireworks = useMemo(() => generateFireworks(newRankColor), [newRankColor]);

  useEffect(() => {
    if (!event) return;
    
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [event, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!event) return null;

  return (
    <AnimatePresence>
      {event && !isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        >
          {/* Fullscreen fireworks */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[99]">
            {fireworks.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.5],
                  rotate: particle.type === "confetti" ? [0, particle.rotation, particle.rotation * 2] : 0,
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: "easeOut",
                }}
                className="absolute"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {particle.type === "star" ? (
                  <Star
                    style={{ 
                      width: particle.size, 
                      height: particle.size, 
                      color: particle.color,
                      filter: `drop-shadow(0 0 ${particle.size / 2}px ${particle.color})`,
                    }}
                    fill={particle.color}
                  />
                ) : particle.type === "spark" ? (
                  <Sparkles
                    style={{ 
                      width: particle.size, 
                      height: particle.size, 
                      color: particle.color,
                      filter: `drop-shadow(0 0 ${particle.size / 3}px ${particle.color})`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: particle.size,
                      height: particle.size * 0.6,
                      backgroundColor: particle.color,
                      borderRadius: 2,
                      boxShadow: `0 0 ${particle.size / 2}px ${particle.color}`,
                    }}
                  />
                )}
              </motion.div>
            ))}
            
            {/* Radial burst effect - center glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0, 2, 3] }}
              transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, ${newRankColor} 0%, transparent 70%)`,
              }}
            />
          </div>

        <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1
            }}
            className="relative max-w-md w-full mx-4 p-8 rounded-3xl bg-gradient-to-b from-[var(--card)] to-[var(--background)] border border-[var(--border)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${newRankColor} 0%, transparent 70%)`,
              }}
            />

            {/* Inner sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: [`50%`, `${Math.random() * 100}%`],
                    y: [`50%`, `${Math.random() * 100}%`],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    delay: 0.5 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5 + Math.random(),
                  }}
                  className="absolute"
                  style={{
                    width: 8 + Math.random() * 8,
                    height: 8 + Math.random() * 8,
                  }}
                >
                  <Sparkles 
                    className="w-full h-full" 
                    style={{ color: i % 2 === 0 ? newRankColor : "#FFD700" }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--secondary)]/80 hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors z-10"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
                  <ArrowUp className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
                    Повышение уровня!
                  </span>
                </div>
              </motion.div>

              {/* Level transition */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center gap-4 mb-6"
              >
                {/* Old level */}
                <div className="text-center opacity-60">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2"
                    style={{ 
                      backgroundColor: `${oldRankColor}20`,
                      color: oldRankColor,
                    }}
                  >
                    {event.oldLevel}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Было</p>
                </div>

                {/* Arrow */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <ArrowUp className="w-8 h-8 text-amber-500 rotate-90" />
                </motion.div>

                {/* New level */}
                <motion.div 
                  className="text-center"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mb-2 shadow-lg"
                    style={{ 
                      backgroundColor: `${newRankColor}30`,
                      color: newRankColor,
                      boxShadow: `0 0 30px ${newRankColor}40`,
                    }}
                  >
                    {event.newLevel}
                  </div>
                  <p className="text-xs text-[var(--foreground)] font-medium">Стало</p>
                </motion.div>
              </motion.div>

              {/* Rank info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-6"
              >
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: `${newRankColor}15`,
                    border: `1px solid ${newRankColor}30`,
                  }}
                >
                  <Crown className="w-5 h-5" style={{ color: newRankColor }} />
                  <span 
                    className="font-bold"
                    style={{ color: newRankColor }}
                  >
                    {event.newRank.name}
                  </span>
                </div>
              </motion.div>

              {/* Stars */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex justify-center gap-1 mb-6"
              >
                {[...Array(9)].map((_, i) => {
                  const isFilled = i < event.newRank.stars;
                  const isNew = i >= event.oldRank.stars && i < event.newRank.stars;
                  
                  return (
                    <motion.div
                      key={i}
                      initial={isNew ? { scale: 0, rotate: -180 } : {}}
                      animate={isNew ? { scale: 1, rotate: 0 } : {}}
                      transition={{ 
                        delay: 1 + i * 0.1,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <Star
                        className={`w-5 h-5 ${isFilled ? "" : "opacity-30"}`}
                        fill={isFilled ? newRankColor : "transparent"}
                        style={{ color: newRankColor }}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Rank up message */}
              {isRankUp && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="mb-6 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                >
                  <p className="text-sm font-semibold text-purple-400">
                    Вы достигли нового ранга!
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {event.oldRank.name} → {event.newRank.name}
                  </p>
                </motion.div>
              )}

              {/* Close button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3 }}
                onClick={handleClose}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Отлично!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
