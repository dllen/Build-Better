import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">
          {label}
        </p>
      )}
      <div className="relative bg-card rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
        <pre className="p-3 pr-10 text-xs leading-relaxed text-muted-foreground font-mono overflow-x-auto max-h-72">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
