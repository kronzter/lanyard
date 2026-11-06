import type { Cell, CellRef, OpenTicket, Venue } from "../types/venue";

/** A stop on a judge's walk: a project key and where it is (its team lead's seat). */
export interface JudgeStop {
  key: string;
  /** `null` if the location is unknown. Such stops are listed last. */
  cell: CellRef | null;
}

/**
 * Walking routes over the venue grid (P0.3). Real version: `GridRouter` (A3.2).
 * All methods are pure and synchronous.
 */
export interface Router {
  /** Cells from `from` to `to` inclusive, or `null` if unreachable. */
  path(v: Venue, from: CellRef, to: CellRef): Cell[] | null;
  /** Walking distance in metres from `from` to every reachable cell, keyed `"x,y"`. */
  distances(v: Venue, from: CellRef): Map<string, number>;
  /**
   * The open ticket with the lowest `walking_metres − alpha × waitingMinutes`,
   * ties broken by lowest ticket key, or `null` if none is reachable.
   */
  nextTicket(v: Venue, from: CellRef, open: OpenTicket[], alpha: number): OpenTicket | null;
  /** Stop keys in visit order, nearest-next from `start`. Each stop once; unknown or unreachable last. */
  judgeRoute(v: Venue, start: CellRef, stops: JudgeStop[]): string[];
}

/** Key for `Router.distances` maps. */
export const cellKey = (c: CellRef): string => `${c.x},${c.y}`;
