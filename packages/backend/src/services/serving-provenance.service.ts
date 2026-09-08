/**
 * Serving provenance (ADR 0005, issue #71).
 *
 * A Judge's answers reproduce only under **uncontended serving** — requests in
 * flight at or below the serving replica count. On 2026-09-07 a replica of the
 * pooled `qwen3.8-27b-nvfp4` was OOM-killed mid-run, the harness went on
 * submitting three concurrent requests to two replicas, and the run completed
 * looking normal while producing numbers that were not comparable to the ones
 * beside it (#67). This module is the reading that makes that visible.
 *
 * It reads the judge provider's gateway — the URL **derived** from the
 * provider's `endpoint_url`, never a constant — through a short-lived cached
 * snapshot, so a burst of dispatches costs one HTTP call rather than one each.
 * A provider that answers no such endpoint yields `unknown`: explicitly, never
 * a satisfied condition that was not checked.
 *
 * ADR 0006 (#72) gates dispatches on this same snapshot. `servingCount` and
 * per-member `inflight` come out of one payload precisely so the gate needs no
 * sampler of its own — it is a predicate over what this module records.
 */

import { createLogger } from "../utils/logger.js";

const logger = createLogger("serving-provenance");

/**
 * How long a snapshot is reused. Judge calls take 17–19 s and a dispatch slot
 * opens roughly every 6 s per replica, so this prevents a thundering herd and
 * nothing else (ADR 0006).
 */
export const SNAPSHOT_TTL_MS = 5_000;

/** The gateway is one hop away on the LAN; a slow answer is not worth waiting on. */
const FETCH_TIMEOUT_MS = 2_000;

/** How the snapshot's numbers were come by. NULL in the database = never checked. */
export type ServingSource = "gateway" | "annotated";

export interface ServingSnapshot {
  /** The pool's published name, as asked for and as the gateway reports it. */
  publishedName: string;
  /** R: replicas serving that name. `null` = the gateway did not answer, or has no such pool. */
  servingCount: number | null;
  /**
   * Highest per-replica requests in flight. `null` when `servingCount` is.
   *
   * Read **before** the call it is stamped on, so it counts the other requests
   * this one is about to join and not the call itself. On a pool serving one
   * driver at N ≤ R that is 0 or 1; a 2 means some replica already held two,
   * which is the reading ADR 0006 gates on. Rows written back by the
   * annotation script are a poller's reading instead — taken *during* the
   * calls, so they include the judge's own — which is why `source` is
   * recorded beside it and the two are never averaged together.
   */
  maxInflight: number | null;
  source: ServingSource;
  /** When the underlying payload was fetched — a snapshot may be reused up to `SNAPSHOT_TTL_MS`. */
  sampledAt: Date;
}

// ── Gateway URL derivation ───────────────────────────────────────────

/**
 * The gateway that fronts a provider, derived from its configured endpoint.
 *
 * `vllm-dgx-14`'s endpoint is `http://192.168.44.14:4000/v1/` and the gateway
 * reports `http://192.168.44.14:4000/v1` as its own `baseUrl`, so the gateway
 * lives at the endpoint's origin. Anything that is not an http(s) URL — an AWS
 * region, an empty string for a first-party SDK — has no gateway.
 */
export function gatewayUrlFrom(endpointUrl: string | null | undefined): string | null {
  if (!endpointUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(endpointUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return `${parsed.origin}/api/gateway`;
}

// ── The gateway's payload ────────────────────────────────────────────

interface GatewayMember {
  inflight?: unknown;
  serving?: unknown;
}

interface GatewayPool {
  publishedName?: unknown;
  name?: unknown;
  servingCount?: unknown;
  members?: unknown;
}

function asCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

/**
 * The pool for `publishedName`, reduced to the two numbers the condition is
 * expressed in. A pool the gateway does not list is `null` — the judge is
 * served by something this gateway does not know about, which is not a
 * condition we may call satisfied.
 */
export function readPool(
  payload: unknown,
  publishedName: string,
): { servingCount: number; maxInflight: number } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const pools = (payload as { pools?: unknown }).pools;
  if (!Array.isArray(pools)) return null;

  const pool = (pools as GatewayPool[]).find(
    (p) => (p?.publishedName ?? p?.name) === publishedName,
  );
  if (!pool) return null;

  const members: GatewayMember[] = Array.isArray(pool.members) ? (pool.members as GatewayMember[]) : [];
  const serving = members.filter((m) => m?.serving === true);

  // Prefer the gateway's own count; fall back to counting serving members, so
  // a payload that drops the field still reads rather than going unknown.
  const servingCount = asCount(pool.servingCount) ?? serving.length;

  // Only serving members can hold a request the judge cares about. Zero
  // members is a real reading of zero in flight, not a missing one.
  const maxInflight = serving.reduce((max, m) => Math.max(max, asCount(m?.inflight) ?? 0), 0);

  return { servingCount, maxInflight };
}

// ── Cached snapshot ──────────────────────────────────────────────────

interface CacheEntry {
  fetchedAt: number;
  payload: Promise<unknown | null>;
}

/** One entry per gateway URL: the payload carries every pool, so all names share a fetch. */
const cache = new Map<string, CacheEntry>();

async function fetchGateway(gatewayUrl: string): Promise<unknown | null> {
  try {
    const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      logger.debug({ gatewayUrl, status: response.status }, "gateway did not answer — serving condition unknown");
      return null;
    }
    return await response.json();
  } catch (err) {
    logger.debug({ gatewayUrl, err }, "gateway unreachable — serving condition unknown");
    return null;
  }
}

function cachedPayload(gatewayUrl: string): { payload: Promise<unknown | null>; fetchedAt: number } {
  const existing = cache.get(gatewayUrl);
  const now = Date.now();
  if (existing && now - existing.fetchedAt < SNAPSHOT_TTL_MS) return existing;

  const entry: CacheEntry = { fetchedAt: now, payload: fetchGateway(gatewayUrl) };
  cache.set(gatewayUrl, entry);
  return entry;
}

/**
 * The serving condition for `publishedName` behind `endpointUrl`, or `null`
 * when the provider has no gateway to ask.
 *
 * Never throws and never returns a satisfied-looking condition it did not
 * read: a gateway that cannot be reached, or does not list the pool, comes
 * back with `servingCount` and `maxInflight` null.
 */
export async function readServingSnapshot(
  endpointUrl: string | null | undefined,
  publishedName: string,
): Promise<ServingSnapshot | null> {
  const gatewayUrl = gatewayUrlFrom(endpointUrl);
  if (!gatewayUrl) return null;

  const { payload, fetchedAt } = cachedPayload(gatewayUrl);
  const pool = readPool(await payload, publishedName);

  return {
    publishedName,
    servingCount: pool?.servingCount ?? null,
    maxInflight: pool?.maxInflight ?? null,
    source: "gateway",
    sampledAt: new Date(fetchedAt),
  };
}

/** Drop every cached payload. Tests only — the TTL is what expires them in production. */
export function resetServingSnapshotCache(): void {
  cache.clear();
}
