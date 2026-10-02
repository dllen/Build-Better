// Top 20 tools by SEO commercial intent. Review after 30 days with GSC data.
export const TOP_TOOLS = [
  "vat-calculator", "invoice-generator", "currency-calculator",
  "seller-profit-calculator", "marketplace-fee-calculator",
  "shipping-cost-calculator", "margin-calculator", "discount-calculator",
  "break-even-calculator", "tip-calculator", "size-converter",
  "product-cost-breakdown", "shipping-box-optimizer", "hs-code-lookup",
  "import-duty-calculator", "vat-reverse-calculator", "pph21-calculator",
  "sss-philhealth-pagibig", "repricing-tool", "ai-customer-reply",
] as const;
export type TopToolId = (typeof TOP_TOOLS)[number];
export function isTopTool(id: string): boolean {
  return (TOP_TOOLS as readonly string[]).includes(id);
}
