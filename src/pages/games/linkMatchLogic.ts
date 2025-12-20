export type Tile = { ch: string; removed: boolean };

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export type Difficulty = "Easy" | "Normal" | "Hard";

export const LEVELS: Record<Difficulty, { rows: number; cols: number }> = {
  Easy: { rows: 8, cols: 12 },
  Normal: { rows: 10, cols: 14 },
  Hard: { rows: 12, cols: 18 },
};

export function genGrid(rows: number, cols: number): Tile[][] {
  const grid: Tile[][] = [];
  // Initialize empty grid with border
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ ch: "", removed: true });
    }
    grid.push(row);
  }

  // Calculate playable area (inner grid)
  const innerRows = rows - 2;
  const innerCols = cols - 2;
  const totalSlots = innerRows * innerCols;

  // Generate pairs
  const pairCount = Math.floor(totalSlots / 2);
  const content: string[] = [];
  for (let i = 0; i < pairCount; i++) {
    const ch = CHARS[i % CHARS.length];
    content.push(ch, ch);
  }

  // Shuffle content
  for (let i = content.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [content[i], content[j]] = [content[j], content[i]];
  }

  // Fill inner grid
  let k = 0;
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (k < content.length) {
        grid[r][c] = { ch: content[k++], removed: false };
      }
    }
  }

  return grid;
}

export function isClearRow(grid: Tile[][], r: number, c1: number, c2: number): boolean {
  const [a, b] = c1 < c2 ? [c1, c2] : [c2, c1];
  for (let c = a + 1; c < b; c++) {
    if (!grid[r][c].removed) return false;
  }
  return true;
}

export function isClearCol(grid: Tile[][], c: number, r1: number, r2: number): boolean {
  const [a, b] = r1 < r2 ? [r1, r2] : [r2, r1];
  for (let r = a + 1; r < b; r++) {
    if (!grid[r][c].removed) return false;
  }
  return true;
}

export function canConnect(
  grid: Tile[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  // 0 turns: Same row or same column and path is clear
  if (r1 === r2 && isClearRow(grid, r1, c1, c2)) return true;
  if (c1 === c2 && isClearCol(grid, c1, r1, r2)) return true;

  // 1 turn: Connect via a corner point (C1 or C2)
  // Path: A -> Corner -> B
  // Corner C1: (r1, c2)
  if (grid[r1][c2].removed && isClearRow(grid, r1, c1, c2) && isClearCol(grid, c2, r1, r2))
    return true;
  // Corner C2: (r2, c1)
  if (grid[r2][c1].removed && isClearRow(grid, r2, c1, c2) && isClearCol(grid, c1, r1, r2))
    return true;

  // 2 turns: Connect via an intermediate line (Bridge)
  // Scan all possible rows r for a bridge: A -> (r,c1) -> (r,c2) -> B
  for (let r = 0; r < grid.length; r++) {
    // Both turning points (r,c1) and (r,c2) must be empty (unless they are Start/End, but Start/End handled in 0/1 turns)
    // Actually, if r=r1, (r,c1) is Start (occupied). But 1-turn check handles r=r1.
    // So we can strictly require turning points to be empty.

    if (!grid[r][c1].removed || !grid[r][c2].removed) continue;

    // Check 3 segments: Vertical -> Horizontal -> Vertical
    if (isClearCol(grid, c1, r1, r) && isClearRow(grid, r, c1, c2) && isClearCol(grid, c2, r, r2))
      return true;
  }

  // Scan all possible cols c for a bridge: A -> (r1,c) -> (r2,c) -> B
  for (let c = 0; c < grid[0].length; c++) {
    // Both turning points (r1,c) and (r2,c) must be empty
    if (!grid[r1][c].removed || !grid[r2][c].removed) continue;

    // Check 3 segments: Horizontal -> Vertical -> Horizontal
    if (isClearRow(grid, r1, c1, c) && isClearCol(grid, c, r1, r2) && isClearRow(grid, r2, c, c2))
      return true;
  }

  return false;
}

export function findHint(
  grid: Tile[][]
): [{ r: number; c: number }, { r: number; c: number }] | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const tiles: { r: number; c: number; ch: string }[] = [];

  // Collect all active tiles
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!grid[r][c].removed) {
        tiles.push({ r, c, ch: grid[r][c].ch });
      }
    }
  }

  // Check all pairs
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].ch === tiles[j].ch) {
        if (canConnect(grid, tiles[i].r, tiles[i].c, tiles[j].r, tiles[j].c)) {
          return [
            { r: tiles[i].r, c: tiles[i].c },
            { r: tiles[j].r, c: tiles[j].c },
          ];
        }
      }
    }
  }
  return null;
}

export function hasAvailableMove(grid: Tile[][]): boolean {
  return findHint(grid) !== null;
}
