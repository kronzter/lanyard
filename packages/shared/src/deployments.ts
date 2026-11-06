/**
 * Deployments schema and loader (P0.2-R3).
 *
 * `deployments/sepolia.json` (A writes) and `deployments/rabdi.json` (B writes) must
 * always contain every key. A value is `null` until it's deployed. Parsing fails loudly
 * on a missing key or a malformed address; `required()` fails loudly on a `null`.
 *
 * Takes already-parsed JSON (import it, or `JSON.parse` it), so this file has no
 * Node-only imports and runs on Hermes, in the browser and on Node.
 */
import { z } from "zod";
import { isAddress, isHex, type Address, type Hex } from "viem";

const address = z
  .string()
  .refine((s) => isAddress(s, { strict: false }), "not a valid address")
  .transform((s) => s as Address);
const maybeAddress = address.nullable();
const maybeKey = z
  .string()
  .refine((s) => isHex(s) && s.length === 66, "not a 32-byte hex key")
  .transform((s) => s as Hex)
  .nullable();

export const sepoliaDeploymentsSchema = z.strictObject({
  chainId: z.literal(11155111),
  ens: z.strictObject({
    verifiableFactory: maybeAddress,
    userRegistryImpl: maybeAddress,
    permissionedResolverImpl: maybeAddress,
    universalResolver: maybeAddress,
  }),
  lanyard: z.strictObject({
    baseRegistry: maybeAddress,
    editionRegistry: maybeAddress,
    registrar: maybeAddress,
    winnerRegistrar: maybeAddress,
    books: z.strictObject({
      hackers: maybeAddress,
      judges: maybeAddress,
      volunteers: maybeAddress,
      partners: maybeAddress,
    }),
    resolvers: z.strictObject({
      staff: maybeAddress,
      hackers: maybeAddress,
      event: maybeAddress,
      results: maybeAddress,
    }),
  }),
});

export const rabdiDeploymentsSchema = z.strictObject({
  chainId: z.literal(7794095),
  deskWallet: maybeAddress,
  venueRecordKey: maybeKey,
});

export type SepoliaDeployments = z.infer<typeof sepoliaDeploymentsSchema>;
export type RabdiDeployments = z.infer<typeof rabdiDeploymentsSchema>;

export class DeploymentsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeploymentsError";
  }
}

function parse<T>(schema: z.ZodType<T>, json: unknown, file: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new DeploymentsError(`${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function parseSepoliaDeployments(json: unknown): SepoliaDeployments {
  return parse(sepoliaDeploymentsSchema, json, "deployments/sepolia.json");
}

export function parseRabdiDeployments(json: unknown): RabdiDeployments {
  return parse(rabdiDeploymentsSchema, json, "deployments/rabdi.json");
}

/** Returns a deployed value, or throws naming what isn't deployed yet. */
export function required<T>(value: T | null, what: string): T {
  if (value === null) throw new DeploymentsError(`${what} is not deployed yet (null)`);
  return value;
}
