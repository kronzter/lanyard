import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/shared",
      "packages/ens",
      "packages/venue",
      "packages/arkiv",
      "packages/rules",
      "packages/cli",
    ],
    passWithNoTests: false,
  },
});
