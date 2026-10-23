export interface CoefficientInputs {
  values: number[];
  sample: boolean;
  decimals: number;
}

export interface CoefficientResult {
  mean: number;
  stdDev: number;
  coefficient: number;
  count: number;
}

export function coefficientOfVariation(inputs: CoefficientInputs): CoefficientResult {
  const values = inputs.values.filter((n) => Number.isFinite(n));
  if (values.length < 2) {
    throw new Error("At least two numeric values are required");
  }
  const count = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / count;
  if (mean === 0) {
    throw new Error("Mean is zero; coefficient of variation is undefined");
  }
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (inputs.sample ? count - 1 : count);
  const stdDev = Math.sqrt(variance);
  const coefficient = (stdDev / mean) * 100;
  return {
    mean,
    stdDev,
    coefficient: Number(coefficient.toFixed(inputs.decimals ?? 4)),
    count,
  };
}

export interface SampleSizeInputs {
  population: number;
  confidence: number;
  marginOfError: number;
  responseProportion: number;
}

const Z_MAP: Record<number, number> = {
  50: 0.674,
  68: 0.995,
  80: 1.282,
  85: 1.44,
  90: 1.645,
  95: 1.96,
  96: 2.054,
  97: 2.17,
  98: 2.326,
  99: 2.576,
  99.5: 2.807,
  99.9: 3.291,
};

export function sampleSize(inputs: SampleSizeInputs): number {
  const { population, confidence, marginOfError, responseProportion } = inputs;
  if (population <= 0) throw new Error("Population must be greater than 0");
  if (marginOfError <= 0 || marginOfError >= 100) {
    throw new Error("Margin of error must be between 0 and 100");
  }
  if (responseProportion < 0 || responseProportion > 100) {
    throw new Error("Response proportion must be between 0 and 100");
  }

  const z = Z_MAP[confidence] ?? 1.96;
  const p = responseProportion / 100;
  const e = marginOfError / 100;

  const numerator = Math.pow(z, 2) * p * (1 - p);
  const denominator = Math.pow(e, 2) + Math.pow(z, 2) * p * (1 - p) / population;
  return Math.ceil(numerator / denominator);
}
