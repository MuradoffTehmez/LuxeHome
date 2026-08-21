"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Ardıcıl elementlərdə pilləli görünmə üçün gecikmə (ms). */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
};

/**
 * Scroll zamanı elementi yumşaq şəkildə göstərir (fade + 12px yuxarı).
 * `prefers-reduced-motion` aktivdirsə CSS animasiyanı ləğv edir.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || revealed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      data-reveal-ready={ready ? "true" : "false"}
      data-revealed={revealed ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
