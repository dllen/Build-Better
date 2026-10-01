import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Package, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

// Common box sizes (cm) with weight capacity
const BOXES = [
  { name: "XS", l: 20, w: 15, h: 8, maxW: 2, cost: 1.5 },
  { name: "S", l: 30, w: 20, h: 15, maxW: 5, cost: 2.5 },
  { name: "M", l: 40, w: 30, h: 20, maxW: 10, cost: 4.0 },
  { name: "L", l: 50, w: 40, h: 30, maxW: 20, cost: 6.0 },
  { name: "XL", l: 60, w: 45, h: 40, maxW: 30, cost: 8.5 },
];

const ITEMS_KEY = "shipping_items";

export default function ShippingBoxOptimizer() {
  const { t } = useTranslation();
  const [items, setItems] = useState<{ id: number; l: number; w: number; h: number; weight: number; qty: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]"); } catch { return []; }
  });
  const [result, setResult] = useState<{ totalCost: number; totalWeight: number; boxesUsed: { box: typeof BOXES[number] | null; items: { l: number; w: number; h: number; weight: number; qty: number }[] }[] } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    if (items.length === 0) { setResult(null); return; }

    // Simple FFDH bin packing: sort items by volume desc, fit into first box that accommodates
    const sorted = [...items].sort((a, b) => (b.l * b.w * b.h * b.qty) - (a.l * a.w * a.h * b.qty));
    const packed: { box: typeof BOXES[number] | null; items: { l: number; w: number; h: number; weight: number; qty: number }[] }[] = [];
    let idx = 0;
    while (idx < sorted.length) {
      const item = sorted[idx];
      const box = BOXES.find(b =>
        b.l >= item.l && b.w >= item.w && b.h >= item.h &&
        b.maxW >= item.weight
      );
      if (box) {
        packed.push({ box, items: [{ ...item, qty: 1 }] });
        if (item.qty > 1) sorted.push({ ...item, qty: item.qty - 1 });
        idx++;
      } else {
        // Item too big for all boxes
        packed.push({ box: null, items: [{ ...item, qty: 1 }] });
        if (item.qty > 1) sorted.push({ ...item, qty: item.qty - 1 });
        idx++;
      }
    }

    const totalCost = packed.filter(p => p.box).reduce((s, p) => s + (p.box?.cost ?? 0), 0);
    const totalWeight = packed.reduce((s, p) => s + p.items.reduce((w, i) => w + i.weight, 0), 0);
    setResult({ totalCost, totalWeight, boxesUsed: packed });
  }, [items]);

  const addItem = () => setItems([...items, { id: Date.now(), l: 10, w: 10, h: 10, weight: 1, qty: 1 }]);
  const removeItem = (id: number) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: number, field: string, value: number) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const copy = () => {
    if (!result) return;
    const lines = result.boxesUsed.map(p => p.box ? `${p.box.name} box: ${fmt(p.box.cost)}` : "No box fits").join("\n");
    navigator.clipboard.writeText(`${lines}\nTotal: ${fmt(result.totalCost)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.shipping-box.total_cost")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(result.totalCost)}</p>
            <p className="text-xs text-gray-500 mt-1">{result.boxesUsed.length} {t("tools.shipping-box.boxes_used")} · {result.totalWeight.toFixed(1)}kg</p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.boxesUsed.map((p, i) => (
              <div key={i} className={`p-2 rounded-lg text-sm flex justify-between ${p.box ? "bg-green-50" : "bg-red-50"}`}>
                <span>{p.box ? `${p.box.name} (${p.box.l}×${p.box.w}×${p.box.h}cm)` : t("tools.shipping-box.no_fit")}</span>
                <span className="font-semibold">{p.box ? fmt(p.box.cost) : "—"}</span>
              </div>
            ))}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.shipping-box.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.shipping-box.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.shipping-box.title")}
      subtitle={t("tools.shipping-box.subtitle")}
      icon={Package}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={["shipping box", "box size", "packaging calculator", "ecommerce shipping"]}
      result={resultNode}
    >
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-4 gap-1">
              <input type="number" min="1" value={item.l} onChange={e => updateItem(item.id, "l", +e.target.value)} placeholder={t("tools.shipping-box.l")} className="border rounded px-1 py-1 text-sm" />
              <input type="number" min="1" value={item.w} onChange={e => updateItem(item.id, "w", +e.target.value)} placeholder={t("tools.shipping-box.w")} className="border rounded px-1 py-1 text-sm" />
              <input type="number" min="1" value={item.h} onChange={e => updateItem(item.id, "h", +e.target.value)} placeholder={t("tools.shipping-box.h")} className="border rounded px-1 py-1 text-sm" />
              <input type="number" min="0.1" step="0.1" value={item.weight} onChange={e => updateItem(item.id, "weight", +e.target.value)} placeholder="kg" className="border rounded px-1 py-1 text-sm" />
            </div>
            <div className="flex justify-between items-center">
              <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", +e.target.value)} className="border rounded px-2 py-1 text-sm w-20" />
              <button onClick={() => removeItem(item.id)} className="text-red-600 text-sm">× {t("tools.shipping-box.remove")}</button>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">+ {t("tools.shipping-box.add_item")}</button>
      </div>
    </CalculatorShell>
  );
}
