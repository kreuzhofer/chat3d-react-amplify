/**
 * Write the serving condition back onto the runs current decisions lean on
 * (issue #71, ADR 0005).
 *
 * The stamp only starts recording from the day it lands, and three runs older
 * than that carry weight: #61's stability pair (which qualified the judge),
 * #63's re-rating batch (2,527 ratings), and #67's three (N, R) points (which
 * established the rule in the first place). Their conditions are documented —
 * in the prototype READMEs for the experiment arms, and sample by sample in
 * #63's 20,580-line gateway TSV — so they are recoverable rather than lost.
 *
 * Everything earlier stays NULL and reads **R-unknown**. Assumed-good history
 * is what made the 09-06 and 09-07 artefacts look comparable when they were
 * not; back-filling a plausible three would recreate exactly that.
 *
 * Annotated rows are marked `serving_source = 'annotated'`, never 'gateway':
 * a number written back from a record is not a reading taken at dispatch, and
 * a later analysis must be able to tell them apart.
 *
 *   npx tsx scripts/annotate-serving-provenance.ts            # dry run
 *   npx tsx scripts/annotate-serving-provenance.ts --apply
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/db/prisma.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("annotate-serving");

/** The pool every one of these runs was served by. */
const POOL = "qwen3.8-27b-nvfp4";

/** #63's gateway samples, one line per member per 2 s: ts, node, serving, inflight, deploymentId. */
const BATCH_TSV = "prototypes/63-spot-check/gateway-pool63.tsv";

// ── The experiment arms ──────────────────────────────────────────────

interface AnnotatedRun {
  /** Run id prefix, as the prototype records name it. */
  run: string;
  /** R: replicas serving the pool for this run. */
  servingCount: number;
  /** N: the driver's configured concurrency. */
  driverConcurrency: number;
  why: string;
}

/**
 * Conditions as the prototype records state them — `prototypes/61-qualification/README.md`
 * ("All runs: … `global.vlm_experiment_concurrency = 3`", with a per-arm tenancy column) and
 * `prototypes/67-zoom-views/FINDINGS.md` (the three (N, R) points, with the 07:10:44 UTC drop).
 *
 * `maxInflight` is deliberately not written for any of them: nobody sampled it
 * per call at the time. Arm 2's co-tenant arrived at 13:40:44, mid-run, so
 * even a per-run figure would be false for the first three quarters of it.
 */
const RUNS: AnnotatedRun[] = [
  // #61 — the qualification, 2026-09-06, three replicas serving all day.
  { run: "62b4fa58", servingCount: 3, driverConcurrency: 3, why: "#61 arm 1 (candidate, judge only)" },
  { run: "1f63d1d1", servingCount: 3, driverConcurrency: 3, why: "#61 arm 2 (co-tenant from 13:40:44)" },
  { run: "043c80fd", servingCount: 3, driverConcurrency: 3, why: "#61 arm 3 (clean pair with arm 1)" },
  // #67 — 2026-09-07, after spark-02's engine was OOM-killed at 07:10:44 UTC.
  { run: "3f613fa2", servingCount: 2, driverConcurrency: 3, why: "#67 N=3/R=2 (the nondeterministic pair)" },
  { run: "9ba22fa4", servingCount: 2, driverConcurrency: 3, why: "#67 N=3/R=2 (the nondeterministic pair)" },
  { run: "46d89f09", servingCount: 2, driverConcurrency: 2, why: "#67 N=2/R=2" },
  { run: "8faf4ffa", servingCount: 2, driverConcurrency: 2, why: "#67 N=2/R=2" },
];

/**
 * `444483ec` (#61's reference) and `0702d11a` (#67's) are Sonnet on the
 * Anthropic path. They never touched the pool, so they have no serving
 * condition to record and are left NULL rather than annotated with someone
 * else's replica count.
 */

// ── #63's batch, from the samples ────────────────────────────────────

interface Sample {
  at: number;
  servingCount: number;
  maxInflight: number;
}

/** Collapse the per-member lines into one reading per timestamp. */
export function parseGatewaySamples(tsv: string): Sample[] {
  const byTs = new Map<string, { serving: number; maxInflight: number }>();
  for (const line of tsv.split("\n")) {
    const [ts, , serving, inflight] = line.split("\t");
    if (!ts || serving === undefined || serving === "ERROR") continue;
    const bucket = byTs.get(ts) ?? { serving: 0, maxInflight: 0 };
    if (serving === "True") {
      bucket.serving += 1;
      bucket.maxInflight = Math.max(bucket.maxInflight, Number(inflight) || 0);
    }
    byTs.set(ts, bucket);
  }
  return [...byTs.entries()]
    .map(([ts, b]) => ({ at: Date.parse(ts), servingCount: b.serving, maxInflight: b.maxInflight }))
    .filter((s) => Number.isFinite(s.at))
    .sort((a, b) => a.at - b.at);
}

/** The sample nearest `at`, or null when it falls outside the sampled window. */
export function sampleAt(samples: Sample[], at: number, toleranceMs = 15_000): Sample | null {
  if (samples.length === 0) return null;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].at < at) lo = mid + 1;
    else hi = mid;
  }
  const after = samples[lo];
  const before = samples[Math.max(0, lo - 1)];
  // A tie goes to the earlier sample: it is the condition already true when
  // the call was dispatched, which is what the stamp describes.
  const nearest = Math.abs(after.at - at) < Math.abs(before.at - at) ? after : before;
  return Math.abs(nearest.at - at) <= toleranceMs ? nearest : null;
}

// ── Writing ──────────────────────────────────────────────────────────

async function annotateRuns(apply: boolean): Promise<void> {
  for (const r of RUNS) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM llm_usage_events
      WHERE purpose = 'vlm_evaluation'
        AND serving_source IS NULL
        AND experiment_run_id::text LIKE ${r.run + "%"}
    `;
    logger.info({ run: r.run, rows: rows.length, R: r.servingCount, N: r.driverConcurrency, why: r.why },
      apply ? "annotating run" : "would annotate run");
    if (!apply || rows.length === 0) continue;

    await prisma.$executeRaw`
      UPDATE llm_usage_events
      SET serving_name = ${POOL},
          serving_replicas = ${r.servingCount},
          driver_concurrency = ${r.driverConcurrency},
          serving_source = 'annotated'
      WHERE purpose = 'vlm_evaluation'
        AND serving_source IS NULL
        AND experiment_run_id::text LIKE ${r.run + "%"}
    `;
  }
}

/**
 * #63's batch has no run row of any kind — the whole reason ADR 0005 chose
 * `llm_usage_events` — so its rows are found by time and matched to the
 * nearest gateway sample. A call whose timestamp falls outside the sampled
 * window keeps NULL.
 */
async function annotateBatch(apply: boolean): Promise<void> {
  const path = resolve(import.meta.dirname, "..", BATCH_TSV);
  let samples: Sample[];
  try {
    samples = parseGatewaySamples(readFileSync(path, "utf8"));
  } catch (err) {
    logger.warn({ err, path }, "no gateway samples for #63's batch — its rows stay R-unknown");
    return;
  }
  if (samples.length === 0) {
    logger.warn({ path }, "gateway sample file held no readable samples");
    return;
  }

  const from = new Date(samples[0].at);
  const to = new Date(samples[samples.length - 1].at);
  logger.info({ samples: samples.length, from, to }, "gateway samples for #63's batch");

  const rows = await prisma.$queryRaw<Array<{ id: string; created_at: Date }>>`
    SELECT id, created_at FROM llm_usage_events
    WHERE purpose = 'vlm_evaluation'
      AND serving_source IS NULL
      AND experiment_run_id IS NULL
      AND created_at BETWEEN ${from} AND ${to}
    ORDER BY created_at
  `;

  let matched = 0;
  let unmatched = 0;
  const seen = new Map<string, number>();
  for (const row of rows) {
    const s = sampleAt(samples, row.created_at.getTime());
    if (!s) { unmatched += 1; continue; }
    matched += 1;
    seen.set(`R=${s.servingCount} maxInflight=${s.maxInflight}`, (seen.get(`R=${s.servingCount} maxInflight=${s.maxInflight}`) ?? 0) + 1);
    if (!apply) continue;
    await prisma.$executeRaw`
      UPDATE llm_usage_events
      SET serving_name = ${POOL},
          serving_replicas = ${s.servingCount},
          serving_max_inflight = ${s.maxInflight},
          driver_concurrency = 3,
          serving_source = 'annotated'
      WHERE id = ${row.id}::uuid
    `;
  }

  logger.info({ rows: rows.length, matched, unmatched, conditions: Object.fromEntries(seen) },
    apply ? "annotated #63's batch" : "would annotate #63's batch");
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (!apply) logger.info("dry run — pass --apply to write");

  await annotateRuns(apply);
  await annotateBatch(apply);

  const [remaining] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*) FROM llm_usage_events
    WHERE purpose = 'vlm_evaluation' AND serving_source IS NULL
  `;
  logger.info({ rUnknown: Number(remaining.count) }, "judge calls that read R-unknown, as they should");
  await prisma.$disconnect();
}

// Run main only when executed directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error({ err }, "annotation failed");
    process.exit(1);
  });
}
