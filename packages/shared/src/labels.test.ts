import { describe, expect, it } from "vitest";
import { assertLabel, isLabel, LabelError, toFullName, toRelativeLabel } from "./labels";

describe("assertLabel", () => {
  it.each(["priya.volunteers", "zkpay", "ana.judges.arkiv.partners", "zk-pay", "team42", ""])(
    "accepts %j",
    (label) => {
      expect(assertLabel(label)).toBe(label);
    },
  );

  it.each([
    ["Judges", "mixed case"],
    ["judges ", "trailing space"],
    [" judges", "leading space"],
    ["🔥", "emoji"],
    ["zk🔥pay", "emoji inside"],
    ["-zk", "leading hyphen"],
    ["zk-", "trailing hyphen"],
    ["priya..volunteers", "empty segment"],
    [".priya", "leading dot"],
    ["priya_v", "underscore"],
  ])("rejects %j (%s)", (label) => {
    expect(() => assertLabel(label)).toThrow(LabelError);
    expect(isLabel(label)).toBe(false);
  });
});

describe("full and relative names", () => {
  it("adds the edition suffix", () => {
    expect(toFullName("priya.volunteers")).toBe("priya.volunteers.mumbai2026.lanyard.eth");
  });

  it("maps the empty label to the edition name", () => {
    expect(toFullName("")).toBe("mumbai2026.lanyard.eth");
    expect(toRelativeLabel("mumbai2026.lanyard.eth")).toBe("");
  });

  it("round-trips", () => {
    for (const label of ["zkpay", "ana.judges.arkiv.partners", "winner.zkpay"]) {
      expect(toRelativeLabel(toFullName(label))).toBe(label);
    }
  });

  it("rejects names outside the edition", () => {
    expect(() => toRelativeLabel("vitalik.eth")).toThrow(LabelError);
    expect(() => toRelativeLabel("priya.volunteers.other2026.lanyard.eth")).toThrow(LabelError);
  });

  it("rejects non-normalized full names", () => {
    expect(() => toRelativeLabel("Priya.volunteers.mumbai2026.lanyard.eth")).toThrow(LabelError);
  });
});
