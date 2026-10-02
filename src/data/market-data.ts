export interface MarketInfo {
  code: string;
  name: string;
  vat_rate: number;
  currency: string;
  regulator: string;
}

export const MARKET_DATA: Record<string, MarketInfo> = {
  sa: { code: "sa", name: "Saudi Arabia", vat_rate: 15, currency: "SAR", regulator: "ZATCA" },
  ae: { code: "ae", name: "UAE", vat_rate: 5, currency: "AED", regulator: "FTA" },
  ph: { code: "ph", name: "Philippines", vat_rate: 12, currency: "PHP", regulator: "BIR" },
  id: { code: "id", name: "Indonesia", vat_rate: 11, currency: "IDR", regulator: "DJP" },
  vn: { code: "vn", name: "Vietnam", vat_rate: 10, currency: "VND", regulator: "GDT" },
  th: { code: "th", name: "Thailand", vat_rate: 7, currency: "THB", regulator: "RD" },
  br: { code: "br", name: "Brazil", vat_rate: 17, currency: "BRL", regulator: "RFB" },
  ke: { code: "ke", name: "Kenya", vat_rate: 16, currency: "KES", regulator: "KRA" },
};

export function getMarketData(code: string): MarketInfo | undefined {
  return MARKET_DATA[code];
}

export const SUPPORTED_MARKETS = Object.keys(MARKET_DATA);
