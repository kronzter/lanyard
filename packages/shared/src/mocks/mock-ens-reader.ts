import type { Address } from "viem";
import type { EnsHistoryFile, TimelineFile } from "../fixtures";
import type { AtBlock, EnsReader } from "../interfaces/ens-reader";
import { assertLabel, type Label } from "../labels";

interface NameState {
  owner: Address;
  expiry: bigint;
  texts: Map<string, string>;
}

/**
 * Answers from a scripted ENS history by replaying events up to the requested block
 * (P0.3-R1). Block timestamps come from the timeline: genesis + (block − genesis) × blockTime.
 */
export class MockEnsReader implements EnsReader {
  private readonly events: EnsHistoryFile["events"];
  private readonly genesisBlock: bigint;
  private readonly genesisTime: bigint;
  private readonly blockTime: bigint;
  private readonly head: bigint;

  constructor(history: EnsHistoryFile, timeline: TimelineFile, opts: { headBlock?: bigint } = {}) {
    this.events = [...history.events].sort((a, b) => a.block - b.block);
    this.genesisBlock = BigInt(timeline.genesis.block);
    this.genesisTime = BigInt(timeline.genesis.timestamp);
    this.blockTime = BigInt(timeline.blockTimeSeconds);
    const lastEvent = BigInt(this.events.at(-1)?.block ?? timeline.genesis.block);
    const eventEnd = BigInt(timeline.keyTimes.eventEnd.block);
    this.head = opts.headBlock ?? (lastEvent > eventEnd ? lastEvent : eventEnd);
  }

  timestampOf(block: bigint): bigint {
    return this.genesisTime + (block - this.genesisBlock) * this.blockTime;
  }

  private stateAt(label: Label, block: bigint): NameState | null {
    assertLabel(label);
    let state: NameState | null = null;
    for (const e of this.events) {
      if (BigInt(e.block) > block) break;
      if (e.label !== label) continue;
      switch (e.type) {
        case "register":
          state = { owner: e.owner, expiry: BigInt(e.expiry), texts: new Map() };
          break;
        case "unregister":
          state = null;
          break;
        case "renew":
          if (state) state.expiry = BigInt(e.expiry);
          break;
        case "setText":
          if (state) state.texts.set(e.key, e.value);
          break;
      }
    }
    return state;
  }

  private resolving(label: Label, at: AtBlock): NameState | null {
    const state = this.stateAt(label, at.sepoliaBlock);
    if (!state) return null;
    return this.timestampOf(at.sepoliaBlock) >= state.expiry ? null : state;
  }

  async resolve(label: Label, at: AtBlock): Promise<Address | null> {
    return this.resolving(label, at)?.owner ?? null;
  }

  async text(label: Label, key: string, at: AtBlock): Promise<string | null> {
    const value = this.resolving(label, at)?.texts.get(key);
    return value ? value : null;
  }

  async expiry(label: Label, at: AtBlock): Promise<bigint | null> {
    return this.stateAt(label, at.sepoliaBlock)?.expiry ?? null;
  }

  async sepoliaBlockAt(unixSeconds: bigint): Promise<bigint> {
    if (unixSeconds < this.genesisTime) {
      throw new RangeError(`timestamp ${unixSeconds} is before the mock genesis`);
    }
    return this.genesisBlock + (unixSeconds - this.genesisTime) / this.blockTime;
  }

  async headBlock(): Promise<bigint> {
    return this.head;
  }
}
