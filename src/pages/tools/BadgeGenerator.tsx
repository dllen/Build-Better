import { useState, useMemo } from "react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { buildBadgeUrl, BADGE_PRESET_COLORS, BADGE_STYLES, type BadgeInput } from "@/lib/network/generators";

export default function BadgeGenerator() {
  const [label, setLabel] = useState("build");
  const [message, setMessage] = useState("passing");
  const [color, setColor] = useState("brightgreen");
  const [style, setStyle] = useState<BadgeInput["style"]>("flat");
  const [logo, setLogo] = useState("");
  const [labelColor, setLabelColor] = useState("");
  const [copied, setCopied] = useState("");

  const url = useMemo(() => buildBadgeUrl({ label, message, color, style, logo, labelColor }),
    [label, message, color, style, logo, labelColor]);
  const markdown = `![${label}](${url})`;

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text); setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <CalculatorShell
      title="Shield Badge Generator"
      subtitle="Design shields.io badges with live preview — get the URL, Markdown or HTML snippet."
      icon={ShieldCheck}
      iconBgColor="bg-success/10"
      iconColor="text-success"
      keywords={["badge generator", "shields.io", "markdown badge", "status badge", "readme badge"]}
      children={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Label (left)</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="build"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Message (right)</label>
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="passing"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Color</label>
              <select value={color} onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring">
                {BADGE_PRESET_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value as BadgeInput["style"])}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring">
                {BADGE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Logo (optional)</label>
              <input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="github"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Label color (optional)</label>
              <input value={labelColor} onChange={(e) => setLabelColor(e.target.value)} placeholder="555"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
          </div>
        </div>
      }
      result={
        <div className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-muted rounded-lg border border-border">
            <img src={url} alt={`${label}: ${message}`} className="max-w-full" />
          </div>
          {[
            { key: "url", lbl: "Image URL", val: url },
            { key: "md", lbl: "Markdown", val: markdown },
            { key: "html", lbl: "HTML", val: `<img src="${url}" alt="${label}">` },
          ].map(({ key, lbl, val }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{lbl}</label>
                <button onClick={() => copy(key, val)}
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:bg-muted rounded text-xs">
                  {copied === key ? <Check size={12} /> : <Copy size={12} />} {copied === key ? "Copied" : "Copy"}
                </button>
              </div>
              <input readOnly value={val} className="w-full px-3 py-2 border border-border rounded-lg font-mono text-xs bg-muted" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Preview is rendered by shields.io.</p>
        </div>
      }
    />
  );
}