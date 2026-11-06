import type { Hex } from "viem";

export interface DeclareWinnerInput {
  /** Team label, e.g. `zkpay`. */
  team: string;
  /** Opaque prize strings, e.g. `arkiv:1st` (prize rules are TBD). */
  prizes: string[];
  /** Arkiv key of the `results` record. */
  resultsKey: Hex;
  resultsHash: Hex;
}

/**
 * Publishes frozen results to ENS (P0.3). Real version: `SepoliaResultsPublisher` (A4.2),
 * used only by the local freeze CLI. Every call after `lockResults` must fail, and a
 * second `declareWinner` for the same team must fail.
 */
export interface ResultsPublisher {
  setEventResults(resultsKey: Hex): Promise<{ txHash: Hex }>;
  declareWinner(input: DeclareWinnerInput): Promise<{ txHash: Hex }>;
  lockResults(): Promise<{ txHash: Hex }>;
}
