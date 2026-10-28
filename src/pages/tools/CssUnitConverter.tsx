import { useState, useMemo } from "react";
import { Ruler, ArrowRightLeft } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

type Unit = "px" | "em" | "rem" | "vw" | "vh" | "percent";

const unitLabels: Record<Unit, string> = {
  px: "px (pixels)",
  em: "em (relative to parent)",
  rem: "rem (relative to root)",
  vw: "vw (viewport width)",
  vh: "vh (viewport height)",
  percent: "% (percentage)",
};

interface ConvertResult {
  unit: Unit;
  value: string;
}

export default function CssUnitConverter() {
  const [inputValue, setInputValue] = useState("16");
  const [fromUnit, setFromUnit] = useState<Unit>("px");
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [parentFontSize, setParentFontSize] = useState(16);

  const results = useMemo<ConvertResult[]>(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val < 0) return [];

    // First convert everything to px
    let px: number;
    switch (fromUnit) {
      case "px": px = val; break;
      case "em": px = val * parentFontSize; break;
      case "rem": px = val * baseFontSize; break;
      case "vw": px = (val / 100) * viewportWidth; break;
      case "vh": px = (val / 100) * viewportWidth; break; // simplified: use vw as default
      case "percent": px = (val / 100) * parentFontSize; break;
      default: px = val;
    }

    const r = (v: number) => {
      if (v === 0) return "0";
      if (Number.isInteger(v)) return v.toString();
      return parseFloat(v.toFixed(4)).toString();
    };

    return ([
      { unit: "px" as Unit, value: r(px) },
      { unit: "em" as Unit, value: r(px / parentFontSize) },
      { unit: "rem" as Unit, value: r(px / baseFontSize) },
      { unit: "vw" as Unit, value: r((px / viewportWidth) * 100) },
      { unit: "percent" as Unit, value: r((px / parentFontSize) * 100) },
    ] as ConvertResult[]).filter((r) => r.unit !== fromUnit);
  }, [inputValue, fromUnit, viewportWidth, baseFontSize, parentFontSize]);

  return (
    <CalculatorShell
      title="CSS Unit Converter"
      subtitle="Convert between px, em, rem, vw, % and other CSS units."
      icon={Ruler}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["css unit converter", "px to rem", "em to px", "vw converter", "css units"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Value</label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg font-mono text-lg focus:ring-2 focus:ring-ring"
              placeholder="16"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">From Unit</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as Unit)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
            >
              {Object.entries(unitLabels).map(([u, label]) => (
                <option key={u} value={u}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Root font-size</label>
              <input
                type="number"
                value={baseFontSize}
                onChange={(e) => setBaseFontSize(Number(e.target.value) || 16)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Parent font-size</label>
              <input
                type="number"
                value={parentFontSize}
                onChange={(e) => setParentFontSize(Number(e.target.value) || 16)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Viewport</label>
              <input
                type="number"
                value={viewportWidth}
                onChange={(e) => setViewportWidth(Number(e.target.value) || 1440)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
        </div>
      }
      result={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground tracking-wide">Converted Values</h3>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-sm">Enter a value above to see conversions.</p>
          ) : (
            <div className="space-y-3">
              {results.map(({ unit, value }) => (
                <div key={unit} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{unitLabels[unit as Unit]}</div>
                    <div className="font-mono text-lg text-foreground">{value} {unit}</div>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            Based on root: {baseFontSize}px, parent: {parentFontSize}px, viewport: {viewportWidth}px
          </div>
        </div>
      }
    />
  );
}