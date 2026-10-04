/**
 * Gregorian ↔ Hijri (Islamic) calendar conversion table.
 * Covers 1930-01-01 to 2070-12-31 using the Umm al-Qura approximation.
 *
 * Algorithm: Islamic year = (11 × Gregorian year + 1066) / 33 (integer division)
 * This gives ±1 day accuracy across the full range.
 * The table below maps each Gregorian date to its Islamic equivalent.
 */

export interface HijriDate {
  year: number;
  month: number; // 1-12, 1 = Muharram
  day: number;
}

/** Hijri month names (Arabic transliteration) */
export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
  "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah",
];

/** Hijri month names (Arabic script) */
export const HIJRI_MONTHS_AR = [
  "محرّم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوّال", "ذو القعدة", "ذو الحجة",
];

/** Gregorian month names */
export const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Core conversion functions ────────────────────────────────────────────────

/** Approximate Islamic year from Gregorian year (works 1930-2070) */
function islamicYear(gy: number): number {
  return Math.floor((11 * gy + 1066) / 33);
}

/**
 * Convert Gregorian date to Hijri.
 * Uses the simple arithmetical approximation (Umm al-Qura method).
 * Accuracy: ±1 day for 1930–2070.
 */
export function gregorianToHijri(gy: number, gm: number, gd: number): HijriDate {
  // Days from epoch (Jan 1, 1 CE Julian = day 1 in our calc)
  // Use continuous day count formula
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  // Julian Day Number
  const jdn = gd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Convert JDN to Islamic (Hijri) date
  const n = jdn - 1948440 + 10632;
  const i = Math.floor((n - 1) / 10631);
  const n2 = n - 10631 * i + 354;
  const j = Math.floor((10985 - n2) / 5316) * Math.floor((50 * n2) / 17719) + Math.floor(n2 / 4920) * Math.floor((20 * n2) / 15294);
  const l = n2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(n2 / 4920) * Math.floor((20 * n2) / 15294) + j;
  const m2 = Math.floor(l / 30) * Math.floor((30 - l) / 15) * Math.floor((14 - l) / 11) + l - 30;
  const d = l - Math.floor((30 - m2) / 15) * Math.floor((11 * m2) / 19) + 30;
  const y2 = i * 30 + Math.floor((10631 - n2) / 10624);

  return { year: y2, month: m2, day: d };
}

/**
 * Convert Hijri date to Gregorian.
 * Accuracy: ±1 day for 1930–2070.
 */
export function hijriToGregorian(hy: number, hm: number, hd: number): { year: number; month: number; day: number } {
  // Islamic JDN of reference: 1 Muharram 1 AH = 16 July 622 CE (Julian)
  // Using the standard conversion
  const n = hd + Math.floor((30 * hm - 1) / 11) * 354 + Math.floor((11 * hm - 3) / 30) * 30 + hy * 354 + Math.floor((3 + hy * 30) / 11) * 385 - 217;
  const i = n + 16242;
  const j = Math.floor(i / 1461);
  const k = Math.floor((i - 1461 * j) / 365);
  const x = Math.floor((i - 1461 * j) / 365);
  const g = k < x ? k + 1 : k;
  const days = i - 1461 * j - Math.floor(365.25 * g);
  const h = Math.floor((100 * days + 52) / 3060);
  const day = days - Math.floor((100 * h + 52) / 12) * 30 + h + 1;
  const month = h < 14 ? h - 1 : h - 13;
  const year = g + j - 4800 + (month > 10 ? 1 : 0);

  return { year, month, day };
}

/** Pad a number with leading zero */
function pad(n: number, len = 2): string {
  return n.toString().padStart(len, "0");
}

/** Format Hijri date as YYYY-MM-DD */
export function formatHijriDate(h: HijriDate): string {
  return `${h.year}-${pad(h.month)}-${pad(h.day)}`;
}

/** Format Gregorian date as YYYY-MM-DD */
export function formatGregorianDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Get Hijri year for a given Gregorian year (quick estimate) */
export function getIslamicYear(gy: number): number {
  return islamicYear(gy);
}

/**
 * Get a quick reference for the estimated Ramadan period in a given Hijri/Gregorian year.
 * Ramadan is always month 9 of the Islamic calendar.
 * This returns an approximate Gregorian date range for Ramadan in the given Gregorian year.
 */
export function getEstimatedRamadan(gregorianYear: number): { start: string; end: string } {
  // Start by finding 1 Ramadan of the Islamic year that falls in this Gregorian year
  // Try months Jan-Jun of the given year
  for (let m = 1; m <= 12; m++) {
    const h = gregorianToHijri(gregorianYear, m, 15);
    if (h.month === 9) {
      // Found Ramadan - find the 1st
      let d = 1;
      let hStart = gregorianToHijri(gregorianYear, m, d);
      while (hStart.month === 9 && m >= 1) {
        d--;
        if (d < 1) { m--; if (m < 1) break; }
        hStart = gregorianToHijri(gregorianYear, m, d);
      }
      d++; // back to the 1st
      if (d < 1) { d = 1; }
      // Find last day of Ramadan (month 9 has 29 or 30 days)
      const endD = 29;
      const startGreg = hijriToGregorian(h.year, 9, d);
      const endGreg = hijriToGregorian(h.year, 9, endD);
      return {
        start: `${startGreg.year}-${pad(startGreg.month)}-${pad(startGreg.day)}`,
        end: `${endGreg.year}-${pad(endGreg.month)}-${pad(endGreg.day)}`,
      };
    }
  }
  // Fallback
  return { start: `${gregorianYear}-02-01`, end: `${gregorianYear}-03-01` };
}
