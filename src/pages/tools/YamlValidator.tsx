import { useState, useEffect } from "react";
import { FileJson, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Mode = "validate" | "format" | "to-json";

export default function YamlValidator() {
  const [mode, setMode] = useState<Mode>("validate");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fn = async () => {
      if (!input.trim()) {
        setOutput("");
        setError("");
        return;
      }

      try {
        const yaml = await import("js-yaml");
        const parsed = yaml.default.load(input);

      if (mode === "validate") {
        setOutput(`✅ Valid YAML\n\nType: ${Array.isArray(parsed) ? "Array" : typeof parsed}`);
        setError("");
        return;
      }

      if (mode === "format") {
        const formatted = yaml.default.dump(parsed, {
          indent: 2,
          lineWidth: 120,
          noRefs: true,
          sortKeys: false,
        });
        setOutput(formatted);
        setError("");
        return;
      }

      // to-json
      const json = JSON.stringify(parsed, null, 2);
      setOutput(json);
      setError("");
    } catch (e) {
        setError((e as Error).message);
        setOutput("");
      }
    };
    fn();
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output || error) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
            <FileJson className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">YAML Validator & Formatter</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {(["validate", "format", "to-json"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 font-medium capitalize ${mode === m ? "bg-cyan-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
                {m === "to-json" ? "To JSON" : m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setInput("")}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
              <RotateCcw size={14} /> Clear
            </button>
            <button onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Output"}
            </button>
          </div>
        </>
      }
      inputLabel="Input YAML"
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"server:\n  host: localhost\n  port: 8080\ndatabase:\n  url: postgres://..."}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      }
      outputLabel={mode === "to-json" ? "JSON Output" : mode === "validate" ? "Validation Result" : "Formatted YAML"}
      output={
        <div className="h-full relative">
          {error && (
            <div className="absolute inset-x-0 top-0 p-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-1 z-10">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
          <textarea
            readOnly
            value={output}
            className={`h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none ${error ? "pt-8" : ""} ${mode === "validate" && output.includes("✅") ? "bg-green-50" : "bg-gray-50"}`}
          />
        </div>
      }
    />
  );
}