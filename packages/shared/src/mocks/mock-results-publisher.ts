import { keccak256, toHex, type Hex } from "viem";
import type { DeclareWinnerInput, ResultsPublisher } from "../interfaces/results-publisher";

export type PublisherCall =
  | { method: "setEventResults"; resultsKey: Hex }
  | { method: "declareWinner"; input: DeclareWinnerInput }
  | { method: "lockResults" };

/**
 * Records calls in memory (P0.3-R3). Refuses a second `declareWinner` for a team, and
 * every call after `lockResults`. Tx hashes are deterministic fakes.
 */
export class MockResultsPublisher implements ResultsPublisher {
  readonly calls: PublisherCall[] = [];
  private readonly declared = new Set<string>();
  private locked = false;

  private record(call: PublisherCall): { txHash: Hex } {
    if (this.locked) throw new Error(`results are locked; ${call.method} refused`);
    this.calls.push(call);
    return { txHash: keccak256(toHex(`mock-tx-${this.calls.length}`)) };
  }

  async setEventResults(resultsKey: Hex) {
    return this.record({ method: "setEventResults", resultsKey });
  }

  async declareWinner(input: DeclareWinnerInput) {
    if (!this.locked && this.declared.has(input.team)) {
      throw new Error(`winner already declared for team ${input.team}`);
    }
    const tx = this.record({ method: "declareWinner", input });
    this.declared.add(input.team);
    return tx;
  }

  async lockResults() {
    const tx = this.record({ method: "lockResults" });
    this.locked = true;
    return tx;
  }
}
