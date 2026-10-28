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
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["email", "extractor", "scrape", "addresses"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Input text</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="Paste text containing email addresses..."
            />
          </div>

          <button
            onClick={handleExtract}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors text-sm font-medium"
          >
            Extract emails
          </button>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Found {emails.length} email{emails.length === 1 ? "" : "s"}
          </p>
          {emails.length > 0 ? (
            <>
              <div className="p-3 bg-muted rounded-lg max-h-96 overflow-auto text-sm font-mono text-foreground">
                {emails.join("\n")}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(emails.join("\n"))}
                className="w-full py-2 px-4 border border-border text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                Copy emails
              </button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No emails found yet</p>
          )}
        </div>
      }
    />
  );
}
