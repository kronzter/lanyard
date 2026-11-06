/**
 * Schemas for the shared fixtures in `fixtures/` (P0.4). The mocks and tests parse
 * fixtures through these, so a broken fixture fails loudly.
 */
import { z } from "zod";
import { isAddress, type Address } from "viem";

const address = z
  .string()
  .refine((s) => isAddress(s), "not a valid checksummed address")
  .transform((s) => s as Address);

export const personaSchema = z.object({
  id: z.string(),
  role: z.enum([
    "organizer",
    "results-key",
    "desk",
    "volunteer-coordinator",
    "head-judge",
    "partner",
    "partner-staff",
    "judge",
    "lead",
    "volunteer",
    "hacker",
  ]),
  /** Relative ENS label; `""` = the edition (organizer); `null` = holds no badge. */
  label: z.string().nullable(),
  /** Book or sub-book the badge is in, e.g. `volunteers`, `judges.arkiv.partners`. */
  book: z.string().nullable(),
  partner: z.string().optional(),
  team: z.string().optional(),
  displayName: z.string().optional(),
  address,
  /** Where the key lives locally. Never the key itself. */
  key: z.object({ env: z.string(), index: z.number().int().nonnegative().optional() }),
});

export const personasFileSchema = z.object({
  $comment: z.string(),
  personas: z.array(personaSchema),
  teams: z.array(z.object({ team: z.string(), lead: z.string(), members: z.array(z.string()) })),
});

const ensEventBase = { block: z.number().int().nonnegative(), label: z.string() };
export const ensEventSchema = z.discriminatedUnion("type", [
  z.object({
    ...ensEventBase,
    type: z.literal("register"),
    owner: address,
    expiry: z.number().int(),
  }),
  z.object({ ...ensEventBase, type: z.literal("unregister") }),
  z.object({ ...ensEventBase, type: z.literal("renew"), expiry: z.number().int() }),
  z.object({
    ...ensEventBase,
    type: z.literal("setText"),
    key: z.string(),
    /** `""` removes the record. */
    value: z.string(),
  }),
]);

export const ensHistoryFileSchema = z.object({
  $comment: z.string(),
  story: z.record(z.string(), z.number()),
  events: z.array(ensEventSchema),
});

const keyTime = z.object({ timestamp: z.number().int(), block: z.number().int() });
export const timelineFileSchema = z.object({
  $comment: z.string(),
  blockTimeSeconds: z.number().int().positive(),
  genesis: keyTime,
  keyTimes: z.object({
    eventStart: keyTime,
    submissionDeadline: keyTime,
    judgingEnd: keyTime,
    results: keyTime,
    eventEnd: keyTime,
  }),
});

export type Persona = z.infer<typeof personaSchema>;
export type PersonasFile = z.infer<typeof personasFileSchema>;
export type EnsEvent = z.infer<typeof ensEventSchema>;
export type EnsHistoryFile = z.infer<typeof ensHistoryFileSchema>;
export type TimelineFile = z.infer<typeof timelineFileSchema>;
