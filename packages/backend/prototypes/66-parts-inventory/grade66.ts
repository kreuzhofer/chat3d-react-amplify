/**
 * PROTOTYPE — wayfinder #66. Grades the parts-inventory variant against the
 * adjudicated items, whose truth is already known.
 *
 *   npx tsx prototypes/66-parts-inventory/grade66.ts <variant experiment id>
 *
 * The 69 disagreements of #57 and the 26 of #63 were adjudicated by Daniel:
 * on each, his verdict says WHICH judge was right, so the correct answer to
 * that item is known — 84 items with a truth, no new adjudication needed.
 * Re-answering them under the variant therefore grades directly.
 *
 * Three readouts, in the order they decide anything:
 *
 *   BENEFIT  the 84 truth-graded items: per judge, wrong→right (fixed),
 *            right→wrong (broken), and ADR 0004's two terms recomputed on
 *            each sheet.
 *   COST     every item on the 57 examples: how much moved at all, against
 *            each judge's own floor. Movement outside the 84 has no truth
 *            attached and is reported as unadjudicated, never as a gain.
 *   INVENTORY what the judge actually wrote first: the body count, and the
 *            times its own checklist answer contradicts it.
 *
 * The 84 is a screen on the variant's DESIGN, not a qualification: these are
 * old disagreements re-answered, and a fresh instrument makes fresh ones
 * elsewhere. Qualification is the 125 under the new id (ADR 0004).
 */
import { readFileSync } from "node:fs";
import { prisma } from "../../src/db/prisma.js";

type Answer = "pass" | "fail" | "uncertain" | "missing";

interface Sheet {
  name: string;
  exampleId: string;
  item: number;
  question: string;
  /** What each judge answered under production's instrument. */
  before: { candidate: Answer; reference: Answer };
  /** Daniel's verdict: R = the reference was right, C = the candidate was, N = neither. */
  verdict: "R" | "C" | "N";
}

const HERE = new URL(".", import.meta.url).pathname;
const P57 = `${HERE}../57-adjudication`;
const P63 = `${HERE}../63-spot-check`;

const answer = (v: unknown): Answer =>
  v === "pass" || v === "fail" || v === "uncertain" ? v : "missing";

function loadSheets(): Sheet[] {
  const a69 = JSON.parse(readFileSync(`${P57}/adjudicated-69.json`, "utf8")) as any[];
  const i26 = JSON.parse(readFileSync(`${P63}/items63.json`, "utf8")) as any[];
  const a26 = new Map(
    (JSON.parse(readFileSync(`${P63}/adjudicated63.json`, "utf8")) as any[]).map((r) => [`${r.example_id}#${r.item}`, r.daniel]),
  );
  return [
    ...a69.map((r) => ({
      name: "the 69 (#57)", exampleId: r.example_id, item: r.item, question: r.text,
      before: { candidate: answer(r.qwen), reference: answer(r.sonnet) }, verdict: r.daniel,
    })),
    ...i26.map((r) => ({
      name: "the 26 (#63)", exampleId: r.example_id, item: r.item, question: r.text,
      before: { candidate: answer(r.qwen), reference: answer(r.sonnet) },
      verdict: a26.get(`${r.example_id}#${r.item}`),
    })),
  ] as Sheet[];
}

/** The answer a verdict makes correct: the right judge's own answer. */
function truth(s: Sheet): Answer | null {
  if (s.verdict === "R") return s.before.reference;
  if (s.verdict === "C") return s.before.candidate;
  return null;
}

interface Arm { label: string; kind: "candidate" | "reference"; items: Map<string, Answer>; inventories: Map<string, any> }

/**
 * The inventory out of a stored reply. On vLLM the whole reply is the object;
 * on the Anthropic path it is free text that may carry a fence or a sentence
 * before the JSON, so the outermost braces are taken.
 */
function readInventory(raw: string | null): any | null {
  if (!raw) return null;
  const body = raw.replace(/^[\s\S]*?```(?:json)?/, "").replace(/```[\s\S]*$/, "");
  for (const text of [raw, body]) {
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start < 0 || end <= start) continue;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed?.inventory) return parsed.inventory;
    } catch { /* try the next shape */ }
  }
  return null;
}

/**
 * The corpus's own ratings as a control arm (#63): for the spot check's 17
 * examples the candidate's "before" is not an experiment run but what the
 * re-rating batch wrote to `workbench_examples`.
 */
async function loadProductionArm(exampleIds: string[], kind: Arm["kind"]): Promise<Arm> {
  const rows = await prisma.workbenchExample.findMany({
    where: { id: { in: exampleIds } },
    select: { id: true, evalChecklistResults: true, vlmModel: true, vlmInstrumentId: true },
  });
  const items = new Map<string, Answer>();
  for (const r of rows) {
    const list = Array.isArray(r.evalChecklistResults) ? (r.evalChecklistResults as any[]) : [];
    list.forEach((it, i) => {
      items.set(`${r.id}#${i + 1}`, it?.pass === true ? "pass" : it?.pass === false ? "fail" : "uncertain");
    });
  }
  const judges = [...new Set(rows.map((r) => `${r.vlmModel} @ ${r.vlmInstrumentId}`))];
  return { label: `corpus rows (${judges.join(" | ")})`, kind, items, inventories: new Map() };
}

async function loadArm(runId: string, kind: Arm["kind"]): Promise<Arm> {
  const run = await prisma.experimentRun.findUnique({ where: { id: runId }, select: { modelLabel: true, status: true } });
  if (!run) throw new Error(`run ${runId} not found`);
  const rows = await prisma.vlmExperimentResult.findMany({
    where: { runId }, select: { exampleId: true, checklistResults: true, rawResponse: true, error: true },
  });
  const items = new Map<string, Answer>();
  const inventories = new Map<string, any>();
  for (const r of rows) {
    const list = Array.isArray(r.checklistResults) ? (r.checklistResults as any[]) : [];
    list.forEach((it, i) => {
      items.set(`${r.exampleId}#${i + 1}`, it?.pass === true ? "pass" : it?.pass === false ? "fail" : "uncertain");
    });
    const inv = readInventory(r.rawResponse);
    if (inv) inventories.set(r.exampleId, inv);
  }
  return { label: `${run.modelLabel} (${run.status})`, kind, items, inventories };
}

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}%`);

async function main() {
  const experimentId = process.argv[2];
  if (!experimentId) throw new Error("give the variant experiment id");
  const runs = await prisma.experimentRun.findMany({
    where: { experimentId }, orderBy: { runOrder: "asc" },
    select: { id: true, modelLabel: true, judgePromptVariantId: true },
  });
  const arms: Arm[] = [];
  for (const r of runs) {
    arms.push(await loadArm(r.id, /sonnet/i.test(r.modelLabel) ? "reference" : "candidate"));
  }

  const sheets = loadSheets();
  const graded = sheets.filter((s) => truth(s) !== null);
  console.log(`\n# parts-inventory-v1 on the adjudicated items`);
  console.log(`experiment ${experimentId} — ${runs.length} runs, variant ${runs[0]?.judgePromptVariantId}`);
  console.log(`\n${sheets.length} adjudicated items, ${graded.length} with a truth (N excluded: ${sheets.length - graded.length})`);

  // ── BENEFIT ────────────────────────────────────────────────────────
  for (const arm of arms) {
    console.log(`\n## ${arm.kind}: ${arm.label}`);
    for (const sheetName of ["the 69 (#57)", "the 26 (#63)"]) {
      const rows = graded.filter((s) => s.name === sheetName);
      let fixed = 0, broken = 0, held = 0, stillWrong = 0, unanswered = 0;
      const changes: string[] = [];
      for (const s of rows) {
        const t = truth(s)!;
        const was = s.before[arm.kind];
        const now = arm.items.get(`${s.exampleId}#${s.item}`) ?? "missing";
        if (now === "missing") { unanswered++; continue; }
        const wasRight = was === t, nowRight = now === t;
        if (!wasRight && nowRight) { fixed++; changes.push(`  FIXED   ${s.exampleId.slice(0, 8)} i${s.item} ${was}→${now} (truth ${t}) ${s.question.slice(0, 70)}`); }
        else if (wasRight && !nowRight) { broken++; changes.push(`  BROKEN  ${s.exampleId.slice(0, 8)} i${s.item} ${was}→${now} (truth ${t}) ${s.question.slice(0, 70)}`); }
        else if (wasRight) held++;
        else stillWrong++;
      }
      console.log(`\n### ${sheetName} — ${rows.length} graded`);
      console.log(`  fixed ${fixed} · broken ${broken} · held ${held} · still wrong ${stillWrong}${unanswered ? ` · unanswered ${unanswered}` : ""}`);
      changes.forEach((c) => console.log(c));
    }
  }

  // ADR 0004's two terms, recomputed from the same items under the variant.
  console.log(`\n## ADR 0004 terms, recomputed on the re-answered items`);
  const cand = arms.find((a) => a.kind === "candidate")!;
  const ref = arms.find((a) => a.kind === "reference")!;
  for (const sheetName of ["the 69 (#57)", "the 26 (#63)"]) {
    const rows = graded.filter((s) => s.name === sheetName);
    const count = (arm: Arm, want: Answer) =>
      rows.filter((s) => {
        const now = arm.items.get(`${s.exampleId}#${s.item}`);
        return now === want && now !== truth(s);
      }).length;
    const cfp = count(cand, "pass"), cff = count(cand, "fail");
    const rfp = count(ref, "pass"), rff = count(ref, "fail");
    console.log(`\n### ${sheetName}`);
    console.log(`  confirmed false passes  candidate ${cfp} vs reference ${rfp} — ${cfp <= rfp ? "holds" : "FAILS"}`);
    console.log(`  confirmed false fails   candidate ${cff} vs allowance ${2 * rff} (reference ${rff}) — ${cff <= 2 * rff ? "holds" : "FAILS"}`);
  }

  // ── COST ───────────────────────────────────────────────────────────
  console.log(`\n## Cost: every item on the 57 examples, variant vs the stored control`);
  const controls: Record<string, string> = {
    candidate: process.env.CONTROL_CANDIDATE ?? "",
    reference: process.env.CONTROL_REFERENCE ?? "",
  };
  const adjudicatedKeys = new Set(sheets.map((s) => `${s.exampleId}#${s.item}`));
  for (const arm of arms) {
    const runId = controls[arm.kind];
    if (!runId) { console.log(`\n### ${arm.kind}: no control run given (CONTROL_${arm.kind.toUpperCase()})`); continue; }
    const control = await loadArm(runId, arm.kind);
    // The spot check's 17 have no control run: the candidate's before is the
    // corpus row the re-rating batch wrote, the reference's is its own run.
    for (const [k, v] of (await loadProductionArm(sheets.filter((s) => s.name === "the 26 (#63)").map((s) => s.exampleId), arm.kind)).items) {
      if (arm.kind === "candidate" && !control.items.has(k)) control.items.set(k, v);
    }
    if (arm.kind === "reference" && process.env.CONTROL_REFERENCE_63) {
      for (const [k, v] of (await loadArm(process.env.CONTROL_REFERENCE_63, arm.kind)).items) {
        if (!control.items.has(k)) control.items.set(k, v);
      }
    }
    let same = 0, hard = 0, soft = 0, onlyOne = 0, hardUnadjudicated = 0;
    for (const [key, before] of control.items) {
      const now = arm.items.get(key);
      if (now === undefined) { onlyOne++; continue; }
      if (now === before) { same++; continue; }
      if ((before === "pass" && now === "fail") || (before === "fail" && now === "pass")) {
        hard++;
        if (!adjudicatedKeys.has(key)) hardUnadjudicated++;
      } else soft++;
    }
    const paired = same + hard + soft;
    console.log(`\n### ${arm.kind}: ${arm.label} vs control ${control.label}`);
    console.log(`  paired items ${paired} (control-only ${onlyOne})`);
    console.log(`  identical ${same} (${pct(same, paired)}) · hard pass↔fail flips ${hard} (${pct(hard, paired)}) · uncertain moves ${soft}`);
    console.log(`  of the hard flips, ${hardUnadjudicated} are on items no one has adjudicated`);
  }

  // ── INVENTORY ──────────────────────────────────────────────────────
  console.log(`\n## The inventory itself`);
  for (const arm of arms) {
    const inv = [...arm.inventories.values()];
    const counts = inv.map((i) => i.bodyCount).filter((n) => typeof n === "number");
    const hist = counts.reduce<Record<number, number>>((h, n) => ((h[n] = (h[n] ?? 0) + 1), h), {});
    const absent = inv.filter((i) => /\bABSENT\b/i.test(String(i.partsNamed ?? ""))).length;
    const openWords = inv.filter((i) => /hollow|open/i.test(String(i.openings ?? ""))).length;
    console.log(`\n### ${arm.kind}: ${arm.label}`);
    console.log(`  inventories written ${inv.length} of ${arm.inventories.size || 0} rows read`);
    console.log(`  bodyCount histogram ${JSON.stringify(hist)}`);
    console.log(`  examples naming a part ABSENT: ${absent} · calling a body hollow/open: ${openWords}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
