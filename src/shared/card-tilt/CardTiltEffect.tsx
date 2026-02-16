"use client";

import { useEffect } from "react";

const CARD_SELECTOR = ".card-hover-soft";
const MAX_TILT_DEG = 12;
const HOVER_SCALE = 1.06;

export default function CardTiltEffect() {
  useEffect(() => {
    const canUseTilt =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canUseTilt) return;

    let activeCard: HTMLElement | null = null;
    let rafId: number | null = null;
    let nextClientX = 0;
    let nextClientY = 0;

    const resetCard = (card: HTMLElement) => {
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      card.style.setProperty("--card-tilt-scale", "1");
    };

    const applyTilt = () => {
      rafId = null;
      if (!activeCard) return;

      const rect = activeCard.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = (nextClientX - rect.left) / rect.width - 0.5;
      const py = (nextClientY - rect.top) / rect.height - 0.5;

      const rotateY = px * MAX_TILT_DEG;
      const rotateX = -py * MAX_TILT_DEG;

      activeCard.style.setProperty("--card-tilt-x", `${rotateX.toFixed(2)}deg`);
      activeCard.style.setProperty("--card-tilt-y", `${rotateY.toFixed(2)}deg`);
      activeCard.style.setProperty("--card-tilt-scale", `${HOVER_SCALE}`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const card = (event.target as Element)?.closest(CARD_SELECTOR) as HTMLElement | null;

      if (card !== activeCard) {
        if (activeCard) resetCard(activeCard);
        activeCard = card;
      }

      if (!activeCard) return;

      nextClientX = event.clientX;
      nextClientY = event.clientY;

      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyTilt);
      }
    };

    const onPointerOut = (event: PointerEvent) => {
      const fromCard = (event.target as Element)?.closest(CARD_SELECTOR) as HTMLElement | null;
      if (!fromCard) return;

      const toCard = (event.relatedTarget as Element | null)?.closest(CARD_SELECTOR) as
        | HTMLElement
        | null;

      if (fromCard !== toCard) {
        resetCard(fromCard);
        if (fromCard === activeCard) activeCard = null;
      }
    };

    const onWindowBlur = () => {
      if (activeCard) resetCard(activeCard);
      activeCard = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true, capture: true });
    window.addEventListener("blur", onWindowBlur);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (activeCard) resetCard(activeCard);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut, true);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  return null;
}
