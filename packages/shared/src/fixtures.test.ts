import { describe, expect, it } from "vitest";
import personasJson from "../../../fixtures/personas.json";
import historyJson from "../../../fixtures/ens-history.json";
import timelineJson from "../../../fixtures/timeline.json";
import venueJson from "../../../fixtures/venue.small.json";
import { EVENT } from "./event.config";
import { ensHistoryFileSchema, personasFileSchema, timelineFileSchema } from "./fixtures";
import { assertLabel } from "./labels";
import type { Rle, Venue } from "./types/venue";

const personas = personasFileSchema.parse(personasJson);
const history = ensHistoryFileSchema.parse(historyJson);
const timeline = timelineFileSchema.parse(timelineJson);
const venue = venueJson as unknown as Venue;

const decode = (rle: Rle, size: number): boolean[] => {
  const out: boolean[] = [];
  rle.forEach((n, i) => {
    for (let k = 0; k < n; k++) out.push(i % 2 === 1);
  });
  expect(out.length).toBe(size);
  return out;
};

describe("personas.json", () => {
  it("ids, labels and addresses are unique", () => {
    const ids = personas.personas.map((p) => p.id);
    const labels = personas.personas.flatMap((p) => (p.label === null ? [] : [p.label]));
    const addrs = personas.personas.map((p) => p.address.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(addrs).size).toBe(addrs.length);
  });

  it("every label is valid", () => {
    for (const p of personas.personas) if (p.label !== null) assertLabel(p.label);
    for (const t of personas.teams) assertLabel(t.team);
  });

  it("has the actors P0.4-R1 asks for", () => {
    const count = (role: string) => personas.personas.filter((p) => p.role === role).length;
    expect(count("organizer")).toBe(1);
    expect(count("results-key")).toBe(1);
    expect(count("volunteer-coordinator")).toBe(1);
    expect(count("head-judge")).toBe(1);
    expect(count("lead")).toBe(4);
    expect(count("volunteer")).toBe(10);
    expect(count("judge")).toBe(6);
    for (const partner of EVENT.partners) {
      const of = (role: string) =>
        personas.personas.filter((p) => p.role === role && p.partner === partner).length;
      expect(of("partner")).toBe(1);
      expect(of("partner-staff")).toBe(2);
      expect(of("judge")).toBe(3);
    }
    for (const t of personas.teams) expect(t.members.length).toBeLessThanOrEqual(4);
  });

  it("team leads and members are hacker personas", () => {
    const hackers = new Set(
      personas.personas.filter((p) => p.role === "hacker").map((p) => p.label),
    );
    for (const t of personas.teams) {
      expect(hackers.has(t.lead)).toBe(true);
      for (const m of t.members) expect(hackers.has(m)).toBe(true);
    }
  });
});

describe("ens-history.json", () => {
  it("every label it uses exists in personas.json (badges or teams)", () => {
    const known = new Set<string>([
      ...personas.personas.flatMap((p) => (p.label === null ? [] : [p.label])),
      ...personas.teams.map((t) => t.team),
    ]);
    for (const e of history.events) expect(known, `unknown label ${e.label}`).toContain(e.label);
  });

  it("register owners match persona addresses", () => {
    const byLabel = new Map(personas.personas.map((p) => [p.label, p.address]));
    for (const e of history.events) {
      if (e.type !== "register") continue;
      const team = personas.teams.find((t) => t.team === e.label);
      const expected = team ? byLabel.get(team.lead) : byLabel.get(e.label);
      expect(e.owner).toBe(expected);
    }
  });

  it("events are ordered by block", () => {
    const blocks = history.events.map((e) => e.block);
    expect([...blocks].sort((a, b) => a - b)).toEqual(blocks);
  });

  it("tells the P0.4-R3 story", () => {
    const types = (label: string) =>
      history.events.filter((e) => e.label === label).map((e) => e.type);
    expect(types("priya.volunteers")).toEqual(["register", "setText", "setText"]);
    expect(types("ben.judges.arkiv.partners")).toEqual(["register", "unregister"]);
    expect(types("tara.volunteers")).toEqual(["register", "renew"]);
  });
});

describe("timeline.json", () => {
  it("matches event.config.ts", () => {
    for (const [key, t] of Object.entries(EVENT.times)) {
      const kt = timeline.keyTimes[key as keyof typeof timeline.keyTimes];
      expect(BigInt(kt.timestamp)).toBe(t);
      const expected =
        timeline.genesis.block +
        Math.floor((kt.timestamp - timeline.genesis.timestamp) / timeline.blockTimeSeconds);
      expect(kt.block).toBe(expected);
    }
  });
});

describe("venue.small.json", () => {
  const { cols, rows } = venue.grid;
  const walkable = decode(venue.grid.walkable, cols * rows);
  const at = (x: number, y: number) => walkable[y * cols + x] === true;

  const reachable = (sx: number, sy: number) => {
    const seen = new Set<number>([sy * cols + sx]);
    const queue = [[sx, sy] as const];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        const i = ny * cols + nx;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(i) || !at(nx, ny)) continue;
        seen.add(i);
        queue.push([nx, ny]);
      }
    }
    return seen;
  };

  it("is 20x12 with 12 seats, 2 zones and 3 POIs", () => {
    expect([cols, rows]).toEqual([20, 12]);
    expect(venue.seats).toHaveLength(12);
    expect(venue.zones).toHaveLength(2);
    expect(venue.pois).toHaveLength(3);
  });

  it("every zone has a help desk", () => {
    for (const z of venue.zones) {
      expect(venue.pois.some((p) => p.kind === "help-desk" && p.zone === z.id)).toBe(true);
    }
  });

  it("zone masks are well formed", () => {
    for (const z of venue.zones) decode(z.cells, cols * rows);
  });

  it("exactly one seat is walled in", () => {
    const desk = venue.pois.find((p) => p.id === "help-desk-a")!;
    const fromDesk = reachable(desk.x, desk.y);
    const unreachable = venue.seats.filter((s) => !fromDesk.has(s.y * cols + s.x));
    expect(unreachable.map((s) => s.id)).toEqual(["S012"]);
  });
});
