export type PercentageMode =
  | "percentageOf"
  | "whatPercentage"
  | "increase"
  | "decrease"
  | "difference";

export interface PercentageInputs {
  mode: PercentageMode;
  a: number;
  b: number;
}

export interface PercentageResult {
  mode: PercentageMode;
  value: number;
  label: string;
}

export function percentageCalc(inputs: PercentageInputs): PercentageResult {
  const { mode, a, b } = inputs;
  switch (mode) {
    case "percentageOf":
      return { mode, value: (a / 100) * b, label: `${a}% of ${b}` };
    case "whatPercentage":
      if (b === 0) throw new Error("Base value cannot be zero");
      return { mode, value: (a / b) * 100, label: `${a} is what % of ${b}` };
    case "increase":
      if (b === 0) throw new Error("Base value cannot be zero");
      return { mode, value: a * (1 + b / 100), label: `${a} increased by ${b}%` };
    case "decrease":
      if (b === 0) throw new Error("Base value cannot be zero");
      return { mode, value: a * (1 - b / 100), label: `${a} decreased by ${b}%` };
    case "difference":
      if (b === 0) throw new Error("Base value cannot be zero");
      return { mode, value: ((a - b) / Math.abs(b)) * 100, label: `% difference between ${a} and ${b}` };
    default:
      throw new Error("Unknown percentage calculation mode");
  }
}

export type AreaShape =
  | "rectangle"
  | "square"
  | "circle"
  | "triangle"
  | "trapezoid"
  | "parallelogram"
  | "ellipse";

export interface AreaInputs {
  shape: AreaShape;
  a: number;
  b?: number;
  c?: number;
  unit: string;
}

export interface AreaResult {
  shape: AreaShape;
  area: number;
  unit: string;
  formula: string;
}

export function areaOf(inputs: AreaInputs): AreaResult {
  const { shape, a, b = 0, c = 0, unit } = inputs;
  let area = 0;
  let formula = "";

  switch (shape) {
    case "rectangle":
      area = a * b;
      formula = "length × width";
      break;
    case "square":
      area = a * a;
      formula = "side²";
      break;
    case "circle":
      area = Math.PI * a * a;
      formula = "π × radius²";
      break;
    case "triangle":
      area = (a * b) / 2;
      formula = "(base × height) / 2";
      break;
    case "trapezoid":
      area = ((a + b) * c) / 2;
      formula = "((base1 + base2) × height) / 2";
      break;
    case "parallelogram":
      area = a * b;
      formula = "base × height";
      break;
    case "ellipse":
      area = Math.PI * a * b;
      formula = "π × a × b";
      break;
  }

  return { shape, area: Number(area.toFixed(6)), unit, formula };
}

export interface BinaryDivisionStep {
  quotientBit: string;
  partialDividend: string;
  remainder: string;
}

export interface BinaryDivisionResult {
  dividend: string;
  divisor: string;
  quotient: string;
  remainder: string;
  steps: BinaryDivisionStep[];
  decimalQuotient: number;
}

function parseBinary(s: string): number {
  if (!/^[01]+$/.test(s)) throw new Error("Input must contain only 0s and 1s");
  return parseInt(s, 2);
}

export function divideBinary(dividend: string, divisor: string): BinaryDivisionResult {
  const a = parseBinary(dividend);
  const b = parseBinary(divisor);
  if (b === 0) throw new Error("Divisor cannot be zero");

  const quotientInt = Math.floor(a / b);
  const remainderInt = a % b;
  const quotient = quotientInt.toString(2);
  const remainder = remainderInt.toString(2);

  const steps: BinaryDivisionStep[] = [];
  let working = "";
  for (let i = 0; i < dividend.length; i++) {
    working += dividend[i];
    const workingVal = parseInt(working, 2);
    if (workingVal >= b) {
      const sub = (workingVal - b).toString(2);
      steps.push({
        quotientBit: "1",
        partialDividend: working,
        remainder: sub,
      });
      working = sub;
    } else {
      steps.push({
        quotientBit: "0",
        partialDividend: working,
        remainder: working,
      });
    }
  }

  return {
    dividend,
    divisor,
    quotient,
    remainder,
    steps,
    decimalQuotient: quotientInt,
  };
}
