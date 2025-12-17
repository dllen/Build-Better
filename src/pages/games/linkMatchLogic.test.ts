
import { describe, it, expect } from "vitest";
import {
  Tile,
  isClearRow,
  isClearCol,
  canConnect,
  genGrid,
} from "./linkMatchLogic";

// Helper to create a simple grid for testing
function createGrid(rows: number, cols: number, content: string[][]): Tile[][] {
  const grid: Tile[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = content[r][c];
      // Use '.' to represent removed/empty tiles
      row.push({ ch: ch === "." ? "" : ch, removed: ch === "." });
    }
    grid.push(row);
  }
  return grid;
}

describe("LinkMatch Logic", () => {
  describe("isClearRow", () => {
    it("should return true for adjacent cells", () => {
      const grid = createGrid(3, 3, [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ]);
      expect(isClearRow(grid, 0, 0, 1)).toBe(true);
    });

    it("should return true if path is clear", () => {
      const grid = createGrid(3, 3, [
        ["A", ".", "C"],
        [".", ".", "."],
        [".", ".", "."],
      ]);
      expect(isClearRow(grid, 0, 0, 2)).toBe(true);
    });

    it("should return false if path is blocked", () => {
      const grid = createGrid(3, 3, [
        ["A", "X", "C"],
        [".", ".", "."],
        [".", ".", "."],
      ]);
      expect(isClearRow(grid, 0, 0, 2)).toBe(false);
    });
  });

  describe("isClearCol", () => {
    it("should return true for adjacent cells", () => {
      const grid = createGrid(3, 3, [
        ["A", ".", "."],
        ["B", ".", "."],
        ["C", ".", "."],
      ]);
      expect(isClearCol(grid, 0, 0, 1)).toBe(true);
    });

    it("should return true if path is clear", () => {
      const grid = createGrid(3, 3, [
        ["A", ".", "."],
        [".", ".", "."],
        ["C", ".", "."],
      ]);
      expect(isClearCol(grid, 0, 0, 2)).toBe(true);
    });

    it("should return false if path is blocked", () => {
      const grid = createGrid(3, 3, [
        ["A", ".", "."],
        ["X", ".", "."],
        ["C", ".", "."],
      ]);
      expect(isClearCol(grid, 0, 0, 2)).toBe(false);
    });
  });

  describe("canConnect", () => {
    // Grid 5x5 for testing
    // . . . . .
    // . A . A .
    // . . . . .
    // . A X A .
    // . . . . .

    it("0 turns: Horizontal", () => {
      const grid = createGrid(1, 4, [["A", ".", ".", "A"]]);
      expect(canConnect(grid, 0, 0, 0, 3)).toBe(true);
    });

    it("0 turns: Horizontal Blocked", () => {
      const grid = createGrid(1, 4, [["A", "X", ".", "A"]]);
      expect(canConnect(grid, 0, 0, 0, 3)).toBe(false);
    });

    it("0 turns: Vertical", () => {
      const grid = createGrid(4, 1, [["A"], ["."], ["."], ["A"]]);
      expect(canConnect(grid, 0, 0, 3, 0)).toBe(true);
    });

    it("1 turn: L-shape", () => {
      // A .
      // . A
      const grid = createGrid(2, 2, [
        ["A", "."],
        [".", "A"],
      ]);
      expect(canConnect(grid, 0, 0, 1, 1)).toBe(true);
    });

    it("1 turn: L-shape Blocked", () => {
      // A X
      // X A
      const grid = createGrid(2, 2, [
        ["A", "X"],
        ["X", "A"],
      ]);
      expect(canConnect(grid, 0, 0, 1, 1)).toBe(false);
    });

    it("2 turns: U-shape (Bottom Bridge)", () => {
      // A X A
      // . . .
      const grid = createGrid(2, 3, [
        ["A", "X", "A"],
        [".", ".", "."],
      ]);
      expect(canConnect(grid, 0, 0, 0, 2)).toBe(true);
    });

    it("2 turns: U-shape (Top Bridge)", () => {
      // . . .
      // A X A
      const grid = createGrid(2, 3, [
        [".", ".", "."],
        ["A", "X", "A"],
      ]);
      expect(canConnect(grid, 1, 0, 1, 2)).toBe(true);
    });

    it("2 turns: Z-shape", () => {
      // A . .
      // X X .
      // . . A
      const grid = createGrid(3, 3, [
        ["A", ".", "."],
        ["X", "X", "."],
        [".", ".", "A"],
      ]);
      // Path: (0,0) -> (0,2) -> (2,2)
      // Wait, that's 1 turn if (0,2) is corner.
      // Let's force Z shape.
      // A . .
      // . X .
      // . . A
      // Path: (0,0) -> (0,1) -> (2,1) -> (2,2) -- invalid, (0,1) is adjacent.
      
      // Better Z shape:
      // A . . .
      // . . X .
      // . X . A
      // Path: (0,0)->(0,1)->(2,1)->(2,3) -- 2 turns
      const gridZ = createGrid(3, 4, [
        ["A", ".", ".", "."],
        [".", ".", "X", "."],
        [".", "X", ".", "A"],
      ]);
      // (0,0) down to (2,0) blocked? No.
      // Let's construct a scenario where only Z is possible.
      // A X
      // . .
      // X A
      // Path: (0,0) -> (1,0) -> (1,1) -> (2,1)
      const gridZ2 = createGrid(3, 2, [
        ["A", "X"],
        [".", "."],
        ["X", "A"],
      ]);
      expect(canConnect(gridZ2, 0, 0, 2, 1)).toBe(true);
    });

    it("should fail if more than 2 turns needed", () => {
        // A X .
        // X X .
        // . . .
        // X X A
        // Snake path needed?
        // A . X . A
        // X . X . X
        // X . . . X
        const grid = createGrid(3, 5, [
            ["A", ".", "X", ".", "A"],
            ["X", ".", "X", ".", "X"],
            ["X", ".", ".", ".", "X"],
        ]);
        // Path: (0,0)->(0,1)->(2,1)->(2,3)->(0,3)->(0,4) = 4 turns.
        // Direct? Blocked.
        // 1 turn? Blocked.
        // 2 turns?
        // Row 1: (1,0) blocked. (1,4) blocked.
        // Row 2: (2,0) blocked. (2,4) blocked.
        // Col 1: (0,1) OK. (0,4) OK. Connect? (0,1)->(2,1)->(2,3)->(0,3)->(0,4).
        // Wait, canConnect logic:
        // Check Row bridges:
        // r=0: blocked (Start/End are on r=0).
        // r=1: (1,0) blocked.
        // r=2: (2,0) blocked.
        // Check Col bridges:
        // c=0: blocked.
        // c=1: (0,1) empty. (0,4) is A. Wait.
        // Bridge from A(0,0) to A(0,4).
        // Scan cols.
        // c=1: A(0,0)->(0,1) OK. A(0,4)->(0,1) ?? No, (0,4) is target.
        // We are checking if we can go A->(r1,c)->(r2,c)->B.
        // r1=0, r2=0.
        // (0,c) -> (0,c). This is same point.
        // If r1==r2, 2 turns logic implies: A->(r, c1)->(r, c2)->B (Bridge Row)
        // or A->(r1,c)->(r2,c)->B (Bridge Col).
        // If r1==r2, Bridge Col is: A->(r1,c)->(r1,c)->B. That's just 0 turns (straight line check).
        // So for r1==r2, only Bridge Row is useful (U-shape).
        // For our case:
        // Row 1: (1,0) is X. Blocked.
        // Row 2: (2,0) is X. Blocked.
        // So it should return false.
        expect(canConnect(grid, 0, 0, 0, 4)).toBe(false);
    });
  });
});
