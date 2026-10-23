import { useState } from "react";
import { Mail } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { extractEmails } from "@/lib/data/text";

export default function EmailExtractor() {
  const [input, setInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleExtract = () => {
    try {
      setEmails(extractEmails(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
    }
  };

  return (
    <CalculatorShell
      title="Email Address Extractor"
      subtitle="Scan text to find and display unique email addresses."
      icon={Mail}
      iconBgColor="bg-sky-100"
      iconColor="text-sky-600"
      keywords={["email", "extractor", "scrape", "addresses"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Input text</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              placeholder="Paste text containing email addresses..."
            />
          </div>

          <button
            onClick={handleExtract}
            className="w-full py-2.5 px-4 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
          >
            Extract emails
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Found {emails.length} email{emails.length === 1 ? "" : "s"}
          </p>
          {emails.length > 0 ? (
            <>
              <div className="p-3 bg-gray-50 rounded-lg max-h-96 overflow-auto text-sm font-mono text-gray-800">
                {emails.join("\n")}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(emails.join("\n"))}
                className="w-full py-2 px-4 border border-sky-600 text-sky-600 rounded-lg text-sm font-medium hover:bg-sky-50 transition-colors"
              >
                Copy emails
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No emails found yet</p>
          )}
        </div>
      }
    />
  );
}
