/**
 * The serving gate (issue #72, ADR 0006).
 *
 * ADR 0005 made the serving condition readable and left it inert. This is what
 * the harness *does* about a violation, and the rules worth pinning are the
 * ones that distinguish the two ways it breaks: a co-tenant clears in seconds
 * and heals itself, a lost replica lasts hours and does not.
 */
import { describe, it, expect } from "vitest";
import {
  clampConcurrency,
  decideDispatch,
  openServingGate,
  pairRefusal,
  ServingGateError,
  ServingHaltError,
} from "../services/serving-gate.service.js";
import type { ServingSnapshot } from "../services/serving-provenance.service.js";

/** A snapshot as the gateway would report it at the moment of dispatch. */
function snapshot(servingCount: number | null, maxInflight: number | null): ServingSnapshot {
  return {
    publishedName: "qwen3.8-27b-nvfp4",
    servingCount,
    maxInflight,
    source: "gateway",
    sampledAt: new Date(),
  };
}

describe("the pre-flight clamp", () => {
  it("runs at the replica count when the operator's ceiling is higher", () => {
    // 2026-09-07: the pool fell to two replicas while the setting said three.
    expect(clampConcurrency(3, 2)).toEqual({ concurrency: 2, clamped: true });
  });

  it("leaves a ceiling below the replica count alone", () => {
    // 2026-09-08: the pool was back at three while the setting still said two.
    // N ≤ R holds; the operator's number is a ceiling, not a claim about R.
    expect(clampConcurrency(2, 3)).toEqual({ concurrency: 2, clamped: false });
  });

  it("proceeds at the configured concurrency when R is unknown", () => {
    // Anthropic has no gateway to ask. Unknown is not a licence to clamp to 1.
    expect(clampConcurrency(3, null)).toEqual({ concurrency: 3, clamped: false });
  });

  it("refuses outright when nothing is serving", () => {
    expect(() => clampConcurrency(3, 0)).toThrow(ServingGateError);
  });
});

describe("the per-dispatch decision", () => {
  it("dispatches into an idle pool", () => {
    expect(decideDispatch(snapshot(3, 0), 3)).toEqual({ action: "proceed" });
  });

  it("dispatches when every busy replica holds one request", () => {
    // N = R = 3 mid-run: our own two in flight, one slot free. This is the
    // condition, not a violation of it.
    expect(decideDispatch(snapshot(3, 1), 3)).toEqual({ action: "proceed" });
  });

  it("backs off when two requests share a replica", () => {
    // A chat session arrived on the shared pool (#61: 3.3% of items flipped).
    expect(decideDispatch(snapshot(3, 2), 3)).toEqual({ action: "backoff", reason: "contended" });
  });

  it("halts the moment a replica is gone", () => {
    // 2026-09-07, 07:10:44 UTC. A co-tenant heals; this does not.
    expect(decideDispatch(snapshot(2, 1), 3)).toEqual({ action: "halt", reason: "replica-lost" });
  });

  it("halts when nothing is serving at all", () => {
    expect(decideDispatch(snapshot(0, 0), 3)).toEqual({ action: "halt", reason: "no-replicas" });
  });

  it("prefers the lost replica over the contention it causes", () => {
    // A dropped replica puts two requests on one of the survivors, so both
    // readings fire at once. The one that does not heal decides.
    expect(decideDispatch(snapshot(2, 2), 3)).toEqual({ action: "halt", reason: "replica-lost" });
  });

  it("proceeds when the gateway could not be read", () => {
    // Unknown is recorded as unknown and does not stop a run — the same
    // refusal to treat an unread condition as a failed one that ADR 0005 took.
    expect(decideDispatch(snapshot(null, null), 3)).toEqual({ action: "proceed" });
    expect(decideDispatch(null, 3)).toEqual({ action: "proceed" });
  });

  it("proceeds when there is no baseline to have fallen from", () => {
    // The pre-flight read failed, so R alone says nothing about a drop.
    expect(decideDispatch(snapshot(2, 1), null)).toEqual({ action: "proceed" });
  });

  it("does not read a grown pool as a violation", () => {
    // A replica came back mid-run. More is not less.
    expect(decideDispatch(snapshot(4, 1), 3)).toEqual({ action: "proceed" });
  });
});

// ── The gate over a run ──────────────────────────────────────────────

/** A gate whose readings are scripted, and whose waits are microseconds. */
function gateOver(readings: Array<ServingSnapshot | null>, configuredConcurrency = 3) {
  let i = 0;
  return openServingGate({
    endpointUrl: "http://192.168.44.14:4000/v1/",
    publishedName: "qwen3.8-27b-nvfp4",
    configuredConcurrency,
    label: "test",
    read: async () => readings[Math.min(i++, readings.length - 1)],
    pollIntervalMs: 1,
    backoffBudgetMs: 5,
  });
}

describe("the gate over a run", () => {
  it("starts at the replica count it reads, not the number it was given", async () => {
    const gate = await gateOver([snapshot(2, 0)]);

    expect(gate.concurrency).toBe(2);
  });

  it("admits a dispatch under an uncontended pool without waiting", async () => {
    const gate = await gateOver([snapshot(3, 0), snapshot(3, 1)]);

    await gate.admit();
    expect(gate.backoffs).toBe(0);
    expect(gate.violation).toBeNull();
  });

  it("holds a dispatch until the co-tenant clears, and counts the hold", async () => {
    const gate = await gateOver([snapshot(3, 0), snapshot(3, 2), snapshot(3, 1)]);

    await gate.admit();

    // One dispatch held, then let through — the run continues, slower.
    expect(gate.backoffs).toBe(1);
    expect(gate.violation).toBeNull();
  });

  it("halts once contention outlasts the budget", async () => {
    const gate = await gateOver([snapshot(3, 0), snapshot(3, 2)]);

    await expect(gate.admit()).rejects.toThrow(ServingHaltError);
    expect(gate.violation).toBe("contention");
  });

  it("halts at once on a lost replica, without waiting out the budget", async () => {
    const gate = await gateOver([snapshot(3, 0), snapshot(2, 1)]);

    await expect(gate.admit()).rejects.toThrow(ServingHaltError);
    expect(gate.violation).toBe("replica-lost");
    expect(gate.backoffs).toBe(0);
  });

  it("stays halted, so the workers still in flight stop rather than race", async () => {
    const gate = await gateOver([snapshot(3, 0), snapshot(2, 1), snapshot(3, 0)]);

    await expect(gate.admit()).rejects.toThrow(ServingHaltError);
    // The pool reads healthy again on the next sample; the run does not resume
    // on its own — that is an operator's decision, once the pool is fixed.
    await expect(gate.admit()).rejects.toThrow(ServingHaltError);
    expect(gate.violation).toBe("replica-lost");
  });

  it("takes its baseline from the first reading it gets, when the pre-flight had none", async () => {
    // The gateway was down at the pre-flight and came back mid-run: without
    // adopting a baseline, a later drop would never be seen.
    const gate = await gateOver([snapshot(null, null), snapshot(3, 0), snapshot(2, 0)]);

    expect(gate.concurrency).toBe(3);
    await gate.admit();
    await expect(gate.admit()).rejects.toThrow(ServingHaltError);
    expect(gate.violation).toBe("replica-lost");
  });

  it("refuses to start when nothing is serving", async () => {
    await expect(gateOver([snapshot(0, 0)])).rejects.toThrow(ServingGateError);
  });
});

describe("what comparison tooling does with a marked run", () => {
  it("lets an unmarked run be a term in a pair", () => {
    expect(pairRefusal({ modelLabel: "qwen", servingViolation: null })).toBeNull();
  });

  it("refuses a run the gate marked, naming the run and the violation", () => {
    // #67's N=3/R=2 arm is evidence about the pool. It is not a term in a pair.
    const refusal = pairRefusal({ modelLabel: "qwen", servingViolation: "replica-lost" });

    expect(refusal).toContain("qwen");
    expect(refusal).toContain("replica-lost");
  });
});
