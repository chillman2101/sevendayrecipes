"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function useMobileInputFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const keepVisible = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });

      const viewport = window.visualViewport;
      if (!viewport) return;

      const rect = el.getBoundingClientRect();
      const visibleBottom = viewport.height - 16;
      if (rect.bottom > visibleBottom) {
        window.scrollBy({ top: rect.bottom - visibleBottom + 24, behavior: "smooth" });
      }
    };

    run();
    if (isMobileDevice()) {
      window.setTimeout(run, 300);
      window.setTimeout(run, 600);
    }
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      const el = ref.current;
      if (!el || document.activeElement !== el) return;
      keepVisible();
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);
    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, [keepVisible]);

  return { ref, onFocus: keepVisible };
}

export function useKeyboardPadding(): number {
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      setPadding(keyboardHeight > 120 ? Math.min(keyboardHeight * 0.5, 280) : 0);
    };

    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, []);

  return padding;
}
