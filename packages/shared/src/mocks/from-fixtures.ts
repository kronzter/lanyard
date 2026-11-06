/**
 * Mocks wired to the committed fixtures, for the app's mock providers and for tests.
 */
import historyJson from "../../../../fixtures/ens-history.json";
import timelineJson from "../../../../fixtures/timeline.json";
import venueJson from "../../../../fixtures/venue.small.json";
import { ensHistoryFileSchema, timelineFileSchema } from "../fixtures";
import type { Venue } from "../types/venue";
import { MockEnsReader } from "./mock-ens-reader";

export const fixtureHistory = ensHistoryFileSchema.parse(historyJson);
export const fixtureTimeline = timelineFileSchema.parse(timelineJson);
export const smallVenue = venueJson as unknown as Venue;

export function createFixtureEnsReader(opts: { headBlock?: bigint } = {}): MockEnsReader {
  return new MockEnsReader(fixtureHistory, fixtureTimeline, opts);
}
