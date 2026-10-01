import { useEffect, useRef, useState } from "react";

/**
 * Lazy-loaded Google AdSense ad slot.
 *
 * - Defers AdSense script load until the slot scrolls into view
 *   (saves ~30 KB JS on initial page load; Core Web Vitals).
 * - Skips rendering entirely in dev (no VITE_ADSENSE_PUBLISHER_ID)
 *   or when the user-agent is a bot (avoids empty ad fills).
 * - Honors a `data-adbreak-test` opt-in via the `test` prop (only
 *   use during AdSense review).
 */

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export interface AdSlotProps {
  /** AdSense ad slot ID; defaults to empty for auto ads. */
  slot?: string;
  /** Layout key (e.g. "tool-bottom"). */
  layoutKey?: string;
  /** "auto" lets AdSense decide; "rectangle"/"horizontal" etc. for explicit. */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  /** Reserve a minimum height so CLS stays 0. */
  minHeight?: number;
  /** Set to true while AdSense is reviewing (test ads). */
  test?: boolean;
  /** Optional className for outer wrapper. */
  className?: string;
}

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as
  | string
  | undefined;
const IS_BOT =
  typeof navigator !== "undefined" &&
  /(bot|spider|crawl|preview|facebookexternalhit|slack|lighthouse|pagespeed)/i.test(
    navigator.userAgent,
  );

export function AdSlot({
  slot = "",
  layoutKey,
  format = "auto",
  minHeight = 90,
  test = false,
  className,
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [pushed, setPushed] = useState(false);

  // Lazy: only start loading the ad when the slot is within 200px of viewport.
  useEffect(() => {
    if (!PUBLISHER_ID || IS_BOT) return;
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Push to adsbygoogle queue once the script tag has parsed.
  useEffect(() => {
    if (!shouldLoad || pushed) return;
    if (typeof window === "undefined") return;
    window.adsbygoogle = window.adsbygoogle || [];
    try {
      window.adsbygoogle.push({});
      setPushed(true);
    } catch (err) {
      console.warn("[AdSlot] push failed:", err);
    }
  }, [shouldLoad, pushed]);

  if (!PUBLISHER_ID || IS_BOT) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ minHeight, display: "none" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ minHeight }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot || undefined}
        data-ad-layout-key={layoutKey || undefined}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
        data-adtest={test ? "on" : undefined}
      />
    </div>
  );
}

export default AdSlot;
