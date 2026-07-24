import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, RefreshCw, Sparkles, FileText, Zap } from "lucide-react";

const COMMIT_TYPES = [
  { value: "feat", label: "feat", desc: "New feature", color: "emerald" },
  { value: "fix", label: "fix", desc: "Bug fix", color: "red" },
  { value: "docs", label: "docs", desc: "Documentation", color: "cyan" },
  { value: "refactor", label: "refactor", desc: "Code refactor", color: "purple" },
  { value: "style", label: "style", desc: "Formatting", color: "pink" },
  { value: "perf", label: "perf", desc: "Performance", color: "orange" },
  { value: "test", label: "test", desc: "Tests", color: "blue" },
  { value: "chore", label: "chore", desc: "Maintenance", color: "gray" },
  { value: "ci", label: "ci", desc: "CI/CD", color: "indigo" },
  { value: "build", label: "build", desc: "Build system", color: "amber" },
  { value: "revert", label: "revert", desc: "Revert changes", color: "rose" },
  { value: "merge", label: "merge", desc: "Merge branch", color: "teal" },
];

const SCOPES = [
  "api", "ui", "core", "config", "deps", "docs", "test", "build", "ci", "db", "auth", "router", "state"
];

export default function CommitMessageGenerator() {
  const { t } = useTranslation();
  const [type, setType] = useState("feat");
  const [scope, setScope] = useState("");
  const [desc, setDesc] = useState("");
  const [body, setBody] = useState("");
  const [breaking, setBreaking] = useState(false);
  const [footer, setFooter] = useState("");
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      red: "bg-red-500/10 text-red-400 border-red-500/30",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
      orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      gray: "bg-gray-500/10 text-gray-400 border-gray-500/30",
      indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    };
    return colors[color] || colors.gray;
  };

  const buildMessage = useCallback(() => {
    let prefix = type;
    if (scope) prefix += `(${scope})`;
    if (breaking) prefix += "!";

    let message = `${prefix}: ${desc}`;
    if (body) message += `\n\n${body}`;
    if (breaking) message += `\n\nBREAKING CHANGE: `;
    if (footer) message += `\n\n${footer}`;

    return message;
  }, [type, scope, desc, body, breaking, footer]);

  const message = buildMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReset = () => {
    setType("feat");
    setScope("");
    setDesc("");
    setBody("");
    setBreaking(false);
    setFooter("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
          <FileText className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Git Commit Message Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate Conventional Commits formatted messages
          </p>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <Zap className="w-4 h-4 text-emerald-400" />
        <p className="text-sm text-emerald-400">
          100% Local Processing — all messages are generated in your browser
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {COMMIT_TYPES.map((commitType) => (
                <button
                  key={commitType.value}
                  onClick={() => setType(commitType.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-all ${
                    type === commitType.value
                      ? getColorClass(commitType.color)
                      : "bg-muted/50 border-transparent hover:bg-muted"
                  }`}
                >
                  {commitType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium mb-2">Scope (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g., api, ui, auth"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Custom</option>
                {SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description of the change"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use imperative mood: "add" not "added" or "adds"
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-2">Body (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Detailed description of the change..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div>
            <label className="block text-sm font-medium mb-2">Footer (optional)</label>
            <textarea
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Footer notes (e.g., Closes #123, Refs #456)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Breaking Change */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={breaking}
              onChange={(e) => setBreaking(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-background text-red-500 focus:ring-red-500"
            />
            <span className="text-sm">
              <span className="font-medium text-red-400">Breaking Change</span>
              <span className="text-muted-foreground ml-2">This commit contains breaking changes</span>
            </span>
          </label>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Examples
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-xs text-muted-foreground font-mono">commit message</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs hover:bg-muted transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
              {message || <span className="text-muted-foreground italic">Enter commit details above...</span>}
            </pre>
          </div>

          {/* Examples */}
          {showExamples && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Example Messages</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2 rounded bg-muted/50">
                  <span className="text-emerald-400">feat</span>
                  <span className="text-muted-foreground">:</span> add user authentication
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <span className="text-red-400">fix</span>
                  <span className="text-muted-foreground">(</span>
                  <span className="text-cyan-400">api</span>
                  <span className="text-muted-foreground">):</span> resolve login timeout issue
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <span className="text-purple-400">refactor</span>
                  <span className="text-muted-foreground">!</span>
                  <span className="text-muted-foreground">:</span> rename UserService to AccountService
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <span className="text-amber-400">build</span>
                  <span className="text-muted-foreground">(</span>
                  <span className="text-cyan-400">deps</span>
                  <span className="text-muted-foreground">):</span> upgrade dependencies
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <h3 className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-2">Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use imperative mood: "add" not "added"</li>
              <li>• Keep subject line under 50 characters</li>
              <li>• Separate subject from body with blank line</li>
              <li>• Reference issues: "Closes #123"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
        <p>
          Based on{" "}
          <a
            href="https://www.conventionalcommits.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Conventional Commits v1.0.0
          </a>
        </p>
      </div>
    </div>
  );
}
