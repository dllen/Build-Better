import { createContext, useContext } from "react";

interface FillViewportContextValue {
  /** Called by editor-style pages to request a no-page-scroll, viewport-filling layout. */
  setFillViewport: (enabled: boolean) => void;
}

/**
 * When a tool page fills the whole viewport (json.cn style split editor),
 * it registers here so the global Layout switches to `h-dvh overflow-hidden`
 * and hides the footer / ad slot — the page itself never scrolls,
 * only the editor panes scroll internally.
 */
export const FillViewportContext = createContext<FillViewportContextValue>({
  setFillViewport: () => {},
});

export function useFillViewport() {
  return useContext(FillViewportContext);
}
