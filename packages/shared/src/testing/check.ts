/** A named conformance check. Throws `ConformanceError` (or anything) on failure. */
export interface Check<Subject, Scenario> {
  name: string;
  run(subject: Subject, scenario: Scenario): Promise<void> | void;
}

export class ConformanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConformanceError";
  }
}

export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ConformanceError(message);
}

export function ensureEqual<T>(actual: T, expected: T, what: string): void {
  if (actual !== expected) {
    throw new ConformanceError(`${what}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

export async function ensureRejects(fn: () => Promise<unknown>, what: string): Promise<void> {
  try {
    await fn();
  } catch {
    return;
  }
  throw new ConformanceError(`${what}: expected a rejection, but it succeeded`);
}

/**
 * Runs every check with a fresh subject and returns the names of the checks that failed.
 * Used by the broken-mock self-tests (P0.3-R5).
 */
export async function failingChecks<S, C>(
  checks: Check<S, C>[],
  makeSubject: () => S | Promise<S>,
  scenario: C,
): Promise<string[]> {
  const failed: string[] = [];
  for (const c of checks) {
    try {
      await c.run(await makeSubject(), scenario);
    } catch {
      failed.push(c.name);
    }
  }
  return failed;
}
