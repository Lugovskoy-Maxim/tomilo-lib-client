"use client";

import { useState, useEffect } from "react";
import Image from "next/image";


interface SnowCapProps {
  variant?: "small" | "medium" | "long" | "long2" | "small2" | "smallRight";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center" | "left" | "right";
  className?: string;
  opacity?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  zIndex?: number;
  style?: React.CSSProperties;
}

const snowCapImages = {
  small: "/snow_cap/snow_cap_small.png",
  medium: "/snow_cap/smal_cap_medium.png",
  long: "/snow_cap/snow_cap_long.png",
  long2: "/snow_cap/snow_cap_long_2.png",
  small2: "/snow_cap/snow_cap_small_2.png",
  smallRight: "/snow_cap/snow_cap_small_right.png",
};

const sizeClasses = {
  xs: "w-12 h-8",
  sm: "w-16 h-12", 
  md: "w-24 h-16",
  lg: "w-32 h-20",
  xl: "w-48 h-32",
};

const positionClasses = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "left": "left-0 top-1/2 -translate-y-1/2",
  "right": "right-0 top-1/2 -translate-y-1/2",
};


export default function SnowCap({
  variant = "small",
  position = "top-right",
  className = "",
  opacity = 0.8,
  size = "md",
  zIndex = 10,
  style,
}: SnowCapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(snowCapImages[variant]);

  useEffect(() => {
    setImageSrc(snowCapImages[variant]);
  }, [variant]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    console.warn(`Failed to load snow cap image: ${imageSrc}`);
    setIsLoaded(true); // Still show the container even if image fails
  };


  return (
    <div
      className={`absolute pointer-events-none select-none ${positionClasses[position]} ${className}`}
      style={{ zIndex, ...style }}
    >
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src={imageSrc}
          alt="Snow cap decoration"
          fill
          className={`object-contain transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ opacity }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes={`${sizeClasses[size]}`}
          priority={false}
        />
        {!isLoaded && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded"
            style={{ opacity: opacity * 0.3 }}
          />
        )}
      </div>
    </div>
  );
}



// Хук для случайного выбора варианта сугроба
export function useRandomSnowCap() {
  const [variant, setVariant] = useState<keyof typeof snowCapImages>("small");
  const [position, setPosition] = useState<keyof typeof positionClasses>("top-right");

  useEffect(() => {
    const variants = Object.keys(snowCapImages) as Array<keyof typeof snowCapImages>;
    const positions = Object.keys(positionClasses) as Array<keyof typeof positionClasses>;
    
    setVariant(variants[Math.floor(Math.random() * variants.length)]);
    setPosition(positions[Math.floor(Math.random() * positions.length)]);
  }, []);

  return { variant, position };
}
