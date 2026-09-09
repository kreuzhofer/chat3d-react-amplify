/**
 * Import the four sheets adjudicated before the app had a sitting (#57,
 * #63, #85, #87) as sittings of origin `import`, so the record is in one
 * place (issue #92). Idempotent: a sheet whose title already exists as an
 * imported sitting is skipped.
 *
 *   npx tsx scripts/import-adjudication-sheets.ts --adjudicator admin@chat3d.local [--dir ../prototypes]
 *
 * Reads each sheet's items JSON (both judges' answers as the screen dumped
 * them, the third opinion as it was read) and its adjudicated JSON (the
 * verdicts read back from the page's store). Item numbers in the sheets are
 * 1-based positions in the stored checklist; the row keeps the 0-based index.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/db/prisma.js";
import { tallyAdjudications } from "../src/services/adjudication-tally.js";

interface SheetItem {
  example_id: string; item: number; text: string; sonnet: string; sonnet_detail: string; qwen: string; qwen_detail: string;
  third: string | null; confidence?: string; what?: string; deciding_view?: string; resolved_by?: string;
}
interface SheetVerdict { example_id: string; item: number; daniel: string; daniel_note?: string; agreed?: boolean; updatedAt?: string | null; saved_at?: string | null }

interface Sheet {
  title: string;
  notes: string;
  items: string;
  adjudicated: string;
  instrumentId: string;
  candidate: { runId: string } | { production: true };
  candidateLabel: string;
  referenceRunId: string;
  referenceLabel: string;
  sampleExperimentId: string;
  triageAt: string;
  completedAt: string;
}

const REF_LABEL = "Claude Sonnet 4.6 (Anthropic API, thinking off)";
const SHEETS: Sheet[] = [
  {
    title: "#57 — the 69 disagreements on the 125 (first qualification)",
    notes: "Adjudicated 2026-09-06 on the artifact page *The 69 Disagreements*; verdicts read back from its store (prototypes/57-adjudication). Candidate run 62b4fa58, reference 6f6bb5c0, under production@22e0f10b0505.",
    items: "57-adjudication/third-opinion-69.json", adjudicated: "57-adjudication/adjudicated-69.json",
    instrumentId: "production@22e0f10b0505",
    candidate: { runId: "62b4fa58-67d6-48be-b942-ae99f5bd859a" }, candidateLabel: "qwen3.8-27b-nvfp4 (thinking off, 3-node pool)",
    referenceRunId: "6f6bb5c0-7e16-414f-bf39-59743ce8fd7f", referenceLabel: REF_LABEL,
    sampleExperimentId: "7a9ea679-92ee-4ad4-a156-596e1dab5720",
    triageAt: "2026-09-06T12:00:00Z", completedAt: "2026-09-06T16:00:00Z",
  },
  {
    title: "#63 — spot check of the first re-rating batch (26 disagreements)",
    notes: "Adjudicated 2026-09-07; the corpus's own ratings by the first re-rating batch as candidate against Sonnet run 4d899046 on the seed-63 sample, under production@22e0f10b0505 (prototypes/63-spot-check). This sheet revoked the first grant.",
    items: "63-spot-check/items63.json", adjudicated: "63-spot-check/adjudicated63.json",
    instrumentId: "production@22e0f10b0505",
    candidate: { production: true }, candidateLabel: "production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off)",
    referenceRunId: "4d899046-96f6-45c3-bd94-8388443dcdad", referenceLabel: REF_LABEL,
    sampleExperimentId: "09411bc4-f4be-4024-8d3b-527df01f4aae",
    triageAt: "2026-09-07T05:00:00Z", completedAt: "2026-09-07T07:00:00Z",
  },
  {
    title: "#85 — the 70 disagreements on the 125 (re-qualification under the three-view revision)",
    notes: "Adjudicated 2026-09-09 on *The Re-qualification*; verdicts read back from its store (prototypes/85-adjudication). Candidate arm A 05c9a31e, reference bc4354d4, under production@4892d8d1b160.",
    items: "85-adjudication/items85.json", adjudicated: "85-adjudication/adjudicated85.json",
    instrumentId: "production@4892d8d1b160",
    candidate: { runId: "05c9a31e-3825-4d71-8d42-89318e76a8b2" }, candidateLabel: "qwen3.8-27b-nvfp4 (thinking off, 3-node pool)",
    referenceRunId: "bc4354d4-f946-4775-bf08-5e64f726c3a1", referenceLabel: REF_LABEL,
    sampleExperimentId: "4bbbee7c-a1fc-4f63-b34b-394742362852",
    triageAt: "2026-09-08T17:00:00Z", completedAt: "2026-09-09T10:00:00Z",
  },
  {
    title: "#87 — spot check of the re-rating batch under production@4892d8d1b160 (31 disagreements)",
    notes: "Adjudicated 2026-09-09; the corpus's own ratings as candidate against Sonnet run 02c24abc on the seed-87 sample (prototypes/87-batch). This sheet confirmed the grant.",
    items: "87-batch/items87.json", adjudicated: "87-batch/adjudicated87.json",
    instrumentId: "production@4892d8d1b160",
    candidate: { production: true }, candidateLabel: "production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off)",
    referenceRunId: "02c24abc-430a-42f6-8378-8939e60afa71", referenceLabel: REF_LABEL,
    sampleExperimentId: "dadf32f4-32c1-49b9-8826-979cf3f831d6",
    triageAt: "2026-09-09T14:30:00Z", completedAt: "2026-09-09T16:00:00Z",
  },
];
const TRIAGE_MODEL = "Claude Fable 5.1 (Claude Code session, from the stored views)";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const email = arg("--adjudicator");
  if (!email) throw new Error("--adjudicator <email> is required");
  const adjudicator = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!adjudicator) throw new Error(`No user with email ${email}`);
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, arg("--dir") ?? "../prototypes");

  for (const sheet of SHEETS) {
    const existing = await prisma.adjudicationSitting.findFirst({ where: { origin: "import", title: sheet.title }, select: { id: true } });
    if (existing) { console.log(`skip (exists as ${existing.id}): ${sheet.title}`); continue; }
    const itemsPath = resolve(dir, sheet.items), adjPath = resolve(dir, sheet.adjudicated);
    if (!existsSync(itemsPath) || !existsSync(adjPath)) throw new Error(`Missing ${itemsPath} or ${adjPath}`);
    const items = JSON.parse(readFileSync(itemsPath, "utf8")) as SheetItem[];
    const verdicts = new Map((JSON.parse(readFileSync(adjPath, "utf8")) as SheetVerdict[]).map((v) => [`${v.example_id}-${v.item}`, v]));
    const exampleIds = [...new Set(items.map((i) => i.example_id))];
    const found = await prisma.workbenchExample.findMany({ where: { id: { in: exampleIds } }, select: { id: true } });
    if (found.length !== exampleIds.length) {
      const missing = exampleIds.filter((id) => !found.some((f) => f.id === id));
      throw new Error(`${sheet.title}: ${missing.length} examples no longer exist (${missing.join(", ")})`);
    }
    const rows = items.map((it) => {
      const v = verdicts.get(`${it.example_id}-${it.item}`);
      if (!v) throw new Error(`${sheet.title}: no verdict for ${it.example_id} item ${it.item}`);
      const decidedAt = v.updatedAt ?? v.saved_at ?? sheet.completedAt;
      return {
        exampleId: it.example_id, itemIndex: it.item - 1, question: it.text,
        refState: it.sonnet, refDetail: it.sonnet_detail, candState: it.qwen, candDetail: it.qwen_detail,
        decision: v.daniel, note: v.daniel_note ?? "", agreedWithTriage: v.agreed === true && v.daniel === it.third,
        decidedById: adjudicator.id, decidedAt: new Date(decidedAt),
        triageVerdict: it.third && it.third !== "?" ? it.third : null, triageConfidence: it.confidence ?? null, triageWhat: it.what ?? null,
        triageView: it.deciding_view?.slice(0, 120) ?? null, triageResolvedBy: it.resolved_by ?? null,
        triageModel: it.third && it.third !== "?" ? TRIAGE_MODEL : null, triageAt: it.third && it.third !== "?" ? new Date(sheet.triageAt) : null,
      };
    });
    const sitting = await prisma.adjudicationSitting.create({
      data: {
        title: sheet.title, notes: sheet.notes, instrumentId: sheet.instrumentId,
        candidateSource: "runId" in sheet.candidate ? "run" : "production",
        candidateRunId: "runId" in sheet.candidate ? sheet.candidate.runId : null, candidateLabel: sheet.candidateLabel,
        referenceRunId: sheet.referenceRunId, referenceLabel: sheet.referenceLabel,
        sampleExperimentId: sheet.sampleExperimentId, adjudicatorId: adjudicator.id, origin: "import",
        itemCount: rows.length, exampleCount: exampleIds.length,
        createdAt: new Date(sheet.triageAt), completedAt: new Date(sheet.completedAt),
        items: { create: rows },
      },
      select: { id: true },
    });
    const t = tallyAdjudications(rows);
    console.log(`imported ${sitting.id}: ${sheet.title} — ${rows.length} items, hard ${t.hard}, ` +
      `false passes cand ${t.candFalsePass} vs ref ${t.refFalsePass}, false fails cand ${t.candFalseFail} vs ref ${t.refFalseFail} (allowance ${t.falseFailAllowance}), N ${t.n}`);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
