import { useState, useCallback } from "react";
import { FileText, Copy, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function HtmlToText() {
  const { t } = useTranslation();
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const extractText = useCallback((htmlContent: string) => {
    if (!htmlContent.trim()) return "";

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Remove unwanted elements
      const toRemove = doc.querySelectorAll('script, style, noscript, iframe, object, embed, svg, head, meta, link');
      toRemove.forEach(el => el.remove());

      return getText(doc.body).trim();
    } catch (e) {
      console.error("Extraction error:", e);
      return "";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      if (tagName === 'br') return '\n';

      let content = "";
      const isBlock = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'tr', 'blockquote', 'section', 'article', 'header', 'footer', 'main', 'nav'].includes(tagName);

      // Prepend newline for block elements if not empty content
      if (isBlock) content += "\n";

      node.childNodes.forEach(child => {
        content += getText(child);
      });

      // Append newline for block elements
      if (isBlock) content += "\n";

      return content;
    }

    return "";
  };

  const handleConvert = () => {
    const result = extractText(html);
    // Cleanup multiple newlines
    const cleaned = result.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    setText(cleaned);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <SEO
            title={t("tools.html-to-text.name")}
            description={t("tools.html-to-text.desc")}
            keywords={["html to text", "extract text", "remove tags", "html cleaner"]}
          />
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("tools.html-to-text.name")}</h1>
            <p className="text-gray-500 mt-1">{t("tools.html-to-text.desc")}</p>
          </div>
        </>
      }
      toolbar={
        <>
          <button
            onClick={handleConvert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowRight className="h-4 w-4" />
            {t("tools.html-to-text.convert_btn")}
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? t("tools.html-to-text.copied") : t("tools.html-to-text.copy_btn")}
          </button>
        </>
      }
      inputLabel={t("tools.html-to-text.input_label")}
      input={
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="<p>Hello <b>World</b>!</p>"
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      }
      outputLabel={t("tools.html-to-text.output_label")}
      output={
        <textarea
          value={text}
          readOnly
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-gray-50 focus:outline-none"
        />
      }
    />
  );
}
