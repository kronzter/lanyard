import { cellKey, type JudgeStop, type Router } from "../interfaces/router";
import type { Cell, CellRef, OpenTicket, Venue } from "../types/venue";

const manhattan = (a: CellRef, b: CellRef) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Manhattan distances and straight-line paths, ignoring walls (P0.3-R2).
 * Stands in for `GridRouter` until I3.
 */
export class StubRouter implements Router {
  path(_v: Venue, from: CellRef, to: CellRef): Cell[] {
    const cells: Cell[] = [{ x: from.x, y: from.y }];
    let { x, y } = from;
    while (x !== to.x) {
      x += Math.sign(to.x - x);
      cells.push({ x, y });
    }
    while (y !== to.y) {
      y += Math.sign(to.y - y);
      cells.push({ x, y });
    }
    return cells;
  }

  distances(v: Venue, from: CellRef): Map<string, number> {
    const out = new Map<string, number>();
    for (let y = 0; y < v.grid.rows; y++) {
      for (let x = 0; x < v.grid.cols; x++) {
        out.set(cellKey({ x, y }), manhattan(from, { x, y }) * v.metresPerCell);
      }
    }
    return out;
  }

  nextTicket(v: Venue, from: CellRef, open: OpenTicket[], alpha: number): OpenTicket | null {
    let best: { t: OpenTicket; score: number } | null = null;
    for (const t of open) {
      const score = manhattan(from, t.cell) * v.metresPerCell - alpha * t.waitingMinutes;
      if (!best || score < best.score || (score === best.score && t.key < best.t.key)) {
        best = { t, score };
      }
    }
    return best?.t ?? null;
  }

  judgeRoute(_v: Venue, start: CellRef, stops: JudgeStop[]): string[] {
    const seen = new Set<string>();
    const known: { key: string; cell: CellRef }[] = [];
    const unknown: string[] = [];
    for (const s of stops) {
      if (seen.has(s.key)) continue;
      seen.add(s.key);
      if (s.cell) known.push({ key: s.key, cell: s.cell });
      else unknown.push(s.key);
    }
    const order: string[] = [];
    let here = start;
    while (known.length) {
      let i = 0;
      for (let j = 1; j < known.length; j++) {
        const dj = manhattan(here, known[j]!.cell);
        const di = manhattan(here, known[i]!.cell);
        if (dj < di || (dj === di && known[j]!.key < known[i]!.key)) i = j;
      }
      const [next] = known.splice(i, 1);
      order.push(next!.key);
      here = next!.cell;
    }
    return [...order, ...unknown.sort()];
  }
}
