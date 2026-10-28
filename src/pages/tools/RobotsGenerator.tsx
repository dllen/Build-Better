import { useState, useMemo } from "react";
import { Bot, Copy, Check, Plus, Trash2 } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { buildRobotsTxt, ROBOTS_PRESETS, type RobotsRule } from "@/lib/network/generators";

interface RuleRow extends RobotsRule { id: number }

export default function RobotsGenerator() {
  const [rules, setRules] = useState<RuleRow[]>([{ id: 1, userAgent: "*", allow: ["/"], disallow: ["/admin/", "/private/"] }]);
  const [sitemap, setSitemap] = useState("https://example.com/sitemap.xml");
  const [host, setHost] = useState("");
  const [crawlDelay, setCrawlDelay] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState("");

  const output = useMemo(() => buildRobotsTxt({
    rules, sitemap, host, crawlDelay: crawlDelay === "" ? undefined : Number(crawlDelay),
  }), [rules, sitemap, host, crawlDelay]);

  const applyPreset = (id: string) => {
    const preset = ROBOTS_PRESETS.find((p) => p.id === id);
    if (!preset) return; setActivePreset(id);
    setRules(preset.options.rules.map((r, i) => ({ ...r, id: i + 1 })));
    setSitemap(preset.options.sitemap ?? "");
  };
  const updateRule = (id: number, patch: Partial<RuleRow>) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRule = () => setRules((rs) => [...rs, { id: Date.now(), userAgent: "*", allow: [], disallow: ["/"] }]);
  const removeRule = (id: number) => setRules((rs) => rs.filter((r) => r.id !== id));
  const handleCopy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <CalculatorShell
      title="robots.txt Generator"
      subtitle="Build a robots.txt with presets and per-user-agent rules — allow, disallow, sitemap and crawl-delay."
      icon={Bot}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["robots.txt generator", "robots txt", "crawler rules", "seo robots", "sitemap robots"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {ROBOTS_PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p.id)} title={p.description}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${activePreset === p.id ? "bg-primary text-primary-foreground border-border" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">User-agent rules</h3>
              <button onClick={addRule} className="flex items-center gap-1.5 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg text-sm">
                <Plus size={14} /> Add rule
              </button>
            </div>
            {rules.map((rule) => (
              <div key={rule.id} className="p-3 border border-border rounded-lg space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">User-agent</label>
                    <input value={rule.userAgent} onChange={(e) => updateRule(rule.id, { userAgent: e.target.value })}
                      placeholder="* or Googlebot" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
                  </div>
                  <button onClick={() => removeRule(rule.id)} disabled={rules.length === 1}
                    className="mt-5 p-2 text-muted-foreground hover:text-destructive rounded-lg disabled:opacity-30" title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-muted-foreground mb-1">Allow (one path/line)</label>
                    <textarea value={rule.allow.join("\n")} rows={3}
                      onChange={(e) => updateRule(rule.id, { allow: e.target.value.split("\n").filter(Boolean) })}
                      placeholder={"/\n/blog/"} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Disallow (one path/line)</label>
                    <textarea value={rule.disallow.join("\n")} rows={3}
                      onChange={(e) => updateRule(rule.id, { disallow: e.target.value.split("\n").filter(Boolean) })}
                      placeholder={"/admin/\n/private/"} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y" /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Sitemap URL</label>
              <input value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://example.com/sitemap.xml"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Host (optional)</label>
              <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Crawl-delay</label>
              <input type="number" min={0} value={crawlDelay}
                onChange={(e) => setCrawlDelay(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="10" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
          </div>
        </div>
      }
      result={
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Output</h3>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} rows={14}
            className="w-full px-3 py-2.5 border border-border rounded-lg font-mono text-sm bg-muted" />
        </div>
      }
    />
  );
}