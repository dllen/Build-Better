import { useMemo, useState } from "react";
import { Code, ClipboardCopy, Check } from "lucide-react";

type Style = "camelCase" | "PascalCase" | "snake_case" | "kebab-case" | "SCREAMING_SNAKE";
type Kind = "variable" | "function" | "class" | "file" | "package";

const verbs = [
  "get",
  "set",
  "create",
  "update",
  "delete",
  "remove",
  "list",
  "find",
  "fetch",
  "load",
  "save",
  "compute",
  "calculate",
  "convert",
  "parse",
  "format",
  "validate",
  "normalize",
  "merge",
  "split",
  "diff",
  "map",
  "reduce",
  "filter",
  "sort",
  "aggregate",
  "encode",
  "decode",
  "encrypt",
  "decrypt",
  "hash",
  "sign",
  "verify",
  "generate",
  "build",
];
const nouns = [
  "data",
  "cache",
  "manager",
  "service",
  "client",
  "server",
  "controller",
  "handler",
  "adapter",
  "processor",
  "generator",
  "builder",
  "factory",
  "repository",
  "store",
  "queue",
  "task",
  "job",
  "result",
  "response",
  "request",
  "config",
  "logger",
  "monitor",
  "worker",
  "session",
  "token",
  "util",
];
const qualifiers = [
  "async",
  "sync",
  "local",
  "remote",
  "global",
  "temp",
  "main",
  "core",
  "default",
  "primary",
];

function tokenize(input: string) {
  return input
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function applyStyle(style: Style, tokens: string[]) {
  if (!tokens.length) return "";
  if (style === "camelCase") {
    const [head, ...rest] = tokens;
    return head + rest.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("");
  }
  if (style === "PascalCase") {
    return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("");
  }
  if (style === "snake_case") {
    return tokens.join("_");
  }
  if (style === "kebab-case") {
    return tokens.join("-");
  }
  if (style === "SCREAMING_SNAKE") {
    return tokens.join("_").toUpperCase();
  }
  return tokens.join("");
}

function kindDefaultStyle(kind: Kind): Style {
  if (kind === "class") return "PascalCase";
  if (kind === "file" || kind === "package") return "kebab-case";
  return "camelCase";
}

function pick<T>(arr: T[], count: number) {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return out;
}

function buildSuggestions(
  kind: Kind,
  style: Style,
  keywords: string[],
  prefix: string,
  suffix: string,
  randomness: number,
  count: number
) {
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const extraVerbs = randomness > 0.33 ? pick(verbs, 1) : [];
    const extraNouns = randomness > 0.66 ? pick(nouns, 1) : [];
    const extraQual = randomness > 0.8 ? pick(qualifiers, 1) : [];
    let tokens: string[] = [];
    if (kind === "function") {
      tokens = [...extraVerbs, ...keywords, ...extraNouns, ...extraQual];
    } else if (kind === "class") {
      tokens = [...keywords, extraNouns[0] || "service"];
    } else if (kind === "variable") {
      tokens = [...keywords, extraNouns[0] || "value", ...extraQual];
    } else if (kind === "file" || kind === "package") {
      tokens = [...keywords, ...extraNouns, ...extraQual];
    } else {
      tokens = [...keywords];
    }
    const pfx = tokenize(prefix);
    const sfx = tokenize(suffix);
    const finalTokens = [...pfx, ...tokens, ...sfx].filter(Boolean);
    list.push(applyStyle(style, finalTokens));
  }
  return Array.from(new Set(list)).slice(0, count);
}

export default function ProgrammerNamingTool() {
  const [kind, setKind] = useState<Kind>("function");
  const [style, setStyle] = useState<Style>(kindDefaultStyle("function"));
  const [input, setInput] = useState("user token");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [randomness, setRandomness] = useState(0.5);
  const [count, setCount] = useState(12);
  const [copiedAll, setCopiedAll] = useState("");
  const [copiedOne, setCopiedOne] = useState<number | null>(null);

  const kw = useMemo(() => tokenize(input), [input]);

  const suggestions = useMemo(() => {
    const s = style || kindDefaultStyle(kind);
    return buildSuggestions(kind, s, kw, prefix, suffix, randomness, count);
  }, [kind, style, kw, prefix, suffix, randomness, count]);

  function copy(text: string, mode: "all" | "one", idx?: number) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (mode === "all") {
          setCopiedAll("ok");
          setTimeout(() => setCopiedAll(""), 1000);
        } else {
          setCopiedOne(idx ?? null);
          setTimeout(() => setCopiedOne(null), 1000);
        }
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Code className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">程序员命名工具</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">输入与选项</div>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="输入关键词，如 user token auth"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">类型</label>
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as Kind;
                  setKind(k);
                  setStyle(kindDefaultStyle(k));
                }}
              >
                <option value="variable">变量</option>
                <option value="function">函数</option>
                <option value="class">类/类型</option>
                <option value="file">文件名</option>
                <option value="package">包名</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-700">风格</label>
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
              >
                <option value="camelCase">camelCase</option>
                <option value="PascalCase">PascalCase</option>
                <option value="snake_case">snake_case</option>
                <option value="kebab-case">kebab-case</option>
                <option value="SCREAMING_SNAKE">SCREAMING_SNAKE_CASE</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="前缀（可选）"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="后缀（可选）"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-sm text-gray-700">
                随机性: {Math.round(randomness * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={randomness}
                onChange={(e) => setRandomness(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">数量: {count}</label>
              <input
                type="range"
                min={4}
                max={48}
                step={1}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 lg:col-span-2">
          <div className="font-medium">命名建议</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2"
              >
                <div className="flex-1 font-mono text-sm break-all">{s}</div>
                <button
                  className="inline-flex items-center gap-2 px-2 py-1 border border-gray-300 rounded-md text-xs"
                  onClick={() => copy(s, "one", i)}
                >
                  <ClipboardCopy className="h-4 w-4" /> 复制{" "}
                  {copiedOne === i ? <Check className="h-4 w-4 text-green-600" /> : null}
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(suggestions.join("\n"), "all")}
              disabled={!suggestions.length}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制全部{" "}
              {copiedAll ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
