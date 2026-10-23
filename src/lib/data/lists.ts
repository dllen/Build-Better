export interface NumberListInputs {
  start: number;
  end: number;
  step: number;
  type: "integer" | "float";
  prefix: string;
  suffix: string;
  leadingZeros: number;
  trailingZeros: number;
  separator: string;
}

export interface NumberListResult {
  count: number;
  list: string[];
}

export function generateNumberList(inputs: NumberListInputs): NumberListResult {
  const { start, end, step, type, prefix, suffix, leadingZeros, trailingZeros } = inputs;
  if (step === 0) throw new Error("Step cannot be zero");
  const list: string[] = [];
  const count = Math.max(0, Math.floor((end - start) / step) + 1);
  for (let i = 0; i < count; i++) {
    const value = start + i * step;
    const displayValue =
      type === "integer" ? Math.floor(value) : Number(value.toFixed(6));
    const str = displayValue.toString();
    const padded = str.padStart(str.length + leadingZeros, "0");
    if (trailingZeros > 0) {
      // not a real numeric zero, just append zeros as requested
      list.push(`${prefix}${padded}${"0".repeat(trailingZeros)}${suffix}`);
    } else {
      list.push(`${prefix}${padded}${suffix}`);
    }
  }
  return { count: list.length, list };
}

export type SortOrder = "asc" | "desc";
export type FilterType = "all" | "positive" | "negative" | "integer" | "decimal";

export interface NumberSortInputs {
  numbers: number[];
  order: SortOrder;
  filter: FilterType;
  decimals: number;
  dedupe: boolean;
}

export interface NumberSortResult {
  count: number;
  numbers: number[];
  removed: number;
}

export function sortAndFilterNumbers(inputs: NumberSortInputs): NumberSortResult {
  const { numbers, order, filter, decimals, dedupe } = inputs;
  let working = numbers.filter((n) => Number.isFinite(n));

  switch (filter) {
    case "positive":
      working = working.filter((n) => n > 0);
      break;
    case "negative":
      working = working.filter((n) => n < 0);
      break;
    case "integer":
      working = working.filter((n) => Number.isInteger(n));
      break;
    case "decimal":
      working = working.filter((n) => !Number.isInteger(n));
      break;
  }

  const beforeDedupe = working.length;
  if (dedupe) {
    working = Array.from(new Set(working.map((n) => Number(n.toFixed(decimals))))).map(Number);
  }

  working.sort((a, b) => (order === "asc" ? a - b : b - a));
  working = working.map((n) => Number(n.toFixed(decimals)));

  return {
    count: working.length,
    numbers: working,
    removed: beforeDedupe - working.length + (numbers.length - beforeDedupe),
  };
}
