/**
 * The serving gate (ADR 0006, issue #72).
 *
 * ADR 0005 made a judge call's **Serving provenance** readable and deliberately
 * left it inert: a run under a broken condition still completed and still
 * stored ratings, now labelled. This is what the harness *does* about a
 * violation — it gates before the call, on the very snapshot ADR 0005 already
 * takes, so no second sampler exists to disagree with the stamp.
 *
 * The condition is **Uncontended serving**, evaluated in two halves at their
 * natural moments: `N ≤ R` once as a pre-flight, so an overnight batch fails in
 * the first second rather than after forty rows, and `max per-replica inflight
 * ≤ 1` before each dispatch, which is the only reading that sees a co-tenant
 * and a lost replica alike.
 *
 * The two failures are not the same event. A co-tenant clears in seconds, so
 * the gate holds the next dispatch until there is headroom, bounded — past
 * which it is not transient. A replica dies for hours, so the run halts at
 * once. Halting is cheap because both drivers resume, and resuming is an
 * operator action: the pool has to be fixed first, and a retry loop would only
 * rediscover that.
 */

import { readServingSnapshot, SNAPSHOT_TTL_MS, type ServingSnapshot } from "./serving-provenance.service.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("serving-gate");

/** Nothing is serving. Refused before a run starts, since it fails on the next call anyway. */
export class ServingGateError extends Error {
  readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = "ServingGateError";
  }
}

/**
 * N ≤ R as a pre-flight: the driver runs at `min(configured, R)`.
 *
 * `global.vlm_experiment_concurrency` becomes a ceiling the operator sets, not
 * a claim about the pool — a hand-set number that has now drifted both ways.
 * An unknown R proceeds at the configured N and records unknown, because a
 * condition that was not read is not a licence to act as though it failed.
 */
export function clampConcurrency(
  configured: number,
  servingCount: number | null,
): { concurrency: number; clamped: boolean } {
  if (servingCount === null) return { concurrency: configured, clamped: false };
  if (servingCount === 0) {
    throw new ServingGateError("No replicas are serving the judge — refusing to start");
  }
  const concurrency = Math.min(configured, servingCount);
  return { concurrency, clamped: concurrency < configured };
}

// ── The per-dispatch decision ────────────────────────────────────────

/** Why a run stopped. Both are violations; only one of them heals. */
export type HaltReason = "replica-lost" | "no-replicas" | "contention";

export type DispatchDecision =
  | { action: "proceed" }
  | { action: "backoff"; reason: "contended" }
  | { action: "halt"; reason: Exclude<HaltReason, "contention"> };

/**
 * What to do with the next dispatch, given the snapshot and the replica count
 * the run started from.
 *
 * A lost replica is checked before the contention it causes: both readings fire
 * together when a replica dies under load (#67 measured them as the same
 * failure, 3.8% against 3.3%), and the answer must be the one that does not
 * wait for a heal that is not coming.
 *
 * An unread condition proceeds. The snapshot's `servingCount` is null when the
 * gateway was unreachable or does not list the pool, and `baselineReplicas` is
 * null when the pre-flight read failed the same way; neither is evidence of a
 * violation, and refusing on them would stop every Anthropic run.
 */
export function decideDispatch(
  snapshot: ServingSnapshot | null,
  baselineReplicas: number | null,
): DispatchDecision {
  const servingCount = snapshot?.servingCount ?? null;
  if (servingCount === null) return { action: "proceed" };
  if (servingCount === 0) return { action: "halt", reason: "no-replicas" };
  if (baselineReplicas !== null && servingCount < baselineReplicas) {
    return { action: "halt", reason: "replica-lost" };
  }
  if ((snapshot?.maxInflight ?? 0) > 1) return { action: "backoff", reason: "contended" };
  return { action: "proceed" };
}

// ── The gate over a run ──────────────────────────────────────────────

/**
 * Contention held the dispatch, or a replica went away. Thrown by `admit()`;
 * the driver halts on it, marks what it has, and waits for an operator.
 */
export class ServingHaltError extends Error {
  constructor(readonly reason: HaltReason, message: string) {
    super(message);
    this.name = "ServingHaltError";
  }
}

/**
 * How long contention may persist before it stops being transient: three judge
 * calls (17–19 s each). Past that it is not a co-tenant finishing a request.
 */
const BACKOFF_BUDGET_MS = 60_000;

export interface ServingGateOptions {
  /** The judge provider's configured endpoint; the gateway is derived from it. */
  endpointUrl: string | null | undefined;
  /** The served name to read the pool for. */
  publishedName: string;
  /** N as the operator set it — a ceiling, which the pre-flight may lower. */
  configuredConcurrency: number;
  /** Which driver this is, for the log line. */
  label: string;
  /** Test seam: how a snapshot is read. Defaults to ADR 0005's cached reader. */
  read?: () => Promise<ServingSnapshot | null>;
  /**
   * How often a held dispatch re-reads. Defaults to the snapshot's own TTL —
   * polling faster only re-reads the same cached payload.
   */
  pollIntervalMs?: number;
  backoffBudgetMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The gate a driver holds for the length of one run: the clamped concurrency it
 * may use, and the permission it must ask for before each dispatch.
 */
export class ServingGate {
  private baseline: number | null;
  private halted: HaltReason | null = null;
  private held = 0;

  constructor(
    readonly concurrency: number,
    baselineReplicas: number | null,
    private readonly opts: ServingGateOptions,
  ) {
    this.baseline = baselineReplicas;
  }

  /** Dispatches held for headroom. Counted per dispatch, not per poll. */
  get backoffs(): number {
    return this.held;
  }

  /** Why the run stopped, or null while the condition holds. */
  get violation(): HaltReason | null {
    return this.halted;
  }

  private read(): Promise<ServingSnapshot | null> {
    return this.opts.read
      ? this.opts.read()
      : readServingSnapshot(this.opts.endpointUrl, this.opts.publishedName);
  }

  private halt(reason: HaltReason): never {
    this.halted = reason;
    const message = `Serving condition violated (${reason}) — ${this.opts.label} halted`;
    logger.error({ label: this.opts.label, reason, backoffs: this.held }, message);
    throw new ServingHaltError(reason, message);
  }

  /**
   * Permission to dispatch the next judge call, waited for if the pool is
   * momentarily contended and refused for good if it is not momentarily.
   *
   * A halted gate stays halted: the workers still in flight when a replica went
   * away must stop, not race the next healthy-looking sample.
   */
  async admit(): Promise<void> {
    if (this.halted) this.halt(this.halted);

    const budget = this.opts.backoffBudgetMs ?? BACKOFF_BUDGET_MS;
    const poll = this.opts.pollIntervalMs ?? SNAPSHOT_TTL_MS;
    const deadline = Date.now() + budget;
    let counted = false;

    for (;;) {
      const snapshot = await this.read();
      // The pre-flight may have read nothing; the first R that does arrive is
      // the run's baseline, or a later drop would go unseen all night.
      if (this.baseline === null && snapshot?.servingCount != null && snapshot.servingCount > 0) {
        this.baseline = snapshot.servingCount;
      }

      const decision = decideDispatch(snapshot, this.baseline);
      if (decision.action === "proceed") return;
      if (decision.action === "halt") this.halt(decision.reason);

      if (!counted) {
        this.held += 1;
        counted = true;
        logger.warn(
          { label: this.opts.label, maxInflight: snapshot?.maxInflight, budgetMs: budget },
          "a co-tenant is sharing a replica — holding the next dispatch",
        );
      }
      if (Date.now() >= deadline) this.halt("contention");
      await sleep(poll);
    }
  }
}

/**
 * Read the pool once, clamp the driver's concurrency to it, and hand back the
 * gate the run then asks before every dispatch.
 *
 * Throws `ServingGateError` when nothing is serving — the one case worth
 * refusing outright, since the first call would fail on it anyway.
 */
export async function openServingGate(opts: ServingGateOptions): Promise<ServingGate> {
  const snapshot = opts.read
    ? await opts.read()
    : await readServingSnapshot(opts.endpointUrl, opts.publishedName);
  const servingCount = snapshot?.servingCount ?? null;
  const { concurrency, clamped } = clampConcurrency(opts.configuredConcurrency, servingCount);

  logger.info(
    {
      label: opts.label, publishedName: opts.publishedName,
      configured: opts.configuredConcurrency, servingReplicas: servingCount, concurrency, clamped,
    },
    clamped
      ? "clamped concurrency to the serving replica count"
      : "serving condition read — running at the configured concurrency",
  );

  return new ServingGate(concurrency, servingCount, opts);
}

// ── What a mark means downstream ─────────────────────────────────────

/**
 * Comparison tooling's refusal (ADR 0006).
 *
 * A run the gate marked is an observation about the pool, never a term in a
 * pair: #67's N=3/R=2 arm is exactly why the result is kept rather than
 * discarded, and exactly why nothing may quietly compare against it. Returns
 * the reason to show, or null when the run is usable.
 */
export function pairRefusal(run: { modelLabel?: string; servingViolation: string | null }): string | null {
  if (!run.servingViolation) return null;
  const who = run.modelLabel ? `${run.modelLabel}: ` : "";
  return `${who}serving condition violated (${run.servingViolation}) — evidence about the pool, not a term in a pair`;
}
