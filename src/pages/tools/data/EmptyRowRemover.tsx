import { useState } from "react";
import { Eraser } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { removeEmptyRows } from "@/lib/data/text";

export default function EmptyRowRemover() {
  const [input, setInput] = useState("Line one\n\nLine two\n   \nLine three");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleProcess = () => {
    try {
      setOutput(removeEmptyRows(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
    }
  };

  return (
    <CalculatorShell
      title="Empty Row Remover"
      subtitle="Automatically delete empty rows from your data."
      icon={Eraser}
      iconBgColor="bg-rose-100"
      iconColor="text-rose-600"
      keywords={["empty", "row", "remove", "clean", "text"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
              placeholder="Paste text with blank lines..."
            />
          </div>

          <button
            onClick={handleProcess}
            className="w-full py-2.5 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
          >
            Remove empty rows
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cleaned output</p>
          <textarea
            readOnly
            value={output}
            rows={10}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-mono text-gray-800 outline-none resize-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            disabled={!output}
            className="w-full py-2 px-4 border border-rose-600 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            Copy cleaned text
          </button>
        </div>
      }
    />
  );
}
