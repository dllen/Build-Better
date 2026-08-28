import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Eye,
  Code,
  FileText,
  Loader2,
  ChevronDown,
  LayoutTemplate,
} from "lucide-react";
import { render as renderEmail, type RenderWarning } from "emailmd";
import { SEO } from "@/components/SEO";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/data/email-templates";

type OutputTab = "html" | "text" | "preview";

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

const DEFAULT_MARKDOWN = `---
subject: Welcome to BuildBetter!
from: BuildBetter <hello@buildbetter.tools>
---

# Welcome to **BuildBetter**

Thanks for signing up! We're glad to have you.

Here are a few things you can try today:

- [Format your JSON](https://buildbetter.tools/json-editor)
- [Generate a strong password](https://buildbetter.tools/password-generator)
- [Render Markdown to email-safe HTML](https://buildbetter.tools/email-md)

## Your first newsletter

> Stay tuned — we'll be sending weekly tips every Tuesday.

{button} [Get started](https://buildbetter.tools){.btn-primary}

Cheers,
The BuildBetter Team
`;

const CATEGORY_ORDER = ["Onboarding", "E-Commerce", "Marketing", "Product", "Security", "Analytics", "Billing", "Events", "Feedback"];

function groupTemplatesByCategory(): [string, EmailTemplate[]][] {
  const groups = new Map<string, EmailTemplate[]>();
  for (const t of EMAIL_TEMPLATES) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category)!.push(t);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => [c, groups.get(c)!]);
}

export default function EmailMarkdown() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [warnings, setWarnings] = useState<RenderWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<OutputTab>("html");
  const [copied, setCopied] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Close template dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadTemplate = useCallback((t: EmailTemplate) => {
    setMarkdown(t.markdown);
    setTemplatesOpen(false);
  }, []);

  // Debounced render: 400ms after markdown changes
  useEffect(() => {
    const trimmed = markdown.trim();
    if (!trimmed) {
      setHtml("");
      setText("");
      setSubject("");
      setFrom("");
      setWarnings([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await renderEmail(trimmed);
        if (cancelled) return;
        setHtml(result.html ?? "");
        setText(result.text ?? "");
        setSubject(asString(result.meta?.subject));
        setFrom(asString(result.meta?.from));
        setWarnings(result.warnings ?? []);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown]);

  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const download = useCallback(
    (filename: string, content: string, mime: string) => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const downloadEmail = useCallback(() => {
    const boundary = "----=_EmailMd_" + Date.now();
    const parts = [
      `Content-Type: text/plain; charset="utf-8"\nContent-Transfer-Encoding: 8bit\n\n${text}`,
      `Content-Type: text/html; charset="utf-8"\nContent-Transfer-Encoding: quoted-printable\n\n${html}`,
    ];
    const eml = [
      subject ? `Subject: ${subject}` : "",
      from ? `From: ${from}` : "",
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      parts[0],
      `--${boundary}`,
      parts[1],
      `--${boundary}--`,
    ]
      .filter((s) => s !== "")
      .join("\r\n");
    download("email.eml", eml, "message/rfc822");
  }, [download, html, text, subject, from]);

  const activeOutput = useMemo(() => (tab === "html" ? html : text), [tab, html, text]);

  return (
    <>
      <SEO
        title="Markdown to Email HTML"
        description="Render Markdown into email-safe HTML for Gmail, Outlook, Apple Mail and more. Live preview, plain text fallback, and .eml download."
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Markdown → Email HTML</h1>
              <p className="text-sm text-gray-500">
                Powered by{" "}
                <a
                  href="https://github.com/anypost/emailmd"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-purple-600"
                >
                  emailmd
                </a>{" "}
                — renders to MJML under the hood, works in Gmail, Outlook, Apple Mail.
              </p>
            </div>
          </div>
          <button
            onClick={downloadEmail}
            disabled={!html}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Download .eml
          </button>
        </div>

        {/* Frontmatter summary */}
        {(subject || from) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
            {subject && (
              <div>
                <span className="font-medium text-gray-500">Subject:</span> {subject}
              </div>
            )}
            {from && (
              <div>
                <span className="font-medium text-gray-500">From:</span> {from}
              </div>
            )}
          </div>
        )}

        {/* Error / warnings */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <div className="font-medium">Render error</div>
            <pre className="mt-1 whitespace-pre-wrap break-words">{error}</pre>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </div>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i}>
                  [{w.stage}] {w.message}
                </li>
              ))}
              {warnings.length > 5 && (
                <li className="text-amber-600">…and {warnings.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Markdown
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={templateRef}>
                  <button
                    onClick={() => setTemplatesOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300
                               text-sm hover:bg-gray-50"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Templates
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {templatesOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-72 rounded-lg border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Choose a starter template
                      </div>
                      {groupTemplatesByCategory().map(([category, templates]) => (
                        <div key={category}>
                          <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {category}
                          </div>
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => loadTemplate(t)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            >
                              {t.title}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{markdown.length} chars</span>
              </div>
            </div>
            <textarea
              className="w-full h-[32rem] rounded-md border border-gray-300 px-3 py-2 font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              placeholder="# Hello&#10;&#10;Write your email in **Markdown**…"
            />
            <p className="text-xs text-gray-500">
              Tip: pick a <strong>template</strong> above, or include YAML frontmatter with <code>subject</code> /{" "}
              <code>from</code>, and use <code>{"{button}"}</code> for a CTA.
            </p>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm">
                {(
                  [
                    { id: "html", label: "HTML", icon: Code },
                    { id: "text", label: "Plain Text", icon: FileText },
                    { id: "preview", label: "Preview", icon: Eye },
                  ] as const
                ).map((t) => {
                  const active = tab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${
                        active
                          ? "bg-purple-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
                {tab !== "preview" && (
                  <button
                    onClick={() => copy(activeOutput, tab)}
                    disabled={!activeOutput}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300
                               text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    {copied === tab ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {tab === "preview" ? (
              <div className="rounded-md border border-gray-300 overflow-hidden bg-white">
                <iframe
                  title="Email preview"
                  srcDoc={html}
                  className="w-full h-[32rem] bg-white"
                  sandbox=""
                />
              </div>
            ) : (
              <pre
                className={`w-full h-[32rem] rounded-md border border-gray-300 bg-gray-50 p-3 text-xs
                            overflow-auto whitespace-pre-wrap break-words font-mono ${
                              tab === "html" ? "language-html" : ""
                            }`}
              >
                {activeOutput || (loading ? "Rendering…" : "Nothing to render yet.")}
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
