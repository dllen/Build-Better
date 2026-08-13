interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
}

export interface DetectionResult {
  contains: boolean;
  words: string[];
  positions: Array<{ word: string; start: number; end: number }>;
}

export class SensitiveFilter {
  private root: TrieNode;

  constructor(words: string[] = []) {
    this.root = this.createNode();
    words.forEach(word => this.insert(word));
  }

  private createNode(): TrieNode {
    return { children: new Map(), isEnd: false };
  }

  private insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
  }

  contains(text: string): boolean {
    return this.detect(text).contains;
  }

  detect(text: string): DetectionResult {
    const words: string[] = [];
    const positions: Array<{ word: string; start: number; end: number }> = [];

    for (let i = 0; i < text.length; i++) {
      const match = this.matchFrom(text, i);
      if (match) {
        words.push(match.word);
        positions.push({ word: match.word, start: match.start, end: match.end });
      }
    }

    return {
      contains: words.length > 0,
      words: [...new Set(words)],
      positions,
    };
  }

  private matchFrom(text: string, start: number): { word: string; start: number; end: number } | null {
    let node = this.root;
    let longestWord = '';

    for (let i = start; i < text.length; i++) {
      const char = text[i];
      if (!node.children.has(char)) break;
      node = node.children.get(char)!;
      if (node.isEnd) {
        longestWord = text.slice(start, i + 1);
      }
    }

    if (longestWord) {
      return { word: longestWord, start, end: start + longestWord.length };
    }
    return null;
  }

  sanitize(text: string): string {
    const result = this.detect(text);
    if (!result.contains) return text;

    let sanitized = text;
    const sortedPositions = [...result.positions].sort((a, b) => b.start - a.start);

    for (const pos of sortedPositions) {
      sanitized = sanitized.slice(0, pos.start) + '***' + sanitized.slice(pos.end);
    }

    return sanitized;
  }

  static async load(url: string): Promise<SensitiveFilter> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { words?: string[] };
      return new SensitiveFilter(data.words || []);
    } catch (err) {
      console.warn('Failed to load sensitive words, using empty filter:', err);
      return new SensitiveFilter([]);
    }
  }
}
