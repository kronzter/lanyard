import { describe, expect, it } from "vitest";
import type { Address } from "viem";
import personasJson from "../../../../fixtures/personas.json";
import { personasFileSchema } from "../fixtures";
import type { AtBlock } from "../interfaces/ens-reader";
import type { DeclareWinnerInput } from "../interfaces/results-publisher";
import {
  createFixtureEnsReader,
  fixtureHistory,
  fixtureTimeline,
  smallVenue,
} from "../mocks/from-fixtures";
import { MockEnsReader } from "../mocks/mock-ens-reader";
import { MockResultsPublisher } from "../mocks/mock-results-publisher";
import { StubRouter } from "../mocks/stub-router";
import type { OpenTicket, Venue } from "../types/venue";
import {
  ensReaderChecks,
  ensScenarioFromFixtures,
  failingChecks,
  resultsPublisherChecks,
  routerChecks,
  runEnsReaderConformance,
  runResultsPublisherConformance,
  runRouterConformance,
  type ResultsPublisherScenario,
  type RouterScenario,
} from "./index";

const personas = personasFileSchema.parse(personasJson);
const ensScenario = ensScenarioFromFixtures(fixtureHistory, fixtureTimeline, personas);

const desk = smallVenue.pois.find((p) => p.id === "help-desk-a")!;
const seat = smallVenue.seats.find((s) => s.id === "S001")!;
const routerScenario: RouterScenario = {
  venue: smallVenue,
  from: { x: desk.x, y: desk.y },
  to: { x: seat.x, y: seat.y },
};

const publisherScenario: ResultsPublisherScenario = {
  teams: ["zkpay", "mempool"],
  resultsKey: `0x${"11".repeat(32)}`,
  resultsHash: `0x${"22".repeat(32)}`,
};

// ---------- the mocks pass their suites ----------
runEnsReaderConformance("MockEnsReader", () => createFixtureEnsReader(), ensScenario);
runRouterConformance("StubRouter", () => new StubRouter(), routerScenario);
runResultsPublisherConformance(
  "MockResultsPublisher",
  () => new MockResultsPublisher(),
  publisherScenario,
);

// ---------- deliberately broken mocks fail them (P0.3-R5) ----------
/** Ignores the block: always answers as of the head. */
class BlockBlindEnsReader extends MockEnsReader {
  override async resolve(label: string, _at: AtBlock): Promise<Address | null> {
    return super.resolve(label, { sepoliaBlock: await this.headBlock() });
  }
}

/** Breaks ties by highest key instead of lowest. */
class WrongTieRouter extends StubRouter {
  override nextTicket(v: Venue, from: { x: number; y: number }, open: OpenTicket[], a: number) {
    const best = super.nextTicket(v, from, open, a);
    const tied = open.filter((t) => best && t.cell.x === best.cell.x && t.cell.y === best.cell.y);
    return tied.sort((x, y) => (x.key < y.key ? 1 : -1))[0] ?? best;
  }
}

/** Lets a team be declared twice. */
class DoubleDeclarePublisher extends MockResultsPublisher {
  override async declareWinner(input: DeclareWinnerInput) {
    return super.declareWinner({ ...input, team: `${input.team}#${this.calls.length}` });
  }
}

describe("conformance suites catch broken implementations", () => {
  it("EnsReader suite fails a reader that ignores the block", async () => {
    const failed = await failingChecks(
      ensReaderChecks,
      () => new BlockBlindEnsReader(fixtureHistory, fixtureTimeline),
      ensScenario,
    );
    expect(failed).toContain("a name resolves only between its register and unregister blocks");
  });

  it("Router suite fails a router with the wrong tie-break", async () => {
    const failed = await failingChecks(routerChecks, () => new WrongTieRouter(), routerScenario);
    expect(failed).toEqual(["nextTicket breaks ties by lowest ticket key"]);
  });

  it("ResultsPublisher suite fails a publisher that allows double declares", async () => {
    const failed = await failingChecks(
      resultsPublisherChecks,
      () => new DoubleDeclarePublisher(),
      publisherScenario,
    );
    expect(failed).toEqual(["declaring the same team twice fails"]);
  });
});
