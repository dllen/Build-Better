import { useSearchParams } from "react-router-dom";

/**
 * Read/write the ?market= URL param (only used by Top 20 tools for local SEO).
 */
export function useMarketParam() {
  const [params, setParams] = useSearchParams();
  const market = params.get("market") || undefined;
  const setMarket = (code: string | undefined) => {
    const next = new URLSearchParams(params);
    if (code) next.set("market", code);
    else next.delete("market");
    setParams(next, { replace: true });
  };
  return { market, setMarket };
}
