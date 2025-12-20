import { useEffect, useMemo, useState } from "react";
import { Box, ClipboardCopy, Check } from "lucide-react";

type Category = "length" | "weight" | "temperature" | "area" | "storage";
type UnitDef = { key: string; label: string; toBase: number };
type TempDef = {
  key: string;
  label: string;
  toC: (v: number) => number;
  fromC: (c: number) => number;
};

const lengthUnits: UnitDef[] = [
  { key: "km", label: "Kilometer (km)", toBase: 1000 },
  { key: "m", label: "Meter (m)", toBase: 1 },
  { key: "cm", label: "Centimeter (cm)", toBase: 0.01 },
  { key: "mm", label: "Millimeter (mm)", toBase: 0.001 },
  { key: "mi", label: "Mile (mi)", toBase: 1609.344 },
  { key: "yd", label: "Yard (yd)", toBase: 0.9144 },
  { key: "ft", label: "Foot (ft)", toBase: 0.3048 },
  { key: "in", label: "Inch (in)", toBase: 0.0254 },
];

const weightUnits: UnitDef[] = [
  { key: "t", label: "Ton (t)", toBase: 1000 },
  { key: "kg", label: "Kilogram (kg)", toBase: 1 },
  { key: "g", label: "Gram (g)", toBase: 0.001 },
  { key: "mg", label: "Milligram (mg)", toBase: 0.000001 },
  { key: "lb", label: "Pound (lb)", toBase: 0.45359237 },
  { key: "oz", label: "Ounce (oz)", toBase: 0.028349523125 },
];

const areaUnits: UnitDef[] = [
  { key: "km2", label: "Square Kilometer (km²)", toBase: 1000000 },
  { key: "m2", label: "Square Meter (m²)", toBase: 1 },
  { key: "cm2", label: "Square Centimeter (cm²)", toBase: 0.0001 },
  { key: "mm2", label: "Square Millimeter (mm²)", toBase: 0.000001 },
  { key: "ha", label: "Hectare (ha)", toBase: 10000 },
  { key: "ac", label: "Acre (ac)", toBase: 4046.8564224 },
  { key: "ft2", label: "Square Foot (ft²)", toBase: 0.09290304 },
  { key: "yd2", label: "Square Yard (yd²)", toBase: 0.83612736 },
  { key: "in2", label: "Square Inch (in²)", toBase: 0.00064516 },
];

const tempUnits: TempDef[] = [
  { key: "C", label: "Celsius (°C)", toC: (v) => v, fromC: (c) => c },
  {
    key: "F",
    label: "Fahrenheit (°F)",
    toC: (v) => ((v - 32) * 5) / 9,
    fromC: (c) => (c * 9) / 5 + 32,
  },
  { key: "K", label: "Kelvin (K)", toC: (v) => v - 273.15, fromC: (c) => c + 273.15 },
];

const storageUnits: UnitDef[] = [
  { key: "bit", label: "Bit (b)", toBase: 1 / 8 },
  { key: "B", label: "Byte (B)", toBase: 1 },
  { key: "KB", label: "Kilobyte (KB, 10^3)", toBase: 1000 },
  { key: "MB", label: "Megabyte (MB, 10^6)", toBase: 1000 ** 2 },
  { key: "GB", label: "Gigabyte (GB, 10^9)", toBase: 1000 ** 3 },
  { key: "TB", label: "Terabyte (TB, 10^12)", toBase: 1000 ** 4 },
  { key: "KiB", label: "Kibibyte (KiB, 2^10)", toBase: 1024 },
  { key: "MiB", label: "Mebibyte (MiB, 2^20)", toBase: 1024 ** 2 },
  { key: "GiB", label: "Gibibyte (GiB, 2^30)", toBase: 1024 ** 3 },
  { key: "TiB", label: "Tebibyte (TiB, 2^40)", toBase: 1024 ** 4 },
];

function formatNum(v: number) {
  return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>("length");
  const [unit, setUnit] = useState<string>(lengthUnits[1].key);
  const [value, setValue] = useState<string>("1");
  const [copied, setCopied] = useState("");

  const unitList = useMemo(() => {
    if (category === "length") return lengthUnits;
    if (category === "weight") return weightUnits;
    if (category === "area") return areaUnits;
    if (category === "storage") return storageUnits;
    return [];
  }, [category]);

  useEffect(() => {
    if (category === "temperature") {
      setUnit("C");
    } else {
      setUnit((unitList[0] || { key: "" }).key);
    }
  }, [category, unitList]);

  const results = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return [];
    if (category === "temperature") {
      const from = tempUnits.find((u) => u.key === unit) || tempUnits[0];
      const c = from.toC(n);
      return tempUnits.map((u) => ({ key: u.key, label: u.label, value: u.fromC(c) }));
    } else {
      const current = unitList.find((u) => u.key === unit) || unitList[0];
      const base = n * (current?.toBase || 1);
      return unitList.map((u) => ({ key: u.key, label: u.label, value: base / u.toBase }));
    }
  }, [category, unit, unitList, value]);

  const summary = useMemo(() => {
    return results.map((r) => `${r.label}: ${formatNum(r.value)}`).join("\n");
  }, [results]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600">
          <Box className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">单位转换</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium">类别</div>
          <select
            className="rounded-md border border-gray-300 px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="length">长度</option>
            <option value="weight">重量</option>
            <option value="temperature">温度</option>
            <option value="area">面积</option>
            <option value="storage">存储单位</option>
          </select>
        </div>
        <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium">输入</div>
          {category === "temperature" ? (
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {tempUnits.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {unitList.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          )}
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="输入数值"
          />
        </div>
        <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium">结果摘要</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap">
              {summary || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(summary)}
              disabled={!summary}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">转换结果</div>
        <div className="rounded-md border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-700">单位</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">数值</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.key} className="border-t">
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="px-3 py-2 font-mono">{formatNum(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
