import { useState, useCallback } from "react";
import { Plus, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function parseMatrix(text: string): number[][] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  const matrix: number[][] = [];
  for (const line of lines) {
    const values = line
      .split(/[\s,]+/)
      .filter((v) => v.length > 0)
      .map(Number);
    if (values.some(isNaN)) return null;
    if (values.length === 0) continue;
    matrix.push(values);
    if (matrix.length > 1 && values.length !== matrix[0].length) return null;
  }
  return matrix.length > 0 ? matrix : null;
}

function formatMatrix(matrix: number[][], decimals = 4): string {
  if (matrix.length === 0) return "";

  const formatted = matrix.map((row) =>
    row.map((v) => {
      if (Math.abs(v) < 1e-10) return "0";
      const s = v.toFixed(decimals);
      return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
    }),
  );

  const colWidths = formatted[0].map((_, ci) =>
    Math.max(...formatted.map((row) => row[ci].length)),
  );

  return formatted
    .map((row) => row.map((v, ci) => v.padStart(colWidths[ci])).join("  "))
    .join("\n");
}

export default function AddSubtractMatrices() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleCompute = useCallback(() => {
    setError("");

    const matrixA = parseMatrix(inputA);
    if (!matrixA) {
      setError("Matrix A is invalid. Ensure rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    const matrixB = parseMatrix(inputB);
    if (!matrixB) {
      setError("Matrix B is invalid. Ensure rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
      setError(
        `Dimension mismatch: Matrix A is ${matrixA.length}x${matrixA[0].length}, Matrix B is ${matrixB.length}x${matrixB[0].length}. Both matrices must have the same dimensions.`,
      );
      setOutput("");
      return;
    }

    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const result: number[][] = [];

    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(
          operation === "add"
            ? matrixA[i][j] + matrixB[i][j]
            : matrixA[i][j] - matrixB[i][j],
        );
      }
      result.push(row);
    }

    const opLabel = operation === "add" ? "A + B" : "A - B";
    setOutput(`${opLabel}:\n${formatMatrix(result)}`);
  }, [inputA, inputB, operation]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Plus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matrix Addition & Subtraction</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={operation}
            onChange={(e) => {
              setOperation(e.target.value as "add" | "subtract");
              setOutput("");
              setError("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
          >
            <option value="add">Add (A + B)</option>
            <option value="subtract">Subtract (A - B)</option>
          </select>
          <button
            onClick={handleCompute}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Compute
          </button>
        </div>
      }
      inputLabel="Matrices A and B"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block px-4 pt-3 pb-1 text-xs font-medium text-gray-500">
                Matrix A
              </label>
              <textarea
                value={inputA}
                onChange={(e) => {
                  setInputA(e.target.value);
                  setOutput("");
                  setError("");
                }}
                placeholder={`1 2 3\n4 5 6\n7 8 9`}
                className="flex-1 min-h-[80px] resize-none border-0 bg-transparent px-4 py-1 text-sm font-mono focus:outline-none"
                spellCheck={false}
              />
            </div>
            <div className="border-t border-gray-200 flex-1 min-h-0 flex flex-col">
              <label className="block px-4 pt-3 pb-1 text-xs font-medium text-gray-500">
                Matrix B
              </label>
              <textarea
                value={inputB}
                onChange={(e) => {
                  setInputB(e.target.value);
                  setOutput("");
                  setError("");
                }}
                placeholder={`9 8 7\n6 5 4\n3 2 1`}
                className="flex-1 min-h-[80px] resize-none border-0 bg-transparent px-4 py-1 text-sm font-mono focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      }
      outputLabel="Result"
      outputActions={
        output ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <pre className="text-sm font-mono text-gray-800 leading-relaxed">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                "Result matrix will appear here"
              )}
            </div>
          )}
        </div>
      }
    />
  );
}