/**
 * Event configuration for the mumbai2026 edition (P0.2-R1).
 *
 * Times are Unix seconds (bigint). They are demo values: set the real ones before the
 * live demo (I4), because submission and judging checks compare against them.
 */

/** 09:00 IST on 27 Nov 2026 = 03:30 UTC. */
const DAY = 86_400n;
const HOUR = 3_600n;
const EVENT_START = 1_795_750_200n;

export const EVENT = {
  baseName: "lanyard.eth",
  edition: "mumbai2026",
  /** Partner labels, as in `<partner>.partners`. Adding one is a config + seed change. */
  partners: ["arkiv", "ens"],
  times: {
    eventStart: EVENT_START,
    submissionDeadline: EVENT_START + DAY, // 09:00 IST day 2
    judgingEnd: EVENT_START + DAY + 5n * HOUR, // 14:00 IST day 2
    results: EVENT_START + DAY + 7n * HOUR, // 16:00 IST day 2
    eventEnd: EVENT_START + DAY + 9n * HOUR, // 18:00 IST day 2
  },
} as const;

export type Partner = (typeof EVENT.partners)[number];
export type EventTimeKey = keyof typeof EVENT.times;

/** The edition's full ENS name, e.g. `mumbai2026.lanyard.eth`. */
export const EDITION_NAME = `${EVENT.edition}.${EVENT.baseName}`;
