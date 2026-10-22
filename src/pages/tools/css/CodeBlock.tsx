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
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </p>
      )}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
        <pre className="p-3 pr-10 text-xs leading-relaxed text-gray-100 font-mono overflow-x-auto max-h-72">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
