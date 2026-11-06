import { describe, expect, it } from "vitest";
import { PACKAGE } from "./index";

describe("@lanyard/ens", () => {
  it("is wired into the workspace", () => {
    expect(PACKAGE).toBe("@lanyard/ens");
  });
});
