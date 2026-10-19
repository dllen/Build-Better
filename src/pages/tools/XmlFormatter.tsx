import { useState, useEffect } from "react";
import { FileCode, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Mode = "format" | "minify" | "validate";

export default function XmlFormatter() {
  const [mode, setMode] = useState<Mode>("format");
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
        const { XMLParser, XMLBuilder } = await import("fast-xml-parser");
      if (mode === "validate") {
        // Validate only — parse and report
        const parser = new XMLParser({
          ignoreAttributes: false,
          allowBooleanAttributes: true,
          processEntities: true,
        });
        parser.parse(input);
        setOutput("✅ Valid XML");
        setError("");
        return;
      }

      // Parse
      const parser = new XMLParser({
        ignoreAttributes: false,
        allowBooleanAttributes: true,
        processEntities: true,
        preserveOrder: true,
      });
      const parsed = parser.parse(input);

      // Build
      const builder = new XMLBuilder({
        format: mode === "format",
        indentBy: "  ",
        ignoreAttributes: false,
        preserveOrder: true,
      });
      const result = builder.build(parsed);
      setOutput(typeof result === "string" ? result : JSON.stringify(result, null, 2));
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
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
            <FileCode className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">XML Formatter & Validator</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {(["format", "minify", "validate"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 font-medium capitalize ${mode === m ? "bg-rose-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setInput("")}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
              <RotateCcw size={14} /> Clear
            </button>
            <button onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Output"}
            </button>
          </div>
        </>
      }
      inputLabel="Input XML"
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Hello</item>\n</root>'
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      }
      outputLabel={mode === "validate" ? "Validation Result" : "Formatted XML"}
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