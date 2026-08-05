import { useState, useCallback } from "react";
import { Dices, Copy, RotateCcw, Shuffle } from "lucide-react";

type Preset = "password" | "token" | "hex" | "numeric" | "alphanumeric" | "url-safe" | "custom";

interface PresetConfig {
  label: string;
  desc: string;
  chars: string;
  defaultLength: number;
}

const PRESETS: Record<Preset, PresetConfig> = {
  password: {
    label: "强密码",
    desc: "大小写字母 + 数字 + 特殊符号",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?",
    defaultLength: 16,
  },
  token: {
    label: "Token / API Key",
    desc: "大小写字母 + 数字，适合 API 密钥",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    defaultLength: 32,
  },
  hex: {
    label: "十六进制",
    desc: "0-9 a-f，适合哈希/颜色值",
    chars: "0123456789abcdef",
    defaultLength: 64,
  },
  numeric: {
    label: "纯数字",
    desc: "0-9，适合验证码/ PIN",
    chars: "0123456789",
    defaultLength: 6,
  },
  alphanumeric: {
    label: "字母数字",
    desc: "大小写字母 + 数字，无特殊符号",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    defaultLength: 16,
  },
  "url-safe": {
    label: "URL 安全",
    desc: "字母数字 + -_ ，适合 URL 片段",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    defaultLength: 12,
  },
  custom: {
    label: "自定义",
    desc: "使用下方自定义字符集",
    chars: "",
    defaultLength: 16,
  },
};

export default function TextRandomGenerator() {
  const [preset, setPreset] = useState<Preset>("password");
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [customChars, setCustomChars] = useState("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
  const [results, setResults] = useState<string[]>(["Click 'Generate' to create a random string"]);
  const [message, setMessage] = useState("");

  const generate = useCallback(() => {
    const config = PRESETS[preset];
    const chars = preset === "custom" ? customChars : config.chars;
    if (!chars) {
      setResults(["请设置自定义字符集"]);
      return;
    }

    const crypto = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
    const array = new Uint32Array(length * count);
    crypto.getRandomValues(array);

    const generated: string[] = [];
    for (let j = 0; j < count; j++) {
      let str = "";
      for (let i = 0; i < length; i++) {
        str += chars[array[j * length + i] % chars.length];
      }
      generated.push(str);
    }
    setResults(generated);
  }, [preset, length, count, customChars]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("已复制!");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.join("\n"));
      setMessage("已复制全部!");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      // fallback
    }
  };

  const handlePresetChange = (p: Preset) => {
    setPreset(p);
    setLength(PRESETS[p].defaultLength);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
            <Dices className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Random String Generator</h1>
            <p className="text-sm text-muted-foreground mt-0.5">随机生成各种格式的字符串</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPreset("password");
              setLength(16);
              setCount(1);
              setCustomChars("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
              setResults([]);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
        </div>
      </div>

      {/* Preset selector */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">预设类型</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {(Object.keys(PRESETS) as Preset[]).map((key) => {
              const cfg = PRESETS[key];
              const isActive = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                      : "border-border/50 hover:border-violet-500/30 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-medium text-foreground">{cfg.label}</div>
                  <div className="text-[10px] mt-0.5">{cfg.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom charset */}
        {preset === "custom" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">自定义字符集</label>
            <input
              type="text"
              value={customChars}
              onChange={(e) => setCustomChars(e.target.value)}
              placeholder="输入允许的字符..."
              className="w-full mt-1.5 px-3 py-2 text-sm font-mono bg-muted/50 border border-border/30 rounded-lg outline-none focus:border-violet-500/30"
              spellCheck={false}
            />
          </div>
        )}

        {/* Length & Count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              长度: <span className="text-violet-400 font-mono">{length}</span>
            </label>
            <input
              type="range"
              min={1}
              max={128}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full mt-1 accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>128</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              生成数量: <span className="text-violet-400 font-mono">{count}</span>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full mt-1 accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
        >
          <Shuffle className="w-4 h-4" /> 生成随机字符串
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">生成结果 ({results.length})</span>
            <div className="flex items-center gap-2">
              {message && <span className="text-[10px] text-emerald-400">{message}</span>}
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-md bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-3 h-3" /> 复制全部
              </button>
            </div>
          </div>
          <div className="p-3 space-y-1.5 font-mono">
            {results.map((r, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground shrink-0 w-5">{i + 1}</span>
                <span className="text-xs text-foreground break-all flex-1 select-all">{r}</span>
                <button
                  onClick={() => handleCopy(r)}
                  className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                  title="复制"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
          <div className="text-[10px] text-muted-foreground">字符集大小</div>
          <div className="text-sm font-semibold font-mono mt-0.5">
            {preset === "custom" ? customChars.length : PRESETS[preset].chars.length || "?"}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
          <div className="text-[10px] text-muted-foreground">组合数</div>
          <div className="text-sm font-semibold font-mono mt-0.5">
            {preset === "custom" ? customChars.length ** length : (PRESETS[preset].chars.length ** length).toExponential(2) || "?"}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
          <div className="text-[10px] text-muted-foreground">熵 (bits)</div>
          <div className="text-sm font-semibold font-mono mt-0.5">
            {preset === "custom"
              ? customChars.length > 0 ? (length * Math.log2(customChars.length)).toFixed(1) : "?"
              : PRESETS[preset].chars.length > 0 ? (length * Math.log2(PRESETS[preset].chars.length)).toFixed(1) : "?"}
          </div>
        </div>
      </div>
    </div>
  );
}
