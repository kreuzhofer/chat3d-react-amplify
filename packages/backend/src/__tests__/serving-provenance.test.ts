/**
 * The serving condition a judge call is stamped with (issue #71, ADR 0005).
 *
 * The rule these pin is one rule: an unread condition and a satisfied one must
 * never look alike. Everything here is a way for the reading to fail —
 * a provider with no gateway, a gateway that is down, a pool the gateway does
 * not list — and in each case the answer is *unknown*, not "three replicas,
 * nothing in flight".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  gatewayUrlFrom,
  readPool,
  readServingSnapshot,
  resetServingSnapshotCache,
  SNAPSHOT_TTL_MS,
} from "../services/serving-provenance.service.js";

/** The pool as the gateway actually reports it (live payload, 2026-09-08). */
function payload(members: Array<{ node: string; inflight: number; serving?: boolean }>) {
  return {
    baseUrl: "http://192.168.44.14:4000/v1",
    pools: [
      {
        publishedName: "qwen3-embedding:8b",
        servingCount: 1,
        members: [{ deploymentId: "x", node: "agenthost", runtime: "ollama", inflight: 0, serving: true }],
      },
      {
        publishedName: "qwen3.8-27b-nvfp4",
        servingCount: members.filter((m) => m.serving !== false).length,
        members: members.map((m, i) => ({
          deploymentId: `d${i}`, node: m.node, runtime: "vllm", port: 8000,
          inflight: m.inflight, serving: m.serving ?? true,
        })),
      },
    ],
  };
}

const THREE_IDLE = payload([
  { node: "dgx-spark-02", inflight: 0 },
  { node: "dgx-spark-03", inflight: 0 },
  { node: "dgx-spark-04", inflight: 0 },
]);

function mockFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body });
}

describe("gatewayUrlFrom", () => {
  it("derives the gateway from the provider's endpoint, never a constant", () => {
    // vllm-dgx-14's configured endpoint, and the gateway that fronts it.
    expect(gatewayUrlFrom("http://192.168.44.14:4000/v1/")).toBe("http://192.168.44.14:4000/api/gateway");
    expect(gatewayUrlFrom("http://192.168.44.14:4000/v1")).toBe("http://192.168.44.14:4000/api/gateway");
  });

  it("has no gateway for a provider whose endpoint is not an http URL", () => {
    // bedrock stores a region, the first-party SDKs store nothing at all.
    expect(gatewayUrlFrom("us-east-1")).toBeNull();
    expect(gatewayUrlFrom("")).toBeNull();
    expect(gatewayUrlFrom(null)).toBeNull();
    expect(gatewayUrlFrom(undefined)).toBeNull();
  });
});

describe("readPool", () => {
  it("reads the replica count and the highest per-replica inflight", () => {
    const pool = readPool(
      payload([
        { node: "dgx-spark-02", inflight: 1 },
        { node: "dgx-spark-03", inflight: 2 },
        { node: "dgx-spark-04", inflight: 1 },
      ]),
      "qwen3.8-27b-nvfp4",
    );
    // Two requests on one replica is the reading that sees a co-tenant.
    expect(pool).toEqual({ servingCount: 3, maxInflight: 2 });
  });

  it("counts only serving members, so a lost replica shows as a lost replica", () => {
    // 2026-09-07: spark-02's engine was OOM-killed and the pool went 3 → 2.
    const pool = readPool(
      payload([
        { node: "dgx-spark-02", inflight: 0, serving: false },
        { node: "dgx-spark-03", inflight: 1 },
        { node: "dgx-spark-04", inflight: 1 },
      ]),
      "qwen3.8-27b-nvfp4",
    );
    expect(pool).toEqual({ servingCount: 2, maxInflight: 1 });
  });

  it("is unknown for a pool the gateway does not list", () => {
    expect(readPool(THREE_IDLE, "some-other-model")).toBeNull();
  });

  it("is unknown for a payload that is not a gateway's", () => {
    expect(readPool(null, "qwen3.8-27b-nvfp4")).toBeNull();
    expect(readPool({ error: "not found" }, "qwen3.8-27b-nvfp4")).toBeNull();
    expect(readPool("<html>", "qwen3.8-27b-nvfp4")).toBeNull();
  });
});

describe("readServingSnapshot", () => {
  beforeEach(() => { resetServingSnapshotCache(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("records the condition read from the judge provider's gateway", async () => {
    vi.stubGlobal("fetch", mockFetch(THREE_IDLE));
    const snap = await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");

    expect(snap).toMatchObject({
      publishedName: "qwen3.8-27b-nvfp4",
      servingCount: 3,
      maxInflight: 0,
      source: "gateway",
    });
  });

  it("returns no snapshot at all for a provider with no gateway", async () => {
    const fetchMock = mockFetch(THREE_IDLE);
    vi.stubGlobal("fetch", fetchMock);

    // Anthropic: nothing to ask, so nothing is asked.
    expect(await readServingSnapshot(null, "claude-sonnet-4-6")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records unknown, not a satisfied condition, when the gateway is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const snap = await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");

    expect(snap).not.toBeNull();
    expect(snap!.servingCount).toBeNull();
    expect(snap!.maxInflight).toBeNull();
  });

  it("records unknown when the gateway answers but does not list the pool", async () => {
    vi.stubGlobal("fetch", mockFetch({ baseUrl: "http://x/v1", pools: [] }));
    const snap = await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");

    expect(snap!.servingCount).toBeNull();
  });

  it("records unknown when the gateway answers with an error status", async () => {
    vi.stubGlobal("fetch", mockFetch({ pools: [] }, false));
    const snap = await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");

    expect(snap!.servingCount).toBeNull();
  });

  it("costs one fetch for a burst of dispatches, and re-reads once the TTL is past", async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch(THREE_IDLE);
    vi.stubGlobal("fetch", fetchMock);
    const read = () => readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");

    // Three replicas dispatching at once must not be three gateway calls.
    await Promise.all([read(), read(), read()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(SNAPSHOT_TTL_MS + 1);
    await read();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one fetch across the pools in a payload", async () => {
    const fetchMock = mockFetch(THREE_IDLE);
    vi.stubGlobal("fetch", fetchMock);

    await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3.8-27b-nvfp4");
    await readServingSnapshot("http://192.168.44.14:4000/v1/", "qwen3-embedding:8b");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
