import { isHex, type Hex } from "viem";
import type { DeclareWinnerInput, ResultsPublisher } from "../interfaces/results-publisher";
import { ensure, ensureRejects, type Check } from "./check";

export interface ResultsPublisherScenario {
  /** Two distinct, registered team labels the publisher may declare. */
  teams: [string, string];
  resultsKey: Hex;
  resultsHash: Hex;
}

const declare = (s: ResultsPublisherScenario, team: string): DeclareWinnerInput => ({
  team,
  prizes: ["arkiv:1st"],
  resultsKey: s.resultsKey,
  resultsHash: s.resultsHash,
});

/** Each check expects a fresh, unlocked publisher. */
export const resultsPublisherChecks: Check<ResultsPublisher, ResultsPublisherScenario>[] = [
  {
    name: "the happy path returns tx hashes",
    async run(p, s) {
      for (const tx of [
        await p.setEventResults(s.resultsKey),
        await p.declareWinner(declare(s, s.teams[0])),
        await p.lockResults(),
      ]) {
        ensure(isHex(tx.txHash) && tx.txHash.length === 66, `bad tx hash ${tx.txHash}`);
      }
    },
  },
  {
    name: "declaring the same team twice fails",
    async run(p, s) {
      await p.declareWinner(declare(s, s.teams[0]));
      await ensureRejects(() => p.declareWinner(declare(s, s.teams[0])), "second declare");
      await p.declareWinner(declare(s, s.teams[1]));
    },
  },
  {
    name: "every call after lock fails",
    async run(p, s) {
      await p.lockResults();
      await ensureRejects(() => p.setEventResults(s.resultsKey), "setEventResults after lock");
      await ensureRejects(
        () => p.declareWinner(declare(s, s.teams[1])),
        "declareWinner after lock",
      );
      await ensureRejects(() => p.lockResults(), "lockResults after lock");
    },
  },
];
