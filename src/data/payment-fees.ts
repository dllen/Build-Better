/**
 * Payment method fee data for PaymentFeeCalculator.
 * Rates are approximate and should be verified before production use.
 */

export interface PaymentMethod {
  id: string;
  name: string;
  nameLocal: string;           // Local language name
  market: string;              // Market tag
  ratePercent: number;          // Percentage fee (e.g., 2.9 = 2.9%)
  fixedUsd: number;             // Fixed fee in USD
  currency: string;            // Settlement currency
  notes?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  // ── International ──────────────────────────────────────────────────────
  {
    id: "visa_mastercard",
    name: "Visa / Mastercard",
    nameLocal: "Visa / Mastercard",
    market: "International",
    ratePercent: 2.9,
    fixedUsd: 0.30,
    currency: "USD",
    notes: "Standard card not-present rate",
  },
  {
    id: "paypal",
    name: "PayPal",
    nameLocal: "PayPal",
    market: "International",
    ratePercent: 3.5,
    fixedUsd: 0.49,
    currency: "USD",
  },
  {
    id: "stripe",
    name: "Stripe",
    nameLocal: "Stripe",
    market: "International",
    ratePercent: 2.9,
    fixedUsd: 0.30,
    currency: "USD",
  },
  {
    id: "square",
    name: "Square",
    nameLocal: "Square",
    market: "International",
    ratePercent: 2.6,
    fixedUsd: 0.10,
    currency: "USD",
  },

  // ── Middle East ────────────────────────────────────────────────────────
  {
    id: "mada",
    name: "mada",
    nameLocal: "معرّف",
    market: "Saudi Arabia",
    ratePercent: 1.5,
    fixedUsd: 0.06,
    currency: "SAR",
    notes: "Saudi Arabian payment network",
  },
  {
    id: "sadad",
    name: "SADAD",
    nameLocal: "سداد",
    market: "Saudi Arabia",
    ratePercent: 0,
    fixedUsd: 0,
    currency: "SAR",
    notes: "Bank transfer, no card fees",
  },
  {
    id: "knet",
    name: "KNET",
    nameLocal: "كي نت",
    market: "Kuwait",
    ratePercent: 0.75,
    fixedUsd: 0,
    currency: "KWD",
  },
  {
    id: "unionpay_uae",
    name: "China UnionPay",
    nameLocal: "中国银联",
    market: "UAE",
    ratePercent: 2.0,
    fixedUsd: 0,
    currency: "AED",
  },

  // ── Southeast Asia ──────────────────────────────────────────────────────
  {
    id: "ovo",
    name: "OVO",
    nameLocal: "OVO",
    market: "Indonesia",
    ratePercent: 1.5,
    fixedUsd: 0,
    currency: "IDR",
    notes: "E-wallet; merchant fee varies",
  },
  {
    id: "gopay",
    name: "GoPay",
    nameLocal: "GoPay",
    market: "Indonesia",
    ratePercent: 1.5,
    fixedUsd: 0,
    currency: "IDR",
  },
  {
    id: "dana",
    name: "DANA",
    nameLocal: "DANA",
    market: "Indonesia",
    ratePercent: 1.0,
    fixedUsd: 0,
    currency: "IDR",
  },
  {
    id: "gcash",
    name: "GCash",
    nameLocal: "GCash",
    market: "Philippines",
    ratePercent: 2.5,
    fixedUsd: 0,
    currency: "PHP",
  },
  {
    id: "pesonet",
    name: "PESONet",
    nameLocal: "PESONet",
    market: "Philippines",
    ratePercent: 0,
    fixedUsd: 0,
    currency: "PHP",
    notes: "Bank transfer, near-zero fee",
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    nameLocal: "ShopeePay",
    market: "Southeast Asia",
    ratePercent: 1.5,
    fixedUsd: 0,
    currency: "Multi",
  },

  // ── Latin America ──────────────────────────────────────────────────────
  {
    id: "pix",
    name: "Pix",
    nameLocal: "Pix",
    market: "Brazil",
    ratePercent: 0,
    fixedUsd: 0,
    currency: "BRL",
    notes: "Brazil's instant payment system — zero fee for consumers and most merchants",
  },
  {
    id: "mercadopago",
    name: "MercadoPago",
    nameLocal: "MercadoPago",
    market: "Brazil / Argentina",
    ratePercent: 4.99,
    fixedUsd: 0,
    currency: "BRL",
    notes: "Variable rate; approximately 4.99% for card",
  },
  {
    id: "oxxo",
    name: "OXXO",
    nameLocal: "OXXO",
    market: "Mexico",
    ratePercent: 2.5,
    fixedUsd: 0.30,
    currency: "MXN",
    notes: "Cash voucher; fee per transaction",
  },

  // ── Africa ─────────────────────────────────────────────────────────────
  {
    id: "mpesa",
    name: "M-Pesa",
    nameLocal: "M-Pesa",
    market: "Kenya",
    ratePercent: 1.5,
    fixedUsd: 0,
    currency: "KES",
    notes: "Lipa na M-Pesa; fees vary by amount",
  },
];

export type MarketFilter = "all" | "International" | "Saudi Arabia" | "UAE" |
  "Kuwait" | "Indonesia" | "Philippines" | "Southeast Asia" |
  "Brazil" | "Argentina" | "Mexico" | "Kenya";

export const MARKET_GROUPS: { label: string; value: MarketFilter }[] = [
  { label: "All Markets", value: "all" },
  { label: "🌍 International", value: "International" },
  { label: "🇸🇦 Saudi Arabia", value: "Saudi Arabia" },
  { label: "🇦🇪 UAE", value: "UAE" },
  { label: "🇰🇼 Kuwait", value: "Kuwait" },
  { label: "🇮🇩 Indonesia", value: "Indonesia" },
  { label: "🇵🇭 Philippines", value: "Philippines" },
  { label: "🌏 Southeast Asia", value: "Southeast Asia" },
  { label: "🇧🇷 Brazil", value: "Brazil" },
  { label: "🇲🇽 Mexico", value: "Mexico" },
  { label: "🇰🇪 Kenya", value: "Kenya" },
];
