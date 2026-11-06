import { describe, expect, it } from "vitest";
import sepolia from "../../../deployments/sepolia.json";
import rabdi from "../../../deployments/rabdi.json";
import {
  DeploymentsError,
  parseRabdiDeployments,
  parseSepoliaDeployments,
  required,
} from "./deployments";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe("deployments files", () => {
  it("the committed placeholder files are valid", () => {
    expect(parseSepoliaDeployments(sepolia).chainId).toBe(11155111);
    expect(parseRabdiDeployments(rabdi).chainId).toBe(7794095);
  });

  it("rejects a missing key", () => {
    const broken = clone(sepolia) as Record<string, unknown>;
    delete (broken.lanyard as Record<string, unknown>).registrar;
    expect(() => parseSepoliaDeployments(broken)).toThrow(/registrar/);
  });

  it("rejects a malformed address", () => {
    const broken = clone(sepolia);
    (broken.lanyard as { registrar: unknown }).registrar = "0x1234";
    expect(() => parseSepoliaDeployments(broken)).toThrow(DeploymentsError);
  });

  it("rejects the wrong chain", () => {
    expect(() => parseRabdiDeployments({ ...rabdi, chainId: 1 })).toThrow(DeploymentsError);
  });

  it("rejects unknown keys", () => {
    expect(() => parseRabdiDeployments({ ...rabdi, extra: true })).toThrow(DeploymentsError);
  });

  it("accepts a deployed address", () => {
    const deployed = clone(sepolia);
    (deployed.lanyard as { registrar: unknown }).registrar =
      "0x000000000000000000000000000000000000dEaD";
    const parsed = parseSepoliaDeployments(deployed);
    expect(required(parsed.lanyard.registrar, "registrar")).toBe(
      "0x000000000000000000000000000000000000dEaD",
    );
  });

  it("required() fails loudly on a placeholder", () => {
    const parsed = parseSepoliaDeployments(sepolia);
    expect(() => required(parsed.lanyard.registrar, "LanyardRegistrar")).toThrow(
      /LanyardRegistrar is not deployed/,
    );
  });
});
