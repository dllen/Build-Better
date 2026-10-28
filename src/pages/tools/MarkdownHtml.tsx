import { useEffect, useMemo, useState } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { marked } from "marked";
import TurndownService from "turndown";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const turndown = new TurndownService();

export default function MarkdownHtml() {
  const [markdown, setMarkdown] = useState<string>("# Hello\n\nThis is **Markdown**.");
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState<"md" | "html" | null>(null);

  const htmlFromMarkdown = useMemo(() => marked.parse(markdown) as string, [markdown]);
  const markdownFromHtml = useMemo(() => turndown.turndown(html), [html]);

  useEffect(() => {
    setHtml(htmlFromMarkdown);
  }, [htmlFromMarkdown]);

  function copyText(text: string, kind: "md" | "html") {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-success/10 text-success">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Markdown ↔ HTML Converter</h1>
        </>
      }
      toolbar={
        <>
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary"
            onClick={() => setHtml(htmlFromMarkdown)}
          >
            Convert → HTML
          </button>
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary"
            onClick={() => setMarkdown(markdownFromHtml)}
          >
            Convert → Markdown
          </button>
        </>
      }
      inputLabel="Markdown"
      inputActions={
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
          onClick={() => copyText(markdown, "md")}
          disabled={!markdown}
        >
          {copied === "md" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
      }
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Write Markdown here..."
        />
      }
      outputLabel="HTML"
      outputActions={
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
          onClick={() => copyText(html, "html")}
          disabled={!html}
        >
          {copied === "html" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
      }
      output={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="<h1>Hello</h1>"
        />
      }
      footer={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="font-medium mb-2 text-sm">HTML Preview (from Markdown)</div>
            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {htmlFromMarkdown}
            </pre>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="font-medium mb-2 text-sm">Markdown Preview (from HTML)</div>
            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {markdownFromHtml}
            </pre>
          </div>
        </div>
      }
    />
  );
}