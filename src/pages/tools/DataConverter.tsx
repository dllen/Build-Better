import { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, FileText, Code, Database, Terminal, Table as TableIcon } from "lucide-react";
import { parseCsvWebStream } from "../../../shared/csv-parser.mjs";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type OutputFormat =
  | "json_array"
  | "json_object"
  | "json_column"
  | "xml"
  | "mysql"
  | "html"
  | "php"
  | "python"
  | "ruby";

export default function DataConverter() {
  const [inputText, setInputText] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("json_array");
  const [delimiter, setDelimiter] = useState("auto");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableName, setTableName] = useState("my_table");
  const [copied, setCopied] = useState(false);

  const formats: { id: OutputFormat; name: string; icon: unknown }[] = [
    { id: "json_array", name: "JSON - Array of Objects", icon: Code },
    { id: "json_object", name: "JSON - Rows as Arrays", icon: Code },
    { id: "json_column", name: "JSON - Columns as Arrays", icon: Code },
    { id: "xml", name: "XML - Nodes", icon: Code },
    { id: "mysql", name: "MySQL - Insert", icon: Database },
    { id: "html", name: "HTML - Table", icon: TableIcon },
    { id: "php", name: "PHP - Array", icon: Terminal },
    { id: "python", name: "Python - Dict", icon: Terminal },
    { id: "ruby", name: "Ruby - Hash", icon: Terminal },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      convert();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, outputFormat, delimiter, tableName]);

  async function convert() {
    if (!inputText.trim()) {
      setOutputText("");
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let actualDelimiter = delimiter;
      if (delimiter === "auto") {
        const firstLine = inputText.split("\n")[0];
        if (firstLine.includes("\t")) actualDelimiter = "\t";
        else actualDelimiter = ",";
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(inputText));
          controller.close();
        },
      });

      const { rows, headers } = await parseCsvWebStream(stream, {
        delimiter: actualDelimiter,
        quote: '"',
        parseNumber: true,
      });

      if (!rows || rows.length === 0) {
        setOutputText("");
        return;
      }

      let result = "";

      switch (outputFormat) {
        case "json_array":
          result = JSON.stringify(rows, null, 2);
          break;
        case "json_object": {
          const arrayRows = rows.map((row: Record<string, unknown>) => headers.map((h: string) => row[h]));
          result = JSON.stringify(arrayRows, null, 2);
          break;
        }
        case "json_column": {
          const columns: Record<string, unknown> = {};
          headers.forEach((h: string) => {
            columns[h] = rows.map((row: Record<string, unknown>) => row[h]);
          });
          result = JSON.stringify(columns, null, 2);
          break;
        }
        case "xml":
          result = `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n`;
          rows.forEach((row: Record<string, unknown>) => {
            result += `  <row>\n`;
            headers.forEach((h: string) => {
              const tag = h.replace(/[^a-zA-Z0-9_-]/g, "_");
              result += `    <${tag}>${row[h]}</${tag}>\n`;
            });
            result += `  </row>\n`;
          });
          result += `</rows>`;
          break;
        case "mysql":
          result = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
          result += headers.map((h: string) => `  \`${h}\` VARCHAR(255)`).join(",\n");
          result += `\n);\n\nINSERT INTO ${tableName} (${headers.map((h: string) => `\`${h}\``).join(", ")}) VALUES\n`;
          result += rows.map((row: Record<string, unknown>) => {
            const values = headers.map((h: string) => {
              const val = row[h];
              if (typeof val === "number") return val;
              return `'${String(val).replace(/'/g, "\\'")}'`;
            }).join(", ");
            return `(${values})`;
          }).join(",\n") + ";";
          break;
        case "html":
          result = `<table>\n  <thead>\n    <tr>\n`;
          headers.forEach((h: string) => {
            result += `      <th>${h}</th>\n`;
          });
          result += `    </tr>\n  </thead>\n  <tbody>\n`;
          rows.forEach((row: Record<string, unknown>) => {
            result += `    <tr>\n`;
            headers.forEach((h: string) => {
              result += `      <td>${row[h]}</td>\n`;
            });
            result += `    </tr>\n`;
          });
          result += `  </tbody>\n</table>`;
          break;
        case "php":
          result = `$data = array(\n`;
          rows.forEach((row: Record<string, unknown>) => {
            result += `  array(\n`;
            headers.forEach((h: string) => {
              const val = row[h];
              const valStr = typeof val === "number" ? val : `"${String(val).replace(/"/g, '\\"')}"`;
              result += `    "${h}" => ${valStr},\n`;
            });
            result += `  ),\n`;
          });
          result += `);`;
          break;
        case "python":
          result = `data = [\n`;
          rows.forEach((row: Record<string, unknown>) => {
            result += `    {\n`;
            headers.forEach((h: string) => {
              const val = row[h];
              const valStr = typeof val === "number" ? val : `"${String(val).replace(/"/g, '\\"')}"`;
              result += `        "${h}": ${valStr},\n`;
            });
            result += `    },\n`;
          });
          result += `]`;
          break;
        case "ruby":
          result = `data = [\n`;
          rows.forEach((row: Record<string, unknown>) => {
            result += `  {\n`;
            headers.forEach((h: string) => {
              const val = row[h];
              const valStr = typeof val === "number" ? val : `"${String(val).replace(/"/g, '\\"')}"`;
              result += `    "${h}" => ${valStr},\n`;
            });
            result += `  },\n`;
          });
          result += `]`;
          break;
      }

      setOutputText(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Data Converter</h1>
            <p className="text-sm text-gray-500">CSV / Excel → JSON, XML, MySQL, HTML, and more</p>
          </div>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Delimiter</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="auto">Auto Detect</option>
              <option value=",">Comma</option>
              <option value={"	"}>Tab</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Output</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {outputFormat === "mysql" && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Table</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="table_name"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
              />
            </div>
          )}
        </>
      }
      inputLabel={
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Input (CSV/Excel)
        </span>
      }
      input={
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your CSV or Excel data here..."
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      outputLabel={
        <span className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Output
          {loading && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
        </span>
      }
      outputActions={
        <button
          onClick={handleCopy}
          disabled={!outputText}
          className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-1.5 text-xs disabled:opacity-50 hover:bg-gray-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        error ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : (
          <textarea
            readOnly
            value={outputText}
            placeholder="Waiting for input..."
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-gray-50 focus:outline-none"
          />
        )
      }
    />
  );
}