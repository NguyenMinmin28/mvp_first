"use client";

import { useEffect } from "react";

export function HashScrollOnLoad({ offset = 96 }: { offset?: number }) {
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;
    const id = hash.replace("#", "");
    // Force start at top, then smooth-scroll to target after paint
    // This avoids the browser's default instant anchor jump
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        // Find all cards in the grid to animate siblings
        const grid = el.parentElement?.parentElement;
        const cards = grid?.querySelectorAll<HTMLElement>("[data-benefit-card]") || [];

        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: "smooth" });

        // Apply gentle zoom + clear outline + strong shadow on the focused card
        (el as HTMLElement).classList.add("hash-zoom", "hash-pop", "hash-glow", "rounded-md");
        (el as HTMLElement).style.outline = "2px solid rgba(0,0,0,0.6)"; // black outline to match tone
        (el as HTMLElement).style.outlineOffset = "2px";
        // Dim siblings slightly
        cards.forEach((c) => {
          if (c !== el) c.classList.add("hash-dim");
        });

        // Revert after a moment
        setTimeout(() => {
          (el as HTMLElement).classList.remove("hash-zoom", "hash-pop", "hash-glow");
          (el as HTMLElement).style.outline = "";
          (el as HTMLElement).style.outlineOffset = "";
          cards.forEach((c) => c.classList.remove("hash-dim"));
        }, 1400);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [offset]);

  return null;
}


