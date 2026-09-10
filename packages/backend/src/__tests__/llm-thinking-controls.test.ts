import { describe, it, expect } from "vitest";
import {
  resolveThinkingKwargs,
  withThinkingOff,
  type LlmModelConfig,
} from "../services/llm-config.service.js";

function cfg(overrides: Partial<LlmModelConfig>): LlmModelConfig {
  return {
    id: "m1",
    provider: "vllm-gx10",
    providerType: "openai-compatible",
    modelName: "glm-5.2",
    displayName: "glm-5.2",
    label: "vllm-gx10/glm-5.2",
    costPer1mInput: 0,
    costPer1mOutput: 0,
    maxOutputTokens: 32768,
    maxContextTokens: 131072,
    supportsThinking: true,
    thinkingEffort: "high",
    supportsVision: false,
    supportsEmbeddings: false,
    streamingEnabled: true,
    vlmEvalPreamble: null,
    endpointUrl: "http://example.invalid:8000/v1",
    apiKey: null,
    maxConcurrent: null,
    ...overrides,
  };
}

describe("resolveThinkingKwargs", () => {
  it("returns undefined when the model does not support thinking", () => {
    expect(resolveThinkingKwargs(cfg({ supportsThinking: false }))).toBeUndefined();
    expect(
      resolveThinkingKwargs(cfg({ supportsThinking: false, thinkingEffort: "off" })),
    ).toBeUndefined();
  });

  it("returns undefined when no effort is configured (server template default)", () => {
    expect(resolveThinkingKwargs(cfg({ thinkingEffort: null }))).toBeUndefined();
  });

  it("enables thinking for configured effort levels", () => {
    for (const effort of ["low", "medium", "high", "max"]) {
      expect(resolveThinkingKwargs(cfg({ thinkingEffort: effort }))).toEqual({
        enable_thinking: true,
        thinking: true,
      });
    }
  });

  it('effort "off" actively disables thinking (GLM templates think by default)', () => {
    // Regression: "off" previously fell into the truthy branch and forced
    // enable_thinking:true — the admin's "off" made the model think MORE.
    expect(resolveThinkingKwargs(cfg({ thinkingEffort: "off" }))).toEqual({
      enable_thinking: false,
      thinking: false,
    });
  });

  it("sends both template keys, because families name the switch differently", () => {
    // Measured on Nebius 2026-09-10 (issue #99): Kimi-K3 keys its chat
    // template on `thinking` and ignores `enable_thinking` outright — a judge
    // row stamped "off" went on emitting ~2k reasoning tokens per call, and
    // one call spent its whole budget reasoning and answered nothing (#100).
    // Qwen and GLM key on `enable_thinking`. A Jinja template ignores kwargs
    // it does not name, so sending both is safe and disables either family.
    const off = resolveThinkingKwargs(cfg({ thinkingEffort: "off" }))!;
    expect(off.enable_thinking).toBe(false);
    expect(off.thinking).toBe(false);
  });
});

describe("withThinkingOff", () => {
  it("forces effort off for thinking models without mutating the input", () => {
    const original = cfg({ thinkingEffort: "high" });
    const result = withThinkingOff(original);
    expect(result.thinkingEffort).toBe("off");
    expect(original.thinkingEffort).toBe("high");
    expect(resolveThinkingKwargs(result)).toEqual({ enable_thinking: false, thinking: false });
  });

  it("returns non-thinking configs unchanged", () => {
    const original = cfg({ supportsThinking: false, thinkingEffort: null });
    expect(withThinkingOff(original)).toBe(original);
  });
});
