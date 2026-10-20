import { useState, useMemo, useEffect } from "react";
import { Server, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { SEO } from "@/components/seo";
import { convertHtaccess } from "@/lib/network/htaccessConvert";

const SAMPLE = `# Redirect www to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

ErrorDocument 404 /404.html
Header always set X-Frame-Options "SAMEORIGIN"
DirectoryIndex index.html index.php
Options -Indexes`;

export default function HtaccessToNginx() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const result = useMemo(() => (input.trim() ? convertHtaccess(input) : null), [input]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.nginx);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <SEO
        title="htaccess to nginx Converter"
        description="Convert Apache .htaccess files to nginx configuration — rewrites, redirects, headers and error pages."
        keywords={["htaccess to nginx", "apache to nginx", "htaccess converter", "nginx config generator", "rewrite rules"]}
      />
      <EditorSplitLayout
        title={
          <>
            <div className="p-2 bg-lime-100 text-lime-700 rounded-lg">
              <Server className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">htaccess → nginx</h1>
          </>
        }
        toolbar={
          <>
            <button
              onClick={() => setInput(SAMPLE)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <RotateCcw size={14} /> Sample
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setInput("")}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleCopy}
                disabled={!result}
                className="flex items-center gap-2 px-3 py-1.5 bg-lime-700 text-white rounded-lg hover:bg-lime-800 text-sm disabled:opacity-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy nginx"}
              </button>
            </div>
          </>
        }
        inputLabel=".htaccess"
        input={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your .htaccess here…"
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        }
        outputLabel={
          result
            ? `nginx.conf (${result.convertedCount} converted${
                result.warnings.length ? `, ${result.warnings.length} warning(s)` : ""
              })`
            : "nginx.conf"
        }
        output={
          <div className="h-full overflow-y-auto">
            {!result && <div className="p-6 text-sm text-gray-400">Paste .htaccess directives on the left.</div>}
            {result && (
              <>
                {result.warnings.length > 0 && (
                  <div className="p-2 bg-amber-50 border-b border-amber-200 space-y-1">
                    {result.warnings.slice(0, 8).map((w, i) => (
                      <div key={i} className="text-xs text-amber-800 flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>
                          Line {w.line}: {w.reason}
                        </span>
                      </div>
                    ))}
                    {result.warnings.length > 8 && (
                      <p className="text-xs text-amber-700">…and {result.warnings.length - 8} more</p>
                    )}
                  </div>
                )}
                <textarea
                  readOnly
                  value={result.nginx}
                  className="h-[calc(100%-0px)] w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none bg-gray-50"
                />
              </>
            )}
          </div>
        }
        footer={
          <p className="text-xs text-gray-500">
            Common directives (RewriteRule, Redirect, ErrorDocument, Header, auth) are translated. Complex RewriteCond
            chains are kept as comments — always review the generated nginx config before deploying.
          </p>
        }
      />
    </>
  );
}
