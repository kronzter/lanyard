import type { Address } from "viem";
import type { EnsHistoryFile, PersonasFile, TimelineFile } from "../fixtures";
import type { EnsReader } from "../interfaces/ens-reader";
import { ensure, ensureEqual, type Check } from "./check";

/**
 * What the suite needs to know about the chain under test. For the mock it comes from the
 * fixtures (`ensScenarioFromFixtures`); for `SepoliaEnsReader` (A2.4) from a scenario
 * replayed on a Sepolia fork.
 */
export interface EnsReaderScenario {
  /** A name registered at `registeredAt` and unregistered at `unregisteredAt`. */
  revoked: { label: string; owner: Address; registeredAt: bigint; unregisteredAt: bigint };
  /** A text record set at `setAt` and cleared (set to "") at `clearedAt`. */
  text: { label: string; key: string; value: string; setAt: bigint; clearedAt: bigint };
  /**
   * A name with expiry `expiry`; `lastBlockBefore` has timestamp < expiry, and
   * `firstBlockAtOrAfter` has timestamp >= expiry (ideally == expiry).
   */
  expiring: {
    label: string;
    owner: Address;
    expiry: bigint;
    lastBlockBefore: bigint;
    firstBlockAtOrAfter: bigint;
  };
  /** Two consecutive blocks and their timestamps, at least 2 s apart. */
  consecutive: [{ block: bigint; timestamp: bigint }, { block: bigint; timestamp: bigint }];
}

const same = (a: string | null, b: string) => a !== null && a.toLowerCase() === b.toLowerCase();

export const ensReaderChecks: Check<EnsReader, EnsReaderScenario>[] = [
  {
    name: "a name resolves only between its register and unregister blocks",
    async run(r, { revoked: s }) {
      const at = (b: bigint) => r.resolve(s.label, { sepoliaBlock: b });
      ensureEqual(await at(s.registeredAt - 1n), null, "one block before register");
      ensure(same(await at(s.registeredAt), s.owner), "at the register block: owner");
      ensure(same(await at(s.unregisteredAt - 1n), s.owner), "one block before unregister: owner");
      ensureEqual(await at(s.unregisteredAt), null, "at the unregister block");
    },
  },
  {
    name: "text reflects the value set at or before the block",
    async run(r, { text: s }) {
      const at = (b: bigint) => r.text(s.label, s.key, { sepoliaBlock: b });
      ensure((await at(s.setAt - 1n)) !== s.value, "one block before setText: not yet set");
      ensureEqual(await at(s.setAt), s.value, "at the setText block");
      ensureEqual(await at(s.clearedAt - 1n), s.value, "one block before clearing");
      ensureEqual(await at(s.clearedAt), null, "at the clearing block");
    },
  },
  {
    name: "a badge is expired at exactly its expiry second",
    async run(r, { expiring: s }) {
      ensureEqual(
        await r.expiry(s.label, { sepoliaBlock: s.lastBlockBefore }),
        s.expiry,
        "expiry() value",
      );
      ensure(
        same(await r.resolve(s.label, { sepoliaBlock: s.lastBlockBefore }), s.owner),
        "resolves just before expiry",
      );
      ensureEqual(
        await r.resolve(s.label, { sepoliaBlock: s.firstBlockAtOrAfter }),
        null,
        "resolve at the first block with timestamp >= expiry",
      );
    },
  },
  {
    name: "sepoliaBlockAt picks the earlier of two blocks",
    async run(r, { consecutive: [a, b] }) {
      ensureEqual(await r.sepoliaBlockAt(a.timestamp), a.block, "exact timestamp of block A");
      ensureEqual(await r.sepoliaBlockAt(a.timestamp + 1n), a.block, "between A and B");
      ensureEqual(await r.sepoliaBlockAt(b.timestamp - 1n), a.block, "just before B");
      ensureEqual(await r.sepoliaBlockAt(b.timestamp), b.block, "exact timestamp of block B");
    },
  },
  {
    name: "headBlock is at or after every scenario block",
    async run(r, s) {
      const head = await r.headBlock();
      for (const b of [
        s.revoked.unregisteredAt,
        s.text.clearedAt,
        s.expiring.firstBlockAtOrAfter,
      ]) {
        ensure(head >= b, `head ${head} is before scenario block ${b}`);
      }
    },
  },
];

/** Builds the scenario from the committed fixtures (Ben revoked, Priya's note, Tara's expiry). */
export function ensScenarioFromFixtures(
  history: EnsHistoryFile,
  timeline: TimelineFile,
  personas: PersonasFile,
): EnsReaderScenario {
  const owner = (label: string) => {
    const p = personas.personas.find((x) => x.label === label);
    if (!p) throw new Error(`no persona ${label}`);
    return p.address;
  };
  const block = (label: string, type: string, nth = 0) => {
    const e = history.events.filter((x) => x.label === label && x.type === type)[nth];
    if (!e) throw new Error(`no ${type} #${nth} for ${label}`);
    return BigInt(e.block);
  };
  const g = timeline.genesis;
  const blockTime = BigInt(timeline.blockTimeSeconds);
  const expiry = BigInt(history.story.taraExpiresAtTimestamp!);
  const atOrAfter = BigInt(g.block) + (expiry - BigInt(g.timestamp) + blockTime - 1n) / blockTime;
  const a = BigInt(timeline.keyTimes.eventStart.block);
  const ta = BigInt(timeline.keyTimes.eventStart.timestamp);

  return {
    revoked: {
      label: "ben.judges.arkiv.partners",
      owner: owner("ben.judges.arkiv.partners"),
      registeredAt: block("ben.judges.arkiv.partners", "register"),
      unregisteredAt: block("ben.judges.arkiv.partners", "unregister"),
    },
    text: {
      label: "priya.volunteers",
      key: "lanyard.perms",
      value: "shift-manager",
      setAt: block("priya.volunteers", "setText", 0),
      clearedAt: block("priya.volunteers", "setText", 1),
    },
    expiring: {
      label: "tara.volunteers",
      owner: owner("tara.volunteers"),
      expiry,
      lastBlockBefore: atOrAfter - 1n,
      firstBlockAtOrAfter: atOrAfter,
    },
    consecutive: [
      { block: a, timestamp: ta },
      { block: a + 1n, timestamp: ta + blockTime },
    ],
  };
}
