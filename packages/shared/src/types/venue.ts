/**
 * Venue types (P0.2-R2): the `venue.json` format A3.1's editor exports and every
 * map, router and ticket screen reads.
 *
 * Coordinates are grid cells: `x` is the column (0 = left), `y` the row (0 = top).
 */

/** A grid cell. */
export interface Cell {
  x: number;
  y: number;
}

/** A reference to a cell, e.g. a router start or target. Same shape as `Cell`. */
export type CellRef = Cell;

/**
 * Run-length encoding of a boolean mask over the grid, row-major
 * (row 0 left→right, then row 1, …). Runs alternate false/true, **starting with
 * false**, so `[0, 5, 3]` means "5 true, then 3 false". Runs sum to cols × rows.
 */
export type Rle = number[];

export interface Seat {
  /** Stable ID, `S001`… Never renumbered (A3.1-R5). */
  id: string;
  x: number;
  y: number;
  /** Zone ID the seat belongs to. */
  zone: string;
}

export type PoiKind = "help-desk" | "stage" | "partner-table" | "booth" | "other";

export interface Poi {
  id: string;
  kind: PoiKind;
  name: string;
  x: number;
  y: number;
  zone: string;
  /** Set for partner tables and booths. */
  partner?: string;
}

export interface Zone {
  /** e.g. `hall-a`. Volunteer shifts reference this. */
  id: string;
  name: string;
  /** Cells in the zone, as an `Rle` mask. */
  cells: Rle;
}

export interface Venue {
  version: 1;
  /** The floor-plan image the grid is laid over. */
  image: { src: string; width: number; height: number };
  /** Image pixels per cell. */
  cellSizePx: number;
  /** Real-world metres per cell (≈1). */
  metresPerCell: number;
  grid: {
    cols: number;
    rows: number;
    /** Walkable cells as an `Rle` mask; everything else is blocked. */
    walkable: Rle;
  };
  seats: Seat[];
  pois: Poi[];
  zones: Zone[];
}

/** An open ticket as the router sees it. Eligibility filtering happens before the router. */
export interface OpenTicket {
  /** Arkiv record key of the `ticket`. Ties are broken by lowest key. */
  key: string;
  seatId: string;
  cell: Cell;
  zone: string;
  category: string;
  /** Minutes since the ticket was raised, computed by the caller (the router stays pure). */
  waitingMinutes: number;
}
