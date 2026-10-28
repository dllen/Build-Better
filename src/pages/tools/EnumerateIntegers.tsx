import { useState, useCallback } from "react";
import { ListOrdered, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function enumerateIntegers(start: number, count: number, step: number, format: string): string[] {
  const result: string[] = [];
  const radixMap: Record<string, number> = { decimal: 10, hex: 16, octal: 8, binary: 2 };
  const radix = radixMap[format] || 10;

  for (let i = 0; i < count; i++) {
    const val = start + i * step;
    if (radix === 2) {
      result.push(val.toString(2));
    } else if (radix === 8) {
      result.push(val.toString(8));
    } else if (radix === 16) {
      result.push(val.toString(16).toUpperCase());
    } else {
      result.push(val.toString(10));
    }
  }
  return result;
}

export default function EnumerateIntegers() {
  const [start, setStart] = useState(1);
  const [count, setCount] = useState(100);
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState("decimal");
  const [separator, setSeparator] = useState("\\n");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [output, setOutput] = useState("");

  const handleGenerate = useCallback(() => {
    const numbers = enumerateIntegers(start, count, step, format);
    const sep = separator.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    setOutput(numbers.map(n => `${prefix}${n}${suffix}`).join(sep));
  }, [start, count, step, format, separator, prefix, suffix]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 text-info rounded-lg"><ListOrdered className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Enumerate Integers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Start:</span>
            <input type="number" value={start} onChange={(e) => setStart(Number(e.target.value))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Count:</span>
            <input type="number" min={1} max={100000} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100000, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Step:</span>
            <input type="number" value={step} onChange={(e) => setStep(Number(e.target.value))}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <select value={format} onChange={(e) => setFormat(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
            <option value="decimal">Decimal</option>
            <option value="hex">Hex</option>
            <option value="octal">Octal</option>
            <option value="binary">Binary</option>
          </select>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors">
            <ListOrdered className="h-3.5 w-3.5" />Generate
          </button>
        </div>
      }
      inputLabel="Options"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Separator</label>
            <select value={separator} onChange={(e) => setSeparator(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
              <option value="\n">Newline</option>
              <option value=", ">Comma + Space</option>
              <option value=",">Comma</option>
              <option value=" ">Space</option>
              <option value="\t">Tab</option>
              <option value=";">Semicolon</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Prefix</label>
            <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. #, 0x"
              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Suffix</label>
            <input type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)}
              placeholder="e.g. px, ;"
              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
        </div>
      }
      outputLabel="Generated Numbers"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click Generate to enumerate integers
            </div>
          )}
        </div>
      }
    />
  );
}