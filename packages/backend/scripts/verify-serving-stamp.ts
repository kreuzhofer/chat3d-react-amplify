/**
 * One real judge call against the live pool, to see the serving stamp land
 * (issue #71). Reads `vlm_eval`'s own model row, so it verifies the path
 * production takes — the gateway URL derived from the provider's endpoint, the
 * snapshot read at dispatch, the columns written on the usage row.
 *
 * Touches no rating and no workbench row: it adds one `llm_usage_events` row
 * and nothing else. Run it only when no judge run is in flight (ADR 0004's
 * sole-tenancy rule) — it puts one request on the pool.
 *
 *   npx tsx scripts/verify-serving-stamp.ts
 */
import { prisma } from "../src/db/prisma.js";
import { getModelForPurpose, createProviderModel } from "../src/services/llm-config.service.js";
import { trackedGenerateText } from "../src/services/tracked-llm.service.js";
import { runWithUsageContext } from "../src/services/usage-tracking.service.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("verify-serving-stamp");

async function main(): Promise<void> {
  const judge = await getModelForPurpose("vlm_eval");
  logger.info({ provider: judge.provider, model: judge.modelName, endpointUrl: judge.endpointUrl }, "the judge vlm_eval points at");

  const before = new Date();
  // A driver's N, as the batch runner would set it — several context frames
  // above the call that records it.
  await runWithUsageContext({ driverConcurrency: 2, source: "system" }, () =>
    trackedGenerateText(
      { model: createProviderModel(judge), prompt: "Reply with the single word: ok", maxOutputTokens: 16, temperature: 0 },
      {
        purpose: "vlm_evaluation",
        providerName: judge.provider,
        modelId: judge.id,
        modelName: judge.modelName,
        modelConfig: { costPer1mInput: judge.costPer1mInput, costPer1mOutput: judge.costPer1mOutput },
        endpointUrl: judge.endpointUrl,
      },
    ),
  );

  // recordUsageEvent is fire-and-forget; give the insert a moment.
  await new Promise((r) => setTimeout(r, 1500));

  const rows = await prisma.llmUsageEvent.findMany({
    where: { purpose: "vlm_evaluation", createdAt: { gte: before } },
    select: {
      createdAt: true, modelName: true, durationMs: true,
      servingName: true, servingReplicas: true, servingMaxInflight: true,
      driverConcurrency: true, servingSource: true,
    },
  });
  logger.info({ rows }, rows.length ? "stamped" : "no usage row was written");
  await prisma.$disconnect();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { logger.error({ err }, "verification failed"); process.exit(1); });
}
