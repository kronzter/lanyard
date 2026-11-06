import { describe, expect, it } from "vitest";
import { PACKAGE } from "./index";

describe("@lanyard/shared", () => {
  it("is wired into the workspace", () => {
    expect(PACKAGE).toBe("@lanyard/shared");
  });
});
