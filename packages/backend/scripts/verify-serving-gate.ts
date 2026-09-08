/**
 * Verify the serving gate against the live pool (issue #72, ADR 0006).
 *
 * Read-only: it opens a gate on the judge's real gateway, prints what the
 * pre-flight would clamp each configured concurrency to, and asks the gate for
 * one dispatch. Nothing is dispatched, no rating is written, no row is touched
 * — `admit()` only reads the snapshot ADR 0005 already samples.
 *
 * Usage:
 *   npx tsx scripts/verify-serving-gate.ts
 */

import { getModelForPurpose } from "../src/services/llm-config.service.js";
import { openServingGate, ServingGateError, ServingHaltError } from "../src/services/serving-gate.service.js";
import { readServingSnapshot } from "../src/services/serving-provenance.service.js";
import { getVlmExperimentConcurrency } from "../src/services/generation-settings.service.js";
import { prisma } from "../src/db/prisma.js";

async function main(): Promise<void> {
  const judge = await getModelForPurpose("vlm_eval");
  const configured = await getVlmExperimentConcurrency();
  console.log(`judge:      ${judge.label} (${judge.modelName})`);
  console.log(`endpoint:   ${judge.endpointUrl ?? "(none — the gate records unknown and does not clamp)"}`);
  console.log(`setting:    global.vlm_experiment_concurrency = ${configured}`);

  const snapshot = await readServingSnapshot(judge.endpointUrl, judge.modelName);
  console.log(`snapshot:   R=${snapshot?.servingCount ?? "unknown"} maxInflight=${snapshot?.maxInflight ?? "unknown"}`);
  console.log("");

  for (const n of [1, configured, 8]) {
    try {
      const gate = await openServingGate({
        endpointUrl: judge.endpointUrl,
        publishedName: judge.modelName,
        configuredConcurrency: n,
        label: `verify N=${n}`,
      });
      console.log(`configured ${n} → runs at ${gate.concurrency}`);
    } catch (err) {
      if (!(err instanceof ServingGateError)) throw err;
      console.log(`configured ${n} → REFUSED: ${err.message}`);
    }
  }
  console.log("");

  // One dispatch decision on the pool as it stands. A busy pool with two
  // requests on one replica will hold this for up to the back-off budget.
  const gate = await openServingGate({
    endpointUrl: judge.endpointUrl,
    publishedName: judge.modelName,
    configuredConcurrency: configured,
    label: "verify admit",
  });
  try {
    await gate.admit();
    console.log(`admit() → dispatched (back-offs ${gate.backoffs})`);
  } catch (err) {
    if (!(err instanceof ServingHaltError)) throw err;
    console.log(`admit() → HALT (${err.reason}) after ${gate.backoffs} back-off(s)`);
  }
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
