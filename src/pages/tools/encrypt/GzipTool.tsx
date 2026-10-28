import { useMemo, useState } from "react";
import { Archive, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "compress" | "decompress";

export default function Gzip() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("compress");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useMemo(() => {
    if (!input.trim()) { setResult(""); setError(""); return ""; }
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        if (direction === "compress") {
          const stream = new Blob([input]).stream().pipeThrough(new CompressionStream("gzip"));
          const buf = await new Response(stream).arrayBuffer();
          if (!cancelled) setResult(btoa(String.fromCharCode(...new Uint8Array(buf))));
        } else {
          try {
            const bytes = Uint8Array.from(atob(input.trim()), c => c.charCodeAt(0));
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
            const buf = await new Response(stream).arrayBuffer();
            if (!cancelled) setResult(new TextDecoder().decode(buf));
          } catch {
            if (!cancelled) setError("Decompression failed — invalid gzip data");
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Operation failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [input, direction]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary"><Archive className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Gzip</h1></>}
      toolbar={<select className="rounded-md border border-border px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
        <option value="compress">Compress</option><option value="decompress">Decompress</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={direction === "compress" ? "Enter text to compress..." : "Enter base64 gzip data to decompress..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{loading ? "Processing..." : error || result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}