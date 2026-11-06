import { describe, expect, it } from "vitest";
import { EDITION_NAME, EVENT } from "./event.config";
import { assertLabel } from "./labels";

describe("event config", () => {
  it("key times are in order", () => {
    const t = EVENT.times;
    expect(t.eventStart < t.submissionDeadline).toBe(true);
    expect(t.submissionDeadline < t.judgingEnd).toBe(true);
    expect(t.judgingEnd < t.results).toBe(true);
    expect(t.results <= t.eventEnd).toBe(true);
  });

  it("names are valid", () => {
    expect(EDITION_NAME).toBe("mumbai2026.lanyard.eth");
    for (const p of EVENT.partners) assertLabel(p);
  });
});
