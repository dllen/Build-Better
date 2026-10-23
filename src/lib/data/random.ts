export interface RandomNumberOptions {
  min: number;
  max: number;
  quantity: number;
  integer: boolean;
  unique: boolean;
}

export interface RandomNumberResult {
  numbers: number[];
  rejectedDuplicates: number;
}

export function generateRandomNumbers(options: RandomNumberOptions): RandomNumberResult {
  const { min, max, quantity, integer, unique } = options;
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error("Min and max must be finite numbers");
  }
  if (min > max) {
    throw new Error("Min cannot be greater than max");
  }
  if (quantity < 1 || quantity > 1000) {
    throw new Error("Quantity must be between 1 and 1000");
  }

  const range = max - min;
  if (integer && unique && range + 1 < quantity) {
    throw new Error(
      `Cannot generate ${quantity} unique integers in range ${min}–${max} (only ${Math.floor(
        range + 1
      )} possible values)`
    );
  }

  const seen = new Set<number>();
  const numbers: number[] = [];
  let rejectedDuplicates = 0;

  if (unique) {
    const pool: number[] = [];
    if (integer) {
      for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
        pool.push(v);
      }
    } else {
      // For decimals in a range, use the requested quantity as a safety cap
      for (let i = 0; i < quantity * 10; i++) {
        const raw = Math.random() * range + min;
        pool.push(Number(raw.toFixed(6)));
      }
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = integer ? pool : pool.slice(0, Math.min(quantity, pool.length));
    const uniqueNumbers = picked.slice(0, quantity);
    numbers.push(...uniqueNumbers);
    rejectedDuplicates = 0;
    return { numbers: uniqueNumbers, rejectedDuplicates };
  }

  while (numbers.length < quantity) {
    const raw = Math.random() * range + min;
    const n = integer ? Math.floor(raw) : Number(raw.toFixed(6));
    if (unique) {
      if (seen.has(n)) {
        rejectedDuplicates++;
        continue;
      }
      seen.add(n);
    }
    numbers.push(n);
  }

  return { numbers, rejectedDuplicates };
}

export type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export type RollMode = "sum" | "individual";

export interface DiceRollResult {
  dice: { type: DieType; rolls: number[] }[];
  total: number;
}

export function rollDice(
  dieType: DieType,
  count: number,
  _mode: RollMode
): DiceRollResult {
  if (count < 1 || count > 100) {
    throw new Error("Number of dice must be between 1 and 100");
  }
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * dieType) + 1);
  }
  const total = rolls.reduce((a, b) => a + b, 0);
  return {
    dice: [{ type: dieType, rolls }],
    total,
  };
}
