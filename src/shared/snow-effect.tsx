"use client";

import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDelay: number;
  size: number;
}

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, so +1
    // Show snow in December (12) and January (1)
    setIsVisible(currentMonth === 12 || currentMonth === 1);


    if (isVisible) {

      const flakes: Snowflake[] = [];
      for (let i = 0; i < 30; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100,




          animationDelay: 0, // start immediately
          size: Math.random() * 4 + 2, // size between 2-6px
        });
      }
      setSnowflakes(flakes);
    }
  }, [isVisible]);

  if (!isVisible) return null;


  return (
    <div className="absolute inset-0 pointer-events-none h-full р-overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-[var(--primary)] opacity-70 animate-fall"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,

            animationDuration: `${Math.random() * 1 + 1.5}s`,
            animationDelay: `${flake.animationDelay}s`,
            animationIterationCount: "infinite",
          }}
        >
          ❄
        </div>
      ))}


      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100% + 50px));
            opacity: 0.7;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
