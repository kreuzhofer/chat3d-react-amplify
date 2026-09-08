/**
 * Which calls carry a serving condition, and how it reaches the row
 * (issue #71, ADR 0005).
 *
 * The stamp is scoped to judge calls and to providers that have a gateway, so
 * the two things worth pinning are the boundary (a codegen call asks nothing)
 * and the plumbing (N is set once by the driver, several context frames above
 * the call that records it).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface RecordedEvent {
  purpose: string;
  serving?: { publishedName: string; servingCount: number | null; maxInflight: number | null; source: string } | null;
  driverConcurrency?: number;
}

const recorded: RecordedEvent[] = [];
const generateTextMock = vi.fn();

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: (opts: unknown) => generateTextMock(opts),
}));

// The real AsyncLocalStorage, a fake writer: what reaches `recordUsageEvent`
// is exactly what the row would have been written from, and the context is
// read the same way the writer reads it.
vi.mock("../services/usage-tracking.service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/usage-tracking.service.js")>();
  return {
    ...actual,
    recordUsageEvent: (params: { purpose: string; serving?: RecordedEvent["serving"] }) => {
      recorded.push({
        purpose: params.purpose,
        serving: params.serving ?? null,
        driverConcurrency: actual.getUsageContext().driverConcurrency,
      });
    },
  };
});

const { runWithUsageContext } = await import("../services/usage-tracking.service.js");
const { trackedGenerateText } = await import("../services/tracked-llm.service.js");
const { resetServingSnapshotCache } = await import("../services/serving-provenance.service.js");

const POOL = {
  baseUrl: "http://192.168.44.14:4000/v1",
  pools: [{
    publishedName: "qwen3.8-27b-nvfp4",
    servingCount: 3,
    members: [
      { node: "dgx-spark-02", inflight: 1, serving: true },
      { node: "dgx-spark-03", inflight: 0, serving: true },
      { node: "dgx-spark-04", inflight: 0, serving: true },
    ],
  }],
};

/** The pooled judge, exactly as `vlm_eval` points at it. */
const judge = {
  purpose: "vlm_evaluation" as const,
  providerName: "vllm-dgx-14",
  modelName: "qwen3.8-27b-nvfp4",
  modelConfig: { costPer1mInput: 0.035, costPer1mOutput: 0.89 },
  endpointUrl: "http://192.168.44.14:4000/v1/",
};

async function call(tracking: Record<string, unknown>): Promise<RecordedEvent> {
  generateTextMock.mockResolvedValueOnce({ usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await trackedGenerateText({ model: {} as any, prompt: "hi" }, tracking as any);
  expect(recorded).toHaveLength(1);
  return recorded[0];
}

describe("the serving stamp's boundary", () => {
  beforeEach(() => {
    recorded.length = 0;
    generateTextMock.mockReset();
    resetServingSnapshotCache();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => POOL }));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("stamps a judge call with the condition its gateway reports", async () => {
    const event = await call(judge);

    expect(event.serving).toMatchObject({
      publishedName: "qwen3.8-27b-nvfp4",
      servingCount: 3,
      maxInflight: 1,
      source: "gateway",
    });
  });

  it("asks nothing for a call that is not the judge's", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const event = await call({ ...judge, purpose: "codegen" });

    // Codegen shares the pool and the served name; it is still not a judge call.
    expect(event.serving).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks nothing for a judge whose provider has no gateway", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const event = await call({ ...judge, providerName: "anthropic", modelName: "claude-sonnet-4-6", endpointUrl: null });

    expect(event.serving).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the driver's own concurrency", () => {
  beforeEach(() => {
    recorded.length = 0;
    generateTextMock.mockReset();
    resetServingSnapshotCache();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => POOL }));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("survives the inner context frames between the driver and the call", async () => {
    // The batch runner sets N once around the whole pool; each row then opens
    // its own context on the way to the judge. A replacing store would drop N.
    const event = await runWithUsageContext({ driverConcurrency: 3 }, () =>
      runWithUsageContext({ workbenchExampleId: "abc", source: "workbench" }, () => call(judge)),
    );

    expect(event.driverConcurrency).toBe(3);
  });

  it("is unset where nothing schedules the call", async () => {
    // Production `vlm_eval` and chat's own visual evaluation: no driver, so no N.
    const event = await runWithUsageContext({ source: "chat" }, () => call(judge));

    expect(event.driverConcurrency).toBeUndefined();
  });
});
