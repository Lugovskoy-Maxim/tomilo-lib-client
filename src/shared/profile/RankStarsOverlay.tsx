"use client";

import { UserProfile } from "@/types/user";
import { levelToRank, getRankColor } from "@/lib/rank-utils";

interface RankStarsOverlayProps {
  userProfile: UserProfile;
  size?: number;
}

export default function RankStarsOverlay({ userProfile, size = 136 }: RankStarsOverlayProps) {
  // Get rank info from level
  const level = userProfile.level ?? 0;
  const rankInfo = levelToRank(level);
  const stars = rankInfo.stars;
  const rankColor = getRankColor(rankInfo.rank);

  // Don't render if no stars
  if (stars === 0) {
    return null;
  }

  // Calculate star positioning for 180-degree semi-circle
  // Stars positioned above the avatar center (negative Y values)
  const starSize = 20; // Size of each star in pixels
  const radius = size / 2 + 15; // Radius of the semi-circle (slightly larger than avatar)
  const centerX = size / 2;
  const centerY = size / 2;
  const startAngle = Math.PI; // Start from left (180 degrees)
  const endAngle = 2 * Math.PI; // End at right (0 degrees)
  const angleStep = (endAngle - startAngle) / (stars - 1 || 1);

  // Calculate positions for each star (only upper half of circle)
  const starPositions = Array.from({ length: stars }, (_, index) => {
    const angle = startAngle + angleStep * index;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Calculate rotation angle for the star (pointing towards center)
    const rotation = (angle * 180) / Math.PI + 90; // Convert to degrees and add 90 for downward point

    return { x, y, rotation };
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        top: 0,
        left: 0,
      }}
    >
      {starPositions.map((pos, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            color: rankColor,
            fontSize: `${starSize}px`,
            textShadow: "0 0 4px rgba(0,0,0,0.5)",
            transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
          }}
        >
          ★
        </div>
      ))}
    </div>
  );
}
