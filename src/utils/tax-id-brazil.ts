/**
 * Brazil CPF and CNPJ validation and generation utilities.
 * CPF: Cadastro de Pessoas Físicas (individual taxpayer registry)
 * CNPJ: Cadastro Nacional da Pessoa Jurídica (business registry)
 */

// ─── CPF ─────────────────────────────────────────────────────────────────────

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Validate a CPF string. Returns false for formatted or invalid numbers. */
export function validateCPF(cpf: string): boolean {
  const raw = digitsOnly(cpf);
  if (raw.length !== 11) return false;
  // Reject known invalid CPFs (all same digit)
  if (/^(\d)\1{10}$/.test(raw)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(raw[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (parseInt(raw[9]) !== remainder) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(raw[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return parseInt(raw[10]) === remainder;
}

/** Generate a valid CPF from a birth date string (DD/MM/YYYY).
 *  The first 9 digits are derived from the date; the last 2 are computed check digits.
 *  The "name" param is unused but kept for API compatibility. */
export function generateCPF(birthDate: string = ""): string {
  // If a date is provided, encode it into digits 0-7 for reproducibility
  let base = "000000000";
  if (birthDate) {
    const nums = digitsOnly(birthDate); // up to 8 digits (DDMMYYYY)
    base = (nums + "000000000").slice(0, 9);
  }
  // For truly random generation, just make a random 9-digit base
  const rawBase = birthDate ? base : Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(rawBase[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder < 2) remainder = 0;
  const d1 = remainder.toString();

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = i < 9 ? parseInt(rawBase[i]) : parseInt(d1);
    sum += digit * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder < 2) remainder = 0;
  const d2 = remainder.toString();

  return rawBase + d1 + d2;
}

/** Format a raw 11-digit CPF as XXX.XXX.XXX-XX */
export function formatCPF(cpf: string): string {
  const raw = digitsOnly(cpf).padStart(11, "0").slice(0, 11);
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
}

// ─── CNPJ ────────────────────────────────────────────────────────────────────

/** Validate a CNPJ string. Returns false for formatted or invalid numbers. */
export function validateCNPJ(cnpj: string): boolean {
  const raw = digitsOnly(cnpj);
  if (raw.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(raw)) return false;

  // First check digit (weights: 5,4,3,2,9,8,7,6,5,4,3,2)
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(raw[i]) * w1[i];
  let remainder = sum % 11;
  const d1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(raw[12]) !== d1) return false;

  // Second check digit (weights: 6,5,4,3,2,9,8,7,6,5,4,3,2)
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(raw[i]) * w2[i];
  remainder = sum % 11;
  const d2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(raw[13]) === d2;
}

/** Generate a valid CNPJ. registrationDate format: DD/MM/YYYY.
 *  Digits 0-7 encode establishment date info for reproducibility. */
export function generateCNPJ(registrationDate: string = ""): string {
  let base = "000000000000";
  if (registrationDate) {
    const nums = digitsOnly(registrationDate); // up to 8 digits
    base = (nums + "000000").slice(0, 12);
  }
  const rawBase = registrationDate ? base : Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");

  // First check digit
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(rawBase[i]) * w1[i];
  let remainder = sum % 11;
  const d1 = remainder < 2 ? 0 : 11 - remainder;

  // Second check digit
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    const digit = i < 12 ? parseInt(rawBase[i]) : d1;
    sum += digit * w2[i];
  }
  remainder = sum % 11;
  const d2 = remainder < 2 ? 0 : 11 - remainder;

  return rawBase + d1 + d2;
}

/** Format a raw 14-digit CNPJ as XX.XXX.XXX/XXXX-XX */
export function formatCNPJ(cnpj: string): string {
  const raw = digitsOnly(cnpj).padStart(14, "0").slice(0, 14);
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "evp";

/** Validate a Pix key by its type. */
export function validatePixKey(key: string, type: PixKeyType): boolean {
  switch (type) {
    case "cpf":   return validateCPF(key);
    case "cnpj": return validateCNPJ(key);
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case "phone": return /^\+55\d{10,11}$/.test(key);
    case "evp":   return /^[A-Fa-f0-9]{32,36}$/.test(key);
  }
}

/** Format a Pix key for display */
export function formatPixKey(key: string, type: PixKeyType): string {
  switch (type) {
    case "cpf":   return formatCPF(key);
    case "cnpj":  return formatCNPJ(key);
    case "email": return key.toLowerCase().trim();
    case "phone": return `+55 ${key.slice(3).replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")}`;
    case "evp":   return key.toUpperCase();
  }
}
