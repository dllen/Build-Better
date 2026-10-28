import { useState } from "react";
import { LetterText, Copy, Check, RefreshCw } from "lucide-react";

function generateString(length: number, charset: string): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[arr[i] % charset.length];
  }
  return result;
}

const CHARSETS: { key: string; label: string; chars: string }[] = [
  { key: "upper", label: "A-Z", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { key: "lower", label: "a-z", chars: "abcdefghijklmnopqrstuvwxyz" },
  { key: "digits", label: "0-9", chars: "0123456789" },
  { key: "symbols", label: "!@#$%^&*", chars: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
];

export default function RandomStringGenerator() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [selectedCharsets, setSelectedCharsets] = useState<Set<string>>(
    new Set(["upper", "lower", "digits"])
  );
  const [customChars, setCustomChars] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState(-1);

  const toggleCharset = (key: string) => {
    setSelectedCharsets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getCharset = (): string => {
    let chars = "";
    for (const cs of CHARSETS) {
      if (selectedCharsets.has(cs.key)) chars += cs.chars;
    }
    if (customChars.trim()) chars += customChars.trim();
    return chars || CHARSETS[0].chars;
  };

  const handleGenerate = () => {
    const charset = getCharset();
    const strings: string[] = [];
    for (let i = 0; i < count; i++) {
      strings.push(generateString(length, charset));
    }
    setResults(strings);
  };

  const copyOne = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(-1), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(results.join("\n"));
    setCopied(-2);
    setTimeout(() => setCopied(-1), 2000);
  };

  const entropy = getCharset().length > 0 ? (length * Math.log2(getCharset().length)).toFixed(1) : "0";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-info/10 text-info rounded-lg">
          <LetterText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Random String Generator</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Generate cryptographically random strings with configurable character sets.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground font-medium">Length:</label>
            <input
              type="number"
              min={1}
              max={1024}
              value={length}
              onChange={(e) => setLength(Math.max(1, Math.min(1024, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground font-medium">Count:</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">Entropy: ~{entropy} bits</span>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Character sets:</p>
          <div className="flex flex-wrap gap-2">
            {CHARSETS.map((cs) => (
              <button
                key={cs.key}
                onClick={() => toggleCharset(cs.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${ selectedCharsets.has(cs.key) ? "bg-info/10 border-border text-info" : "border-border text-muted-foreground" }`}
              >
                {cs.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">Custom chars:</label>
          <input
            type="text"
            value={customChars}
            onChange={(e) => setCustomChars(e.target.value)}
            placeholder="e.g. ABC123"
            className="flex-1 max-w-xs rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </button>
          {results.length > 0 && (
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              {copied === -2 ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              Copy all
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border group"
              >
                <code className="flex-1 text-sm text-foreground break-all font-mono">{s}</code>
                <button
                  onClick={() => copyOne(s, i)}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-info rounded opacity-0 group-hover:opacity-100 transition-colors transition-opacity"
                >
                  {copied === i ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}