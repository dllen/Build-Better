import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { FileText, Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

interface LineItem { description: string; quantity: number; price: number }

export default function InvoiceGenerator() {
  const { t } = useTranslation();
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-8)}`);
  const [companyName, setCompanyName] = useState("");
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, price: 0 }]);
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [copied, setCopied] = useState(false);

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.price), 0);
  const discountAmt = subtotal * (parseFloat(discount) || 0) / 100;
  const taxBase = subtotal - discountAmt;
  const tax = taxBase * (parseFloat(taxRate) || 0) / 100;
  const total = taxBase + tax;

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const removeItem = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const generateText = () => {
    const lines = items.map(i => `${i.description}: ${i.quantity} × ${fmt(i.price)} = ${fmt(i.quantity * i.price)}`).join("\n");
    return `INVOICE ${invoiceNumber}\nDate: ${date}\nFrom: ${companyName}\nTo: ${clientName}\n\n${lines}\n\nSubtotal: ${fmt(subtotal)}\nDiscount (${discount}%): ${fmt(discountAmt)}\nTax (${taxRate}%): ${fmt(tax)}\nTOTAL: ${fmt(total)}`;
  };

  const copy = () => {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([generateText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resultNode = (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
          <div>
            <p className="font-bold text-base">{companyName || t("tools.invoice-generator.your_company")}</p>
            <p className="text-gray-500">{t("tools.invoice-generator.to")}: {clientName || t("tools.invoice-generator.client_name")}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold">{invoiceNumber}</p>
            <p className="text-gray-500">{date}</p>
          </div>
        </div>
        <div className="space-y-1 mb-3 text-xs">
          {items.map((i, idx) => (
            <div key={idx} className="flex justify-between"><span>{i.quantity} × {i.description || "—"}</span><span>{fmt(i.quantity * i.price)}</span></div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
          <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Discount ({discount}%)</span><span>-{fmt(discountAmt)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax ({taxRate}%)</span><span>{fmt(tax)}</span></div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300"><span>TOTAL</span><span>{fmt(total)}</span></div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.invoice-generator.copy")}
        </button>
        <button onClick={download} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          <Download className="h-4 w-4" />{t("tools.invoice-generator.download")}
        </button>
      </div>
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.invoice-generator.title")}
      subtitle={t("tools.invoice-generator.subtitle")}
      icon={FileText}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["invoice generator", "create invoice", "receipt generator", "billing"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder={t("tools.invoice-generator.invoice_number")} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        </div>
        <input placeholder={t("tools.invoice-generator.your_company")} value={companyName} onChange={e => setCompanyName(e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        <input placeholder={t("tools.invoice-generator.client_name")} value={clientName} onChange={e => setClientName(e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1">
              <input placeholder={t("tools.invoice-generator.item_desc")} value={item.description} onChange={e => updateItem(idx, "description", e.target.value)}
                className="col-span-6 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-2 border" />
              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                className="col-span-2 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-2 border" />
              <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                className="col-span-3 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-2 border" />
              <button onClick={() => removeItem(idx)} className="col-span-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">×</button>
            </div>
          ))}
        </div>
        <button onClick={() => setItems([...items, { description: "", quantity: 1, price: 0 }])}
          className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">+ {t("tools.invoice-generator.add_item")}</button>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.invoice-generator.tax_rate")} %</label>
            <input type="number" step="0.1" min="0" max="100" value={taxRate} onChange={e => setTaxRate(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.invoice-generator.discount")} %</label>
            <input type="number" step="0.1" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
