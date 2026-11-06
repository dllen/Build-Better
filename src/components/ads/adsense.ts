/**
 * Google AdSense loader and global ad kill switch.
 *
 * Ads are OFF by default. Set `VITE_ADS_ENABLED="true"` at build time (see
 * `.env`) to turn them back on.
 *
 * The AdSense script is injected lazily, only when an ad slot is about to be
 * filled (see the 2026-09-30 ad-monetization design doc §5.3). Prerendered
 * HTML and the initial page load therefore stay free of Google ad requests,
 * and while ads are paused no ad request is made at all.
 */

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

/** AdSense publisher ID, e.g. "ca-pub-123...". Empty when unset. */
export const ADSENSE_PUBLISHER_ID =
  (import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined)?.trim() ?? "";

/**
 * Master ad switch. Off unless explicitly enabled *and* a publisher ID exists,
 * so a missing or mistyped env var can never silently re-enable ads.
 */
export const ADS_ENABLED =
  import.meta.env.VITE_ADS_ENABLED === "true" && ADSENSE_PUBLISHER_ID !== "";

const SCRIPT_ID = "adsense-loader";

/** Inject the AdSense script once. No-op while ads are disabled. */
export function loadAdsenseScript(): void {
  if (!ADS_ENABLED || typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
  document.head.appendChild(script);
}
