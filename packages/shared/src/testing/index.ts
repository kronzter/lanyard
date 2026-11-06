/**
 * Conformance suites (P0.3-R4). Every implementation of an interface, mock and real,
 * must pass its suite:
 *
 *   runEnsReaderConformance("SepoliaEnsReader", () => new SepoliaEnsReader(...), scenario);
 *
 * Imported as `@lanyard/shared/testing`, from test files only (it imports vitest).
 */
import { describe, it } from "vitest";
import type { EnsReader } from "../interfaces/ens-reader";
import type { ResultsPublisher } from "../interfaces/results-publisher";
import type { Router } from "../interfaces/router";
import type { Check } from "./check";
import { ensReaderChecks, type EnsReaderScenario } from "./ens-reader.conformance";
import {
  resultsPublisherChecks,
  type ResultsPublisherScenario,
} from "./results-publisher.conformance";
import { routerChecks, type RouterScenario } from "./router.conformance";

export * from "./check";
export * from "./ens-reader.conformance";
export * from "./router.conformance";
export * from "./results-publisher.conformance";

function runSuite<S, C>(
  title: string,
  checks: Check<S, C>[],
  makeSubject: () => S | Promise<S>,
  scenario: C,
) {
  describe(title, () => {
    for (const c of checks) {
      it(c.name, async () => {
        await c.run(await makeSubject(), scenario);
      });
    }
  });
}

export const runEnsReaderConformance = (
  name: string,
  make: () => EnsReader | Promise<EnsReader>,
  scenario: EnsReaderScenario,
) => runSuite(`EnsReader conformance: ${name}`, ensReaderChecks, make, scenario);

export const runRouterConformance = (
  name: string,
  make: () => Router | Promise<Router>,
  scenario: RouterScenario,
) => runSuite(`Router conformance: ${name}`, routerChecks, make, scenario);

export const runResultsPublisherConformance = (
  name: string,
  make: () => ResultsPublisher | Promise<ResultsPublisher>,
  scenario: ResultsPublisherScenario,
) => runSuite(`ResultsPublisher conformance: ${name}`, resultsPublisherChecks, make, scenario);
