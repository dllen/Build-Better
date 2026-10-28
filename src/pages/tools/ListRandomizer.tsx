import { useState, useMemo } from "react";
import { Shuffle, Copy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type ListFormat = "newline" | "comma" | "semicolon" | "space";

function parseList(text: string, format: ListFormat): string[] {
  if (!text.trim()) return [];
  const delimiter = { newline: "\n", comma: ",", semicolon: ";", space: " " }[format];
  const raw = text.split(delimiter === "\n" ? /\r?\n/ : delimiter);
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ListRandomizer() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<ListFormat>("newline");
  const [removeDupes, setRemoveDupes] = useState(false);
  const [selectCount, setSelectCount] = useState(0);
  const [randomized, setRandomized] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => {
    const parsed = parseList(input, format);
    return removeDupes ? [...new Set(parsed)] : parsed;
  }, [input, format, removeDupes]);

  const stats = useMemo(() => {
    const parsed = parseList(input, format);
    const unique = new Set(parsed);
    return {
      total: parsed.length,
      unique: unique.size,
      duplicate: parsed.length - unique.size,
    };
  }, [input, format]);

  const handleRandomize = () => {
    if (items.length === 0) return;
    const shuffled = shuffleArray(items);
    const count = selectCount > 0 ? Math.min(selectCount, shuffled.length) : shuffled.length;
    const picks = shuffled.slice(0, count);
    setRandomized(shuffled);
    setSelected(picks);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(randomized.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Shuffle className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">List Randomizer</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ListFormat)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card"
          >
            <option value="newline">One per line</option>
            <option value="comma">Comma (,) </option>
            <option value="semicolon">Semicolon (;)</option>
            <option value="space">Space</option>
          </select>

          <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeDupes}
              onChange={(e) => setRemoveDupes(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring"
            />
            Remove duplicates
          </label>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Pick</span>
            <input
              type="number"
              min={0}
              max={items.length || 999}
              value={selectCount}
              onChange={(e) => setSelectCount(Math.max(0, Number(e.target.value)))}
              className="w-16 rounded-lg border border-border px-2 py-1 text-center text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
            <span>of {items.length}</span>
          </div>

          <button
            onClick={handleRandomize}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Randomize
          </button>
        </div>
      }
      inputLabel={
        <span>
          Your List{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({stats.total} total · {stats.unique} unique{stats.duplicate > 0 ? ` · ${stats.duplicate} dupes` : ""})
          </span>
        </span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setRandomized([]);
            setSelected([]);
          }}
          placeholder={`Enter your list items here...\n\nOne item per line, or use comma/semicolon/space format`}
          className="h-full w-full resize-none rounded-lg border border-border bg-card p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border"
          spellCheck={false}
        />
      }
      outputLabel={
        randomized.length > 0 ? (
          <span>
            Result{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({selected.length > 0 && selected.length < randomized.length
                ? `${selected.length} picked of ${randomized.length}`
                : `${randomized.length} shuffled`})
            </span>
          </span>
        ) : (
          "Result"
        )
      }
      outputActions={
        randomized.length > 0 ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card">
          {randomized.length > 0 ? (
            <ol className="list-decimal list-inside p-4 space-y-0.5 text-sm font-mono">
              {randomized.map((item, i) => {
                const isPicked = selected.includes(item);
                const pickedColor = selectCount > 0 && isPicked ? "text-success font-semibold" : "";
                const notPickedColor = selectCount > 0 && !isPicked ? "text-destructive" : "";
                return (
                  <li key={i} className={`${pickedColor || notPickedColor || "text-muted-foreground"}`}>
                    {item}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click Randomize to shuffle your list
            </div>
          )}
        </div>
      }
    />
  );
}