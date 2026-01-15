"use client";

import React, { useState, useEffect } from "react";
import SnowCap from "./SnowCap";

interface SnowCapsGlobalProps {
  count?: number;
  className?: string;
  excludePositions?: string[];
  density?: "light" | "medium" | "heavy";
}

const densitySettings = {
  light: { min: 2, max: 4 },
  medium: { min: 4, max: 8 },
  heavy: { min: 8, max: 15 },
};

export default function SnowCapsGlobal({
  count = 6,
  className = "",
  excludePositions = [],
  density = "medium",
}: SnowCapsGlobalProps) {
  const densityConfig = densitySettings[density];
  const actualCount = Math.min(
    count,
    Math.max(densityConfig.min, Math.min(densityConfig.max, count)),
  );

  // Генерируем случайные данные заранее
  const snowCapConfigs = Array.from({ length: actualCount }, (_, index) => {
    const variants = ["small", "medium", "long", "long2", "small2", "smallRight"] as const;
    const positions = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "top-center",
      "bottom-center",
      "left",
      "right",
    ] as const;

    const variant = variants[Math.floor(Math.random() * variants.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const sizes = ["sm", "md", "lg"] as const;
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const opacity = 0.6 + Math.random() * 0.4;

    return {
      id: index,
      variant,
      position: excludePositions.includes(position) ? "top-right" : position,
      size,
      opacity,
    };
  });

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {snowCapConfigs.map(config => (
        <SnowCap
          key={config.id}
          variant={config.variant}
          position={config.position}
          size={config.size}
          opacity={config.opacity}
          zIndex={1}
          className="animate-float"
          style={{
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Компонент для конкретной страницы с настройками
interface PageSnowCapsProps {
  showOnMobile?: boolean;
  winterOnly?: boolean;
}

export function PageSnowCaps({ showOnMobile = true, winterOnly = false }: PageSnowCapsProps) {
  const [showSnow, setShowSnow] = useState(true);

  useEffect(() => {
    if (winterOnly) {
      const currentMonth = new Date().getMonth() + 1;
      setShowSnow(currentMonth === 12 || currentMonth === 1);
    }
  }, [winterOnly]);

  if (!showSnow) return null;

  return (
    <SnowCapsGlobal
      count={showOnMobile ? 4 : 8}
      density={showOnMobile ? "light" : "medium"}
      className={!showOnMobile ? "hidden md:block" : ""}
      excludePositions={showOnMobile ? ["bottom-center", "top-center"] : []}
    />
  );
}
