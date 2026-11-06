import { useEffect, useRef, useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID, loadAdsenseScript } from "./adsense";

/**
 * Lazy-loaded Google AdSense ad slot.
 *
 * - Ads are globally paused unless `VITE_ADS_ENABLED="true"` (see `adsense.ts`).
 *   While paused this renders an empty, hidden placeholder and never requests
 *   Google's ad script.
 * - Defers the AdSense script load until the slot scrolls into view and the
 *   visitor has accepted cookies (saves ~30 KB JS on initial page load and
 *   keeps prerendered HTML clean).
 * - Skips rendering for bots.
 * - Honors a `data-adtest` opt-in via the `test` prop (only use during review).
 */

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

const IS_BOT =
  typeof navigator !== "undefined" &&
  /(bot|spider|crawl|preview|facebookexternalhit|slack|lighthouse|pagespeed)/i.test(
    navigator.userAgent
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
  const { consent } = useCookieConsent();

  // Lazy: only start loading the ad when the slot is within 200px of viewport.
  useEffect(() => {
    if (!ADS_ENABLED || IS_BOT) return;
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
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load the script and queue the slot once it is visible and consent is given.
  useEffect(() => {
    if (!ADS_ENABLED || !shouldLoad || pushed || IS_BOT || consent !== true) {
      return;
    }
    if (typeof window === "undefined") return;
    loadAdsenseScript();
    window.adsbygoogle = window.adsbygoogle || [];
    try {
      window.adsbygoogle.push({});
      setPushed(true);
    } catch (err) {
      console.warn("[AdSlot] push failed:", err);
    }
  }, [shouldLoad, pushed, consent]);

  if (!ADS_ENABLED || IS_BOT || consent !== true) {
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
        data-ad-client={ADSENSE_PUBLISHER_ID}
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
