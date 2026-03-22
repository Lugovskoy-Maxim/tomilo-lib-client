"use client";

import styles from "./GameResultReveal.module.css";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface GameResultRevealProps {
  open: boolean;
  title: string;
  subtitle?: string;
  tone?: "default" | "success" | "warning" | "danger";
  /** Иллюстрация над заголовком (например `/games/...`) */
  heroImage?: string;
  heroAlt?: string;
  onClose: () => void;
  children?: ReactNode;
}

export function GameResultReveal({
  open,
  title,
  subtitle,
  tone = "default",
  heroImage,
  heroAlt = "",
  onClose,
  children,
}: GameResultRevealProps) {
  if (!open) return null;

  return (
    <div className={styles["games-reveal-root"]}>
      <div className="games-reveal-overlay" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`games-reveal-card games-reveal-card--${tone}`}>
          <button
            type="button"
            className="games-reveal-close"
            onClick={onClose}
            aria-label="Закрыть окно результата"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
          <div className="games-reveal-badge" aria-hidden />
          {heroImage ? (
            <div className="games-reveal-hero">
              <img src={heroImage} alt={heroAlt} />
            </div>
          ) : null}
          <h3 className="games-reveal-title">{title}</h3>
          {subtitle ? <p className="games-reveal-subtitle">{subtitle}</p> : null}
          {children ? <div className="games-reveal-body">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
