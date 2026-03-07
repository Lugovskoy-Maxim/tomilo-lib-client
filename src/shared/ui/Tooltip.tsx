"use client";
import { useState, useRef, useEffect, useLayoutEffect, ReactNode, useCallback } from "react";
import { HelpCircle } from "lucide-react";

const GAP = 8;

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  trigger?: "hover" | "click";
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  iconClassName = "",
  showIcon = true,
  trigger = "hover",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!triggerEl || !tooltipEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    let top = 0;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - GAP;
        break;
      case "bottom":
        top = rect.bottom + GAP;
        break;
      case "left":
        left = rect.left - tooltipRect.width - GAP;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case "right":
        left = rect.right + GAP;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
    }
    setCoords({ top, left });
  }, [position]);

  useLayoutEffect(() => {
    if (!isVisible) {
      setCoords(null);
      return;
    }
    const raf = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(raf);
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (!isVisible || typeof document === "undefined") return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return clearHideTimeout;
  }, [clearHideTimeout]);

  useEffect(() => {
    if (trigger === "click" && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tooltipRef.current &&
          !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsVisible(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [trigger, isVisible]);

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--card)] border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--card)] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[var(--card)] border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[var(--card)] border-y-transparent border-l-transparent",
  };

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      clearHideTimeout();
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      clearHideTimeout();
      hideTimeoutRef.current = setTimeout(() => {
        hideTimeoutRef.current = null;
        setIsVisible(false);
        setCoords(null);
      }, 120);
    }
  };

  const handleClick = () => {
    if (trigger === "click") setIsVisible(!isVisible);
  };

  const tooltipContent =
    isVisible && typeof document !== "undefined" ? (
      <div
        ref={tooltipRef}
        className="fixed z-[9999] animate-fade-in"
        style={
          coords
            ? { top: coords.top, left: coords.left }
            : { visibility: "hidden" as const, top: 0, left: 0 }
        }
        onMouseEnter={trigger === "hover" ? handleMouseEnter : undefined}
        onMouseLeave={trigger === "hover" ? handleMouseLeave : undefined}
      >
        <div
          className={`px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-w-xs ${className}`}
        >
          {content}
        </div>
        <div
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
        />
      </div>
    ) : null;

  return (
    <>
      <div className="relative inline-flex items-center">
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className={`inline-flex items-center ${trigger === "click" ? "cursor-pointer" : ""}`}
        >
          {children ||
            (showIcon && (
              <HelpCircle
                className={`w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ${iconClassName}`}
              />
            ))}
        </div>
      </div>
      {tooltipContent}
    </>
  );
}

export { Tooltip };
