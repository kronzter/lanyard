import type { Address } from "viem";
import type { Label } from "../labels";

/** A point in Sepolia history. */
export interface AtBlock {
  sepoliaBlock: bigint;
}

/**
 * Reads ENS state at a past Sepolia block (P0.3). Real version: `SepoliaEnsReader` (A2.4).
 * Labels are relative to the edition (`priya.volunteers`; `""` = the edition name).
 *
 * Implementations must throw on RPC failure, never return `null` as if a name didn't exist.
 */
export interface EnsReader {
  /** Owner address if the name resolves at that block: registered, not unregistered, timestamp < expiry. */
  resolve(label: Label, at: AtBlock): Promise<Address | null>;
  /** Text record at that block, or `null` if unset/empty or the name doesn't resolve. */
  text(label: Label, key: string, at: AtBlock): Promise<string | null>;
  /** Expiry (Unix seconds) recorded at that block, or `null` if the name isn't registered. */
  expiry(label: Label, at: AtBlock): Promise<bigint | null>;
  /** The latest Sepolia block whose timestamp is <= `unixSeconds`. */
  sepoliaBlockAt(unixSeconds: bigint): Promise<bigint>;
  headBlock(): Promise<bigint>;
}
