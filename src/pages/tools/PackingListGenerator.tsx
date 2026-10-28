import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { ListChecks, Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Line { id: number; description: string; quantity: number; unitPrice: number; hsCode: string; }

export default function PackingListGenerator() {
  const { t } = useTranslation();
  const [invoiceNo, setInvoiceNo] = useState(`PL-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [shipper, setShipper] = useState("");
  const [consignee, setConsignee] = useState("");
  const [lines, setLines] = useState<Line[]>([{ id: 1, description: "", quantity: 1, unitPrice: 0, hsCode: "" }]);
  const [copied, setCopied] = useState(false);

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalValue = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const update = (id: number, field: keyof Line, val: string | number) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: val } : l));
  };
  const add = () => setLines([...lines, { id: Date.now(), description: "", quantity: 1, unitPrice: 0, hsCode: "" }]);
  const remove = (id: number) => lines.length > 1 && setLines(lines.filter(l => l.id !== id));

  const text = `PACKING LIST ${invoiceNo}\nDate: ${date}\nShipper: ${shipper}\nConsignee: ${consignee}\n\nItems:\n${lines.map((l, i) => `${i + 1}. ${l.description || "—"} | Qty: ${l.quantity} | Unit: $${l.unitPrice} | HS: ${l.hsCode || "N/A"}`).join("\n")}\n\nTotal Qty: ${totalQty}\nTotal Value: $${totalValue.toFixed(2)}`;

  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${invoiceNo}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const resultNode = (
    <div className="space-y-3">
      <div className="bg-muted p-3 rounded-lg text-sm">
        <div className="border-b border-border pb-2 mb-2">
          <p className="font-mono font-bold">{invoiceNo}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="space-y-1 mb-2 text-xs">
          {lines.map((l, i) => (
            <div key={l.id} className="flex justify-between">
              <span>{i + 1}. {l.description || "—"} ({l.quantity}×${l.unitPrice})</span>
              <span>{fmt(l.quantity * l.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span>Total: {totalQty} items</span>
          <span>{fmt(totalValue)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm">
          <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.packing-list.copy")}
        </button>
        <button onClick={download} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-success text-success-foreground rounded-lg hover:bg-success text-sm">
          <Download className="h-4 w-4" />{t("tools.packing-list.download")}
        </button>
      </div>
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.packing-list.title")}
      subtitle={t("tools.packing-list.subtitle")}
      icon={ListChecks}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["packing list", "cross-border shipping", "export document", "invoice"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="PL #" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        </div>
        <input placeholder={t("tools.packing-list.shipper")} value={shipper} onChange={e => setShipper(e.target.value)} className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        <input placeholder={t("tools.packing-list.consignee")} value={consignee} onChange={e => setConsignee(e.target.value)} className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {lines.map(l => (
            <div key={l.id} className="grid grid-cols-12 gap-1">
              <input placeholder={t("tools.packing-list.desc")} value={l.description} onChange={e => update(l.id, "description", e.target.value)} className="col-span-5 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-1 px-2 border" />
              <input type="number" min="1" value={l.quantity} onChange={e => update(l.id, "quantity", +e.target.value)} className="col-span-2 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-1 px-2 border" />
              <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={e => update(l.id, "unitPrice", +e.target.value)} className="col-span-2 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-1 px-2 border" />
              <input placeholder="HS" value={l.hsCode} onChange={e => update(l.id, "hsCode", e.target.value)} className="col-span-2 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-1 px-2 border" />
              <button onClick={() => remove(l.id)} className="col-span-1 px-1 py-1 bg-destructive/10 text-destructive rounded text-xs">×</button>
            </div>
          ))}
        </div>
        <button onClick={add} className="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-border text-sm">+ {t("tools.packing-list.add_item")}</button>
      </div>
    </CalculatorShell>
  );
}
