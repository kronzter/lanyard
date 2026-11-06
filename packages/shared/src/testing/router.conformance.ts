import type { Router } from "../interfaces/router";
import { cellKey } from "../interfaces/router";
import type { CellRef, OpenTicket, Venue } from "../types/venue";
import { ensure, ensureEqual, type Check } from "./check";

/**
 * Interface-level router checks. Grid-only checks (never crossing a blocked cell, real
 * walking distances) live in A3.2's own tests.
 */
export interface RouterScenario {
  venue: Venue;
  /** Two walkable cells connected by a walkable route. */
  from: CellRef;
  to: CellRef;
}

const ticket = (key: string, cell: CellRef, waitingMinutes: number): OpenTicket => ({
  key,
  seatId: "S000",
  cell,
  zone: "z",
  category: "wifi",
  waitingMinutes,
});

export const routerChecks: Check<Router, RouterScenario>[] = [
  {
    name: "path endpoints are the requested cells",
    run(r, { venue, from, to }) {
      const p = r.path(venue, from, to);
      ensure(p !== null && p.length > 0, "path is non-empty");
      ensure(p[0]!.x === from.x && p[0]!.y === from.y, "path starts at from");
      ensure(p.at(-1)!.x === to.x && p.at(-1)!.y === to.y, "path ends at to");
    },
  },
  {
    name: "path from a cell to itself is that one cell, at distance zero",
    run(r, { venue, from }) {
      const p = r.path(venue, from, from);
      ensureEqual(p?.length, 1, "path length");
      ensureEqual(r.distances(venue, from).get(cellKey(from)), 0, "distance to self");
    },
  },
  {
    name: "nextTicket returns null on an empty list",
    run(r, { venue, from }) {
      ensureEqual(r.nextTicket(venue, from, [], 5), null, "nextTicket([])");
    },
  },
  {
    name: "nextTicket breaks ties by lowest ticket key",
    run(r, { venue, from, to }) {
      const a = ticket("0x02", to, 3);
      const b = ticket("0x01", to, 3);
      ensureEqual(r.nextTicket(venue, from, [a, b], 5)?.key, "0x01", "order [0x02, 0x01]");
      ensureEqual(r.nextTicket(venue, from, [b, a], 5)?.key, "0x01", "order [0x01, 0x02]");
    },
  },
  {
    name: "judgeRoute returns each stop exactly once, unknown locations last",
    run(r, { venue, from, to }) {
      const order = r.judgeRoute(venue, from, [
        { key: "p-far", cell: to },
        { key: "p-unknown", cell: null },
        { key: "p-here", cell: from },
        { key: "p-far", cell: to },
      ]);
      ensureEqual(order.join(","), "p-here,p-far,p-unknown", "visit order");
    },
  },
];
