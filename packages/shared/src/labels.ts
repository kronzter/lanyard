/**
 * Relative labels ↔ full ENS names (P0.2-R4).
 *
 * A relative label is written relative to the edition: `priya.volunteers`,
 * `zkpay`, `ana.judges.arkiv.partners`. The empty label `""` is the edition name
 * itself (owned by the organizer).
 *
 * Policy, stricter than ENSIP-15: input must already be normalized (no case folding,
 * no stray whitespace), and every segment must match `[a-z0-9-]`, not start or end
 * with `-`. ENSIP-15 alone would map `Judges` → `judges` and allow emoji.
 */
import { normalize } from "viem/ens";
import { EDITION_NAME } from "./event.config";

export type Label = string;

const SEGMENT = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SUFFIX = `.${EDITION_NAME}`;

export class LabelError extends Error {
  constructor(input: string, reason: string) {
    super(`invalid label ${JSON.stringify(input)}: ${reason}`);
    this.name = "LabelError";
  }
}

/** Returns the label unchanged if it's valid, otherwise throws `LabelError`. */
export function assertLabel(label: string): Label {
  if (label === "") return label;
  for (const segment of label.split(".")) {
    if (!SEGMENT.test(segment)) {
      throw new LabelError(label, `segment ${JSON.stringify(segment)} must match [a-z0-9-]`);
    }
  }
  let normalized: string;
  try {
    normalized = normalize(label);
  } catch (e) {
    throw new LabelError(label, `not ENSIP-15 normalizable (${(e as Error).message})`);
  }
  if (normalized !== label) throw new LabelError(label, "not ENSIP-15 normalized");
  return label;
}

export function isLabel(label: string): boolean {
  try {
    assertLabel(label);
    return true;
  } catch {
    return false;
  }
}

/** `priya.volunteers` → `priya.volunteers.mumbai2026.lanyard.eth`; `""` → the edition name. */
export function toFullName(label: Label): string {
  assertLabel(label);
  return label === "" ? EDITION_NAME : `${label}${SUFFIX}`;
}

/** `priya.volunteers.mumbai2026.lanyard.eth` → `priya.volunteers`. Throws outside the edition. */
export function toRelativeLabel(fullName: string): Label {
  if (fullName === EDITION_NAME) return "";
  if (!fullName.endsWith(SUFFIX)) {
    throw new LabelError(fullName, `not under ${EDITION_NAME}`);
  }
  return assertLabel(fullName.slice(0, -SUFFIX.length));
}
