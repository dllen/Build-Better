import { useState, useEffect } from "react";
import { Code, Copy, Check, RotateCcw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextToHtml() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);

  const [wrapTag, setWrapTag] = useState("p");
  const [convertNewlines, setConvertNewlines] = useState(false);
  const [escapeHtml, setEscapeHtml] = useState(true);
  const [addAttributes, setAddAttributes] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const escape = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  useEffect(() => {
    if (!text) {
      setHtml("");
      return;
    }

    let processed = text;
    if (escapeHtml) {
      processed = escape(processed);
    }

    if (convertNewlines) {
      processed = processed.replace(/\n/g, "<br/>\n");
    }

    if (["p", "div", "li", "h1", "h2", "h3"].includes(wrapTag)) {
      const blocks = text.split(/\r?\n\s*\r?\n/).filter((b) => b.trim());
      const result = blocks.map((block) => {
        let content = block;
        if (escapeHtml) content = escape(content);
        if (convertNewlines) content = content.replace(/\n/g, "<br/>\n");
        const attrs = addAttributes ? ` ${addAttributes}` : "";
        return `<${wrapTag}${attrs}>${content}</${wrapTag}>`;
      });
      setHtml(result.join("\n"));
    } else {
      const attrs = addAttributes ? ` ${addAttributes}` : "";
      setHtml(wrapTag ? `<${wrapTag}${attrs}>${processed}</${wrapTag}>` : processed);
    }
  }, [text, wrapTag, convertNewlines, escapeHtml, addAttributes]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Code className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Text to HTML Converter</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Wrap with:</span>
            <select
              value={wrapTag}
              onChange={(e) => setWrapTag(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-md text-sm focus:ring-2 focus:ring-ring"
            >
              <option value="p">&lt;p&gt;</option>
              <option value="div">&lt;div&gt;</option>
              <option value="span">&lt;span&gt;</option>
              <option value="li">&lt;li&gt;</option>
              <option value="h1">&lt;h1&gt;</option>
              <option value="h2">&lt;h2&gt;</option>
              <option value="">None</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={convertNewlines}
              onChange={(e) => setConvertNewlines(e.target.checked)}
              className="rounded text-primary focus:ring-ring"
            />
            Convert newlines to &lt;br/&gt;
          </label>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={escapeHtml}
              onChange={(e) => setEscapeHtml(e.target.checked)}
              className="rounded text-primary focus:ring-ring"
            />
            Escape HTML characters
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Attributes:</span>
            <input
              type="text"
              value={addAttributes}
              onChange={(e) => setAddAttributes(e.target.value)}
              placeholder='class="text-red"'
              className="px-3 py-1.5 border border-border rounded-md text-sm focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setText("")}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors text-sm"
            >
              <RotateCcw size={14} />
              Clear
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
        </>
      }
      inputLabel="Input Text"
      input={
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter plain text..."
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      outputLabel="HTML Output"
      output={
        <textarea
          readOnly
          value={html}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-muted focus:outline-none"
        />
      }
    />
  );
}