import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService();

export default function MarkdownHtml() {
  const [markdown, setMarkdown] = useState<string>("# Hello\n\nThis is **Markdown**.");
  const [html, setHtml] = useState<string>("");

  const htmlFromMarkdown = useMemo(() => marked.parse(markdown) as string, [markdown]);
  const markdownFromHtml = useMemo(() => turndown.turndown(html), [html]);

  useEffect(() => {
    setHtml(htmlFromMarkdown);
  }, [htmlFromMarkdown]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-green-100 text-green-600">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Markdown ↔ HTML Converter</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Markdown</div>
            <button
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm"
              onClick={() => setHtml(htmlFromMarkdown)}
            >
              Convert → HTML
            </button>
          </div>
          <textarea
            className="w-full h-72 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2">HTML (Preview)</div>
            <pre className="text-xs overflow-auto max-h-52 whitespace-pre-wrap break-words">
              {htmlFromMarkdown}
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">HTML</div>
            <button
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm"
              onClick={() => setMarkdown(markdownFromHtml)}
            >
              Convert → Markdown
            </button>
          </div>
          <textarea
            className="w-full h-72 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<h1>Hello</h1>"
          />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2">Markdown (Preview)</div>
            <pre className="text-xs overflow-auto max-h-52 whitespace-pre-wrap break-words">
              {markdownFromHtml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
