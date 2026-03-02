"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--card)] border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--card)] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[var(--card)] border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[var(--card)] border-y-transparent border-l-transparent",
  };

  const handleMouseEnter = () => {
    if (trigger === "hover") setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") setIsVisible(false);
  };

  const handleClick = () => {
    if (trigger === "click") setIsVisible(!isVisible);
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`inline-flex items-center ${trigger === "click" ? "cursor-pointer" : ""}`}
      >
        {children || (
          showIcon && (
            <HelpCircle
              className={`w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ${iconClassName}`}
            />
          )
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}
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
      )}
    </div>
  );
}

export { Tooltip };
