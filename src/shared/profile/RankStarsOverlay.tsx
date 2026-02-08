"use client";

import { UserProfile } from "@/types/user";
import { levelToRank, getRankColor } from "@/lib/rank-utils";
import { useEffect, useState } from "react";

interface RankStarsOverlayProps {
  userProfile: UserProfile;
  size?: number;
}

export default function RankStarsOverlay({ userProfile, size = 144 }: RankStarsOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Get rank info from level
  const level = userProfile.level ?? 0;
  const rankInfo = levelToRank(level);
  const stars = rankInfo.stars;
  const rankColor = getRankColor(rankInfo.rank);

  // Don't render if no stars
  if (stars === 0) {
    return null;
  }

  // Calculate star positioning for arc above the avatar
  const starSize = 18;
  const radius = size / 2 + 18; // Wider arc (+10px)
  const centerX = size / 2 + (isMobile ? -12 : -5); // Mobile: -12px, Desktop: -5px (less shift)
  const centerY = size / 2 + 25; // Lower position (+15px total, moved down by 5px more)
  
  // Arc from left-top to right-top (180 to 360 degrees)
  const startAngle = Math.PI; // 180 degrees (left)
  const endAngle = 2 * Math.PI; // 360 degrees (right)
  const angleStep = stars > 1 ? (endAngle - startAngle) / (stars - 1) : 0;

  // Calculate positions for each star
  const starPositions = Array.from({ length: stars }, (_, index) => {
    const angle = stars === 1 ? 1.5 * Math.PI : startAngle + angleStep * index;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return { x, y };
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size / 2,
        top: -size / 4,
        left: 0,
      }}
    >
      {starPositions.map((pos, index) => (
        <div
          key={index}
          className="absolute flex items-center justify-center"
          style={{
            left: pos.x,
            top: pos.y,
            width: starSize + 4,
            height: starSize + 4,
            transform: "translate(-50%, -50%)",
            filter: `drop-shadow(0 0 8px ${rankColor}) drop-shadow(0 0 16px ${rankColor}80)`,
            animation: `star-pulse 2s ease-in-out ${index * 0.2}s infinite`,
          }}
        >
          <svg
            width={starSize + 4}
            height={starSize + 4}
            viewBox="0 0 24 24"
            fill="none"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}
          >
            <defs>
              <linearGradient id={`starGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor={rankColor} />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
              <filter id={`starGlow-${index}`}>
                <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#starGradient-${index})`}
              stroke="#FFF"
              strokeWidth="0.5"
              filter={`url(#starGlow-${index})`}
            />
          </svg>
        </div>
      ))}
      <style jsx>{`
        @keyframes star-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
