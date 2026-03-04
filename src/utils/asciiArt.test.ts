
import { describe, it, expect } from 'vitest';
import { getGrayScale, mapGrayToChar, DENSITY_SETS } from './asciiArt';

describe('AsciiArt Utils', () => {
  it('getGrayScale calculates correct luminosity', () => {
    // White
    expect(getGrayScale(255, 255, 255)).toBeCloseTo(255, 0);
    // Black
    expect(getGrayScale(0, 0, 0)).toBe(0);
    // Pure Red
    expect(getGrayScale(255, 0, 0)).toBeCloseTo(54.213, 3);
  });

  it('mapGrayToChar maps grayscale to characters correctly', () => {
    const chars = "@."; // 2 chars. 0-127 -> @, 128-255 -> .
    
    expect(mapGrayToChar(0, chars)).toBe("@");
    expect(mapGrayToChar(255, chars)).toBe(".");
    expect(mapGrayToChar(100, chars)).toBe("@");
    expect(mapGrayToChar(200, chars)).toBe(".");
  });

  it('DENSITY_SETS are defined', () => {
    expect(DENSITY_SETS.standard.length).toBeGreaterThan(0);
    expect(DENSITY_SETS.blocks.length).toBeGreaterThan(0);
  });
});
