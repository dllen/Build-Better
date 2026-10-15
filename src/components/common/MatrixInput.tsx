import { Plus, X } from "lucide-react";

interface MatrixInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function MatrixInput({ value, onChange, placeholder }: MatrixInputProps) {
  const rows = value ? value.split("\n") : [""];

  const updateCell = (rowIdx: number, colIdx: number, cell: string) => {
    const newRows = [...rows];
    const cells = newRows[rowIdx].split("\t");
    cells[colIdx] = cell;
    newRows[rowIdx] = cells.join("\t");
    onChange(newRows.join("\n"));
  };

  const addRow = () => {
    onChange(value + (value ? "\n" : "") + "\t\t");
  };

  const removeRow = (idx: number) => {
    const newRows = rows.filter((_, i) => i !== idx);
    onChange(newRows.join("\n"));
  };

  // Compute max columns
  const maxCols = Math.max(3, ...rows.map((r) => Math.max(1, r.split("\t").length)));

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <table className="border-collapse">
        <tbody>
          {rows.map((row, rowIdx) => {
            const cells = row.split("\t");
            while (cells.length < maxCols) cells.push("");
            return (
              <tr key={rowIdx}>
                {cells.slice(0, maxCols).map((cell, colIdx) => (
                  <td key={colIdx} className="border border-gray-300 dark:border-gray-700">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      placeholder={placeholder}
                      className="w-20 px-2 py-1 bg-transparent outline-none font-mono text-sm"
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    aria-label="Delete row"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Plus className="h-3 w-3" /> Add Row
      </button>
    </div>
  );
}
