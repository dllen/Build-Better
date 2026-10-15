import { useEffect, useState } from "react";
import { FileCode, Download, Eraser, AlertCircle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { parseJson } from "@/lib/json-convert";
import { jsonToExcelBase64 } from "@/lib/json-convert/formats/excel";

export default function JsonToExcel() {
  const [input, setInput] = useState(`[
  { "id": 1, "name": "Tom", "email": "tom@example.com" },
  { "id": 2, "name": "Lucy", "email": "lucy@example.com" }
]`);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  function validate() {
    if (!input.trim()) {
      setError(null);
      return null;
    }
    const parsed = parseJson(input);
    if (parsed.error) {
      setError(`第 ${parsed.errorLine} 行第 ${parsed.errorColumn} 列：${parsed.error}`);
      return null;
    }
    setError(null);
    return parsed.data;
  }

  async function download() {
    const parsed = validate();
    if (!parsed) return;
    setDownloading(true);
    try {
      const b64 = await jsonToExcelBase64(parsed);
      if (!b64) {
        setError("无法生成 Excel 文件，请确保输入是有效的 JSON 数据。");
        return;
      }
      const buf = Buffer.from(b64, "base64");
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setDownloading(false);
    }
  }

  function clear() {
    setInput("");
    setError(null);
  }

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FileCode className="h-5 w-5 text-blue-600" />
          <span>JSON → Excel</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={download}
            disabled={downloading || !input.trim()}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3 w-3" />
            {downloading ? "生成中..." : "下载 .xlsx"}
          </button>
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel="JSON 输入"
      inputActions={
        <span className="text-xs text-gray-500">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="在此粘贴或输入 JSON 数组或对象..."
        />
      }
      outputLabel="Excel 输出"
      outputActions={
        <button
          onClick={download}
          disabled={downloading || !input.trim()}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-3 w-3" />
          下载 .xlsx
        </button>
      }
      output={
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <FileCode className="h-12 w-12 text-gray-300" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">点击上方按钮生成 Excel 文件</p>
            <p className="text-xs text-gray-500">支持 JSON 数组和对象，自动提取所有键作为列标题</p>
          </div>
          {error ? (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          ) : null}
        </div>
      }
      footer={null}
    />
  );
}
