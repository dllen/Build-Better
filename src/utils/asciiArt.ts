
export interface AsciiOptions {
  width: number;
  chars?: string;
  inverted?: boolean;
  colorMode?: 'black-white' | 'gray' | 'color';
}

export const DENSITY_SETS = {
  standard: "@%#*+=-:. ",
  complex: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  simple: "#+-. ",
  blocks: "█▓▒░ ",
};

export function getGrayScale(r: number, g: number, b: number): number {
  // Luminosity formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function mapGrayToChar(gray: number, chars: string): string {
  const len = chars.length;
  // Map 0-255 to 0-(len-1)
  // 255 (white) -> last char (usually space or light char)
  // 0 (black) -> first char (usually dark char)
  const index = Math.floor((gray / 255) * (len - 1));
  return chars[Math.max(0, Math.min(len - 1, index))];
}

export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface AsciiResult {
  text: string; // Plain text representation
  html: string; // HTML representation (for color)
}

export function processImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: AsciiOptions
): AsciiResult {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const chars = options.chars || DENSITY_SETS.standard;
  
  let asciiText = "";
  let asciiHtml = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];

      // Skip fully transparent pixels or treat as white/space
      if (a === 0) {
        asciiText += " ";
        asciiHtml += " ";
        continue;
      }

      const gray = getGrayScale(r, g, b);
      const charIndex = options.inverted 
        ? Math.floor(((255 - gray) / 255) * (chars.length - 1))
        : Math.floor((gray / 255) * (chars.length - 1));
      
      const char = chars[Math.max(0, Math.min(chars.length - 1, charIndex))];

      asciiText += char;

      if (options.colorMode === 'color') {
        asciiHtml += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
      } else if (options.colorMode === 'gray') {
        asciiHtml += `<span style="color: rgb(${gray},${gray},${gray})">${char}</span>`;
      } else {
        asciiHtml += char;
      }
    }
    asciiText += "\n";
    asciiHtml += "\n";
  }

  return { text: asciiText, html: asciiHtml };
}
