/**
 * One VLM experiment evaluation: the example's views and model loaded, the
 * judge run over them, production's zoom follow-up applied.
 *
 * Split from the run orchestration (issue #72) because they are two
 * responsibilities: the executor decides what runs, under what concurrency and
 * under what serving condition; this decides what one evaluation is made of,
 * and it is the half the experiment/production parity tests speak to.
 */

import { prisma } from "../db/prisma.js";
import { createLogger } from "../utils/logger.js";
import { evaluateModelWithConfig, type LabeledImage, type EvaluationResult, type EvaluateModelInput } from "./visual-eval.service.js";
import { runZoomFollowUp } from "./visual-eval-zoom.service.js";
import { isUncertain } from "./visual-eval-parser.service.js";
import { readStorageFile, storageFileExists } from "./file-storage.service.js";
import { deriveVisualChecklist } from "../utils/verification-criteria.js";
import type { LlmModelConfig } from "./llm-config.service.js";
import type { JudgeInstrument } from "./visual-eval-instrument-id.service.js";

const logger = createLogger("vlm-experiment-eval");

// ── Screenshot angle mapping ────────────────────────────────────────

const SCREENSHOT_FIELDS: Array<{ angle: string; field: string }> = [
  { angle: "front", field: "screenshotFront" },
  { angle: "back", field: "screenshotBack" },
  { angle: "left", field: "screenshotLeft" },
  { angle: "right", field: "screenshotRight" },
  { angle: "top", field: "screenshotTop" },
  { angle: "bottom", field: "screenshotBottom" },
  { angle: "ortho_45", field: "screenshotOrtho45" },
  { angle: "ortho_45_bottom", field: "screenshotOrtho45Bottom" },
];

export async function evaluateExample(
  exampleId: string,
  modelConfig: LlmModelConfig,
  instrument: JudgeInstrument | undefined,
) {
  const example = await prisma.workbenchExample.findUnique({
    where: { id: exampleId },
    include: {
      promptRef: {
        select: {
          prompt: true,
          constructionSpec: true,
          verificationChecklist: true,
          verificationCriteria: true,
          category: { select: { name: true, complexity: true } },
        },
      },
    },
  });
  if (!example) throw new Error(`Example ${exampleId} not found`);

  // Load screenshots as base64
  const images: LabeledImage[] = [];
  const exRecord = example as Record<string, unknown>;
  for (const { angle, field } of SCREENSHOT_FIELDS) {
    const path = exRecord[field] as string | null;
    if (!path) continue;
    // Handle both file paths and inline base64
    if (path.startsWith("data:") || path.length > 500) {
      // Inline base64 — strip data URI prefix if present
      const b64 = path.replace(/^data:image\/\w+;base64,/, "");
      images.push({ angle, base64: b64 });
    } else if (await storageFileExists(path)) {
      const buf = await readStorageFile({ relativePath: path });
      images.push({ angle, base64: buf.toString("base64") });
    }
  }

  if (images.length === 0) throw new Error(`No screenshots available for example ${exampleId}`);

  const stlBase64 = await loadStlBase64(example.stlPath);
  const input = {
    ...buildExperimentEvalInput(example, images, stlBase64),
    ...(instrument ? { instrument } : {}),
  };
  const firstPass = await evaluateModelWithConfig(input, modelConfig);
  return applyZoomFollowUp(firstPass, input, modelConfig);
}

/** The example's STL, for the zoom follow-up's high-res render. Undefined when the file is gone. */
async function loadStlBase64(stlPath: string | null): Promise<string | undefined> {
  if (!stlPath || !(await storageFileExists(stlPath))) return undefined;
  return (await readStorageFile({ relativePath: stlPath })).toString("base64");
}

/**
 * Production's zoom follow-up on the experiment's first pass (issue #54).
 *
 * Mirrors eval-orchestrator: the follow-up runs only when the judge left
 * items uncertain and the STL is available, behind the same `global.zoom_*`
 * settings, and its tokens are added to the evaluation's. The one deliberate
 * difference is the judge — the follow-up must be answered by the run's model,
 * not the production `vlm_eval` model, or the experiment scores a hybrid.
 * A failed follow-up keeps the uncertain items, as production does.
 */
export async function applyZoomFollowUp(
  result: EvaluationResult,
  input: EvaluateModelInput,
  vlmConfig: LlmModelConfig,
): Promise<EvaluationResult> {
  const checklist = result.checklistResults;
  if (!checklist || !checklist.some((c) => isUncertain(c))) return result;

  if (!input.stlBase64) {
    logger.warn(
      { uncertainCount: checklist.filter((c) => isUncertain(c)).length },
      "no STL for this example — zoom follow-up skipped, uncertain items kept",
    );
    return result;
  }

  try {
    const zoom = await runZoomFollowUp({
      checklist,
      stlBase64: input.stlBase64,
      modelFormat: input.modelFormat ?? "stl",
      constructionSpec: input.constructionSpec,
      vlmConfig,
    });
    if (!zoom) return result;

    logger.info({ followUpCount: zoom.followUpCount, model: vlmConfig.label }, "zoom follow-ups completed");
    return {
      ...result,
      checklistResults: zoom.resolvedChecklist,
      promptTokens: result.promptTokens + zoom.promptTokens,
      completionTokens: result.completionTokens + zoom.completionTokens,
    };
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), model: vlmConfig.label },
      "zoom follow-up failed, keeping uncertain results",
    );
    return result;
  }
}

/**
 * The judge input for one experiment evaluation.
 *
 * Kept identical to what eval-orchestrator builds for a production run: the
 * checklist goes through `deriveVisualChecklist`, which owns the visibility and
 * dimension filters and tolerates the legacy bare-string criteria shape that
 * most of the stored corpus holds (issue #33). Passing anything else here means
 * the experiment scores a judge on a prompt production never sends, which is
 * the whole point of the comparison.
 *
 * `stlBase64` is the example's model for the zoom follow-up's high-res render;
 * without it the follow-up is skipped, exactly as production skips it.
 */
export function buildExperimentEvalInput(
  example: {
    promptRef: {
      prompt: string;
      constructionSpec?: string | null;
      verificationChecklist?: unknown;
      verificationCriteria?: unknown;
      /** Ignored: the judge no longer sees the eval plan (ADR 0003). */
      evalPlan?: unknown;
      category: { name: string; complexity: number };
    };
  },
  images: LabeledImage[],
  stlBase64?: string,
): EvaluateModelInput {
  const { promptRef } = example;
  return {
    userPrompt: promptRef.prompt,
    categoryName: promptRef.category.name,
    complexity: promptRef.category.complexity,
    images,
    ...(stlBase64 ? { stlBase64, modelFormat: "stl" as const } : {}),
    constructionSpec: promptRef.constructionSpec ?? undefined,
    verificationChecklist: deriveVisualChecklist(
      promptRef.verificationCriteria,
      (promptRef.verificationChecklist as string[] | null) ?? undefined,
    ),
  };
}
