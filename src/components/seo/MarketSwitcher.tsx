import React from "react";
import { Globe } from "lucide-react";
import { useMarketParam } from "@/hooks/useMarketParam";
import { MARKET_DATA, SUPPORTED_MARKETS } from "@/data/market-data";

interface Props {
  /** Optional subset — e.g., tools not yet supporting all markets */
  availableMarkets?: string[];
}

export function MarketSwitcher({ availableMarkets }: Props) {
  const { market, setMarket } = useMarketParam();
  const codes = availableMarkets ?? SUPPORTED_MARKETS;
  return (
    <div className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded-md px-2 py-1 bg-white">
      <Globe className="h-3.5 w-3.5 text-gray-500" />
      <span className="text-gray-500 text-xs">Region:</span>
      <select
        value={market || ""}
        onChange={e => setMarket(e.target.value || undefined)}
        className="bg-transparent text-sm outline-none cursor-pointer"
      >
        <option value="">General</option>
        {codes.map(code => (
          <option key={code} value={code}>{MARKET_DATA[code]?.name}</option>
        ))}
      </select>
    </div>
  );
}
