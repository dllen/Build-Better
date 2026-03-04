import React, { useState, useEffect, useMemo } from "react";
import { Copy, Download, RefreshCw, FileText, Code, Database, Terminal, Table as TableIcon } from "lucide-react";
import { parseCsvWebStream } from "../../../shared/csv-parser.mjs";

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

  const formats: { id: OutputFormat; name: string; icon: any }[] = [
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
      // Determine delimiter
      let actualDelimiter = delimiter;
      if (delimiter === "auto") {
        const firstLine = inputText.split("\n")[0];
        if (firstLine.includes("\t")) actualDelimiter = "\t";
        else actualDelimiter = ",";
      }

      // Create stream from string
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
        case "json_object":
          // rows are currently objects, we need array of values
          const arrayRows = rows.map((row: any) => headers.map((h: string) => row[h]));
          result = JSON.stringify(arrayRows, null, 2);
          break;
        case "json_column":
          const columns: any = {};
          headers.forEach((h: string) => {
            columns[h] = rows.map((row: any) => row[h]);
          });
          result = JSON.stringify(columns, null, 2);
          break;
        case "xml":
          result = `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n`;
          rows.forEach((row: any) => {
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
          result += rows.map((row: any) => {
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
          rows.forEach((row: any) => {
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
          rows.forEach((row: any) => {
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
          rows.forEach((row: any) => {
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
          rows.forEach((row: any) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-cyan-900/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                NEO_CONVERTER
              </h1>
              <p className="text-cyan-600/80 text-sm mt-1">DATA FORMAT TRANSFORMATION PROTOCOL</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Input Section */}
          <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-cyan-900/30 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-cyan-900/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <FileText className="w-4 h-4" />
                INPUT_DATA (CSV/Excel)
              </label>
              <div className="flex items-center gap-2">
                <select 
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="bg-slate-950 border border-cyan-800 text-cyan-400 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-cyan-500 outline-none"
                >
                  <option value="auto">AUTO_DETECT</option>
                  <option value=",">COMMA</option>
                  <option value="	">TAB</option>
                </select>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your CSV or Excel data here..."
              className="flex-1 w-full bg-slate-950/50 border border-cyan-900/50 rounded-lg p-4 text-sm text-cyan-100 placeholder-cyan-800/50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none font-mono leading-relaxed selection:bg-cyan-500/30 transition-all"
            />
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-cyan-900/30 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-purple-900/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                <Terminal className="w-4 h-4" />
                OUTPUT_DATA
              </label>
              <div className="flex items-center gap-2">
                {outputFormat === 'mysql' && (
                   <input 
                    type="text" 
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="table_name"
                    className="bg-slate-950 border border-purple-800 text-purple-400 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-purple-500 outline-none w-24"
                   />
                )}
                <select 
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="bg-slate-950 border border-purple-800 text-purple-400 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  {formats.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => navigator.clipboard.writeText(outputText)}
                  className="p-1.5 hover:bg-purple-900/30 text-purple-400 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1">
               {error ? (
                <div className="absolute inset-0 p-4 text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg">
                  ERROR: {error}
                </div>
               ) : (
                <textarea
                  readOnly
                  value={outputText}
                  placeholder="Waiting for input..."
                  className="w-full h-full bg-slate-950/50 border border-purple-900/50 rounded-lg p-4 text-sm text-purple-100 placeholder-purple-800/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none font-mono leading-relaxed selection:bg-purple-500/30 transition-all"
                />
               )}
               {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-lg">
                   <div className="flex flex-col items-center gap-2">
                     <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                     <span className="text-xs text-cyan-400 animate-pulse">PROCESSING...</span>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
