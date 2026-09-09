/**
 * The visual judge's instrument (ADR 0003): what production stamps now, how
 * much of the corpus is Stale, and the batch that re-rates it. Mounted under
 * the workbench router, so it inherits its admin guard.
 */
import { Router } from "express";
import { getInstrumentStatus, startBatchReRateStale } from "../services/workbench-instrument.service.js";

export const workbenchInstrumentRouter = Router();

workbenchInstrumentRouter.get("/instrument", async (_req, res) => {
  try {
    res.json(await getInstrumentStatus());
  } catch (error) {
    res.status(500).json({ error: "Instrument status failed", detail: String(error) });
  }
});

workbenchInstrumentRouter.post("/re-rate-stale/batch", async (req, res) => {
  try {
    const body = (req.body ?? {}) as { limit?: unknown; categoryId?: unknown; concurrency?: unknown; exampleIds?: unknown };
    const limit = body.limit === undefined ? undefined : Number(body.limit);
    if (limit !== undefined && !Number.isFinite(limit)) {
      res.status(400).json({ error: "limit must be a number" });
      return;
    }
    const concurrency = body.concurrency === undefined ? undefined : Number(body.concurrency);
    if (concurrency !== undefined && !Number.isFinite(concurrency)) {
      res.status(400).json({ error: "concurrency must be a number" });
      return;
    }
    const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : undefined;
    if (body.exampleIds !== undefined && !(Array.isArray(body.exampleIds) && body.exampleIds.every((x) => typeof x === "string"))) {
      res.status(400).json({ error: "exampleIds must be an array of ids" });
      return;
    }
    const exampleIds = body.exampleIds as string[] | undefined;
    const job = await startBatchReRateStale({ limit, categoryId, concurrency, exampleIds });
    res.status(202).json(job);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 600) {
      res.status(statusCode).json({ error: error instanceof Error ? error.message : String(error) });
      return;
    }
    res.status(500).json({ error: "Stale re-rating batch failed", detail: String(error) });
  }
});
