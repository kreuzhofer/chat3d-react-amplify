/**
 * PROTOTYPE — wayfinder #67. What the three-view follow-up did, in the order
 * the readouts decide anything (the design is in this directory's README,
 * written before the run).
 *
 *   CONTROL_CANDIDATE=<run> CONTROL_REFERENCE=<run> CONTROL_REFERENCE_63=<run> \
 *   npx tsx prototypes/67-zoom-views/grade67.ts <experiment id>
 *
 * The revision touches only items that reach a zoom follow-up, so the first
 * readout is confinement: everything else must not move. Only then are the
 * zoomed items worth reading — and there are few of them, which is why the
 * ticket asked for the design up front.
 */
import { readFileSync } from "node:fs";
import { prisma } from "../../src/db/prisma.js";

type Answer = "pass" | "fail" | "uncertain";
interface Item { answer: Answer; detail: string; zoomed: boolean; zoomViews: string[] | null }

const ans = (p: unknown): Answer => (p === true ? "pass" : p === false ? "fail" : "uncertain");

/** A stored item was zoomed if it carries the views, or the marker the merge writes. */
function readItem(it: any): Item {
  const detail = String(it?.detail ?? "");
  const zoomViews = Array.isArray(it?.zoomViews) ? (it.zoomViews as string[]) : null;
  return {
    answer: ans(it?.pass),
    detail,
    zoomed: zoomViews !== null || detail.startsWith("[2x zoom]") || typeof it?.zoomFollowUp === "string",
    zoomViews,
  };
}

async function runItems(runId: string): Promise<Map<string, Item>> {
  const rows = await prisma.vlmExperimentResult.findMany({
    where: { runId }, select: { exampleId: true, checklistResults: true },
  });
  const m = new Map<string, Item>();
  for (const r of rows) {
    const list = Array.isArray(r.checklistResults) ? (r.checklistResults as any[]) : [];
    list.forEach((it, i) => m.set(`${r.exampleId}#${i + 1}`, readItem(it)));
  }
  return m;
}

async function corpusItems(ids: string[]): Promise<Map<string, Item>> {
  const rows = await prisma.workbenchExample.findMany({
    where: { id: { in: ids } }, select: { id: true, evalChecklistResults: true },
  });
  const m = new Map<string, Item>();
  for (const r of rows) {
    const list = Array.isArray(r.evalChecklistResults) ? (r.evalChecklistResults as any[]) : [];
    list.forEach((it, i) => m.set(`${r.id}#${i + 1}`, readItem(it)));
  }
  return m;
}

// ── The adjudicated labels: truth, and the deciding view ─────────────

const HERE = new URL(".", import.meta.url).pathname;
const NORM: Record<string, string> = {
  "45° down": "ortho_45", ortho_45: "ortho_45", "45° up": "ortho_45_bottom",
  ortho_45_bottom: "ortho_45_bottom", top: "top", bottom: "bottom",
  front: "front", back: "back", left: "left", right: "right",
};

interface Label { truth: Answer | null; deciding: Set<string>; question: string }

function loadLabels(): Map<string, Label> {
  const a69 = JSON.parse(readFileSync(`${HERE}../57-adjudication/adjudicated-69.json`, "utf8")) as any[];
  const i26 = JSON.parse(readFileSync(`${HERE}../63-spot-check/items63.json`, "utf8")) as any[];
  const a26 = new Map(
    (JSON.parse(readFileSync(`${HERE}../63-spot-check/adjudicated63.json`, "utf8")) as any[])
      .map((r) => [`${r.example_id}#${r.item}`, r.daniel]),
  );
  const out = new Map<string, Label>();
  const add = (r: any, verdict: string | undefined) => {
    const deciding = new Set<string>();
    for (const part of String(r.deciding_view ?? "").split(/,| and | \+ /)) {
      const v = NORM[part.trim().toLowerCase()];
      if (v) deciding.add(v);
    }
    // Daniel's verdict fixes the correct answer: the right judge's own answer.
    const truth: Answer | null =
      verdict === "R" ? ans(r.sonnet === "pass" ? true : r.sonnet === "fail" ? false : null)
      : verdict === "C" ? ans(r.qwen === "pass" ? true : r.qwen === "fail" ? false : null)
      : null;
    out.set(`${r.example_id}#${r.item}`, { truth, deciding, question: r.text });
  };
  for (const r of a69) add(r, r.daniel);
  for (const r of i26) add(r, a26.get(`${r.example_id}#${r.item}`));
  return out;
}

/** The view a follow-up's detail names, if any — the label this run creates. */
function namedView(detail: string): string | null {
  const d = detail.toLowerCase();
  if (/45°?\s*up|ortho_45_bottom/.test(d)) return "ortho_45_bottom";
  if (/45°?\s*down|ortho_45/.test(d)) return "ortho_45";
  for (const v of ["top", "bottom", "front", "back", "left", "right"]) {
    if (new RegExp(`\\b${v} view\\b`).test(d)) return v;
  }
  return null;
}

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}%`);

async function main() {
  const experimentId = process.argv[2];
  if (!experimentId) throw new Error("give the revised experiment id");
  const labels = loadLabels();
  // The spot check's 17 examples, from the sheet itself.
  const ex63 = [...new Set((JSON.parse(readFileSync(`${HERE}../63-spot-check/items63.json`, "utf8")) as any[]).map((r) => r.example_id as string))];
  const runs = await prisma.experimentRun.findMany({
    where: { experimentId }, orderBy: { runOrder: "asc" }, select: { id: true, modelLabel: true },
  });

  for (const run of runs) {
    const isRef = /sonnet/i.test(run.modelLabel);
    const after = await runItems(run.id);
    const before = new Map<string, Item>();
    for (const [k, v] of await runItems(isRef ? process.env.CONTROL_REFERENCE! : process.env.CONTROL_CANDIDATE!)) before.set(k, v);
    const second = isRef ? await runItems(process.env.CONTROL_REFERENCE_63!) : await corpusItems(ex63);
    for (const [k, v] of second) if (!before.has(k)) before.set(k, v);

    const keys = [...after.keys()].filter((k) => before.has(k));
    const zoomedNow = keys.filter((k) => after.get(k)!.zoomed);
    const zoomedBefore = keys.filter((k) => before.get(k)!.zoomed);
    const untouched = keys.filter((k) => !after.get(k)!.zoomed && !before.get(k)!.zoomed);

    console.log(`\n\n═══ ${isRef ? "REFERENCE" : "CANDIDATE"}: ${run.modelLabel}`);
    console.log(`paired items ${keys.length} · zoomed before ${zoomedBefore.length} · zoomed after ${zoomedNow.length}`);

    // 1. Confinement — the first pass is untouched by this revision.
    const moved = untouched.filter((k) => after.get(k)!.answer !== before.get(k)!.answer);
    console.log(`\n1. CONFINEMENT — items that went to no follow-up either way: ${untouched.length}`);
    console.log(`   moved: ${moved.length} (${pct(moved.length, untouched.length)})${isRef ? " — the reference's own floor is 1.6–2.9%" : " — qwen is deterministic as sole tenant; anything but 0 means the revision leaked"}`);
    for (const k of moved.slice(0, 8)) console.log(`     ${k} ${before.get(k)!.answer}→${after.get(k)!.answer}`);

    // 2. Coverage — is a deciding view among those sent?
    const withLabel = zoomedNow.filter((k) => (labels.get(k)?.deciding.size ?? 0) > 0);
    const covered = withLabel.filter((k) => {
      const sent = after.get(k)!.zoomViews ?? [];
      return sent.some((v) => labels.get(k)!.deciding.has(v));
    });
    console.log(`\n2. COVERAGE — zoomed items carrying a deciding-view label: ${withLabel.length}`);
    console.log(`   a deciding view was sent: ${covered.length} (${pct(covered.length, withLabel.length)})`);

    // 3. Correctness on the truth-graded zoomed items.
    const graded = zoomedNow.filter((k) => labels.get(k)?.truth != null);
    let fixed = 0, broken = 0, held = 0, stillWrong = 0;
    for (const k of graded) {
      const t = labels.get(k)!.truth!;
      const wasRight = before.get(k)!.answer === t, nowRight = after.get(k)!.answer === t;
      if (!wasRight && nowRight) { fixed++; console.log(`     FIXED  ${k} ${before.get(k)!.answer}→${after.get(k)!.answer} (truth ${t})`); }
      else if (wasRight && !nowRight) { broken++; console.log(`     BROKEN ${k} ${before.get(k)!.answer}→${after.get(k)!.answer} (truth ${t})`); }
      else if (wasRight) held++; else stillWrong++;
    }
    console.log(`\n3. CORRECTNESS — zoomed items with a known truth: n=${graded.length} (small; do not over-read)`);
    console.log(`   fixed ${fixed} · broken ${broken} · held ${held} · still wrong ${stillWrong}`);

    // 4. Direction — the #66 lesson.
    let f2p = 0, p2f = 0, resolvedNow = 0, resolvedBefore = 0;
    const zoomUnion = [...new Set([...zoomedNow, ...zoomedBefore])];
    for (const k of zoomUnion) {
      const b = before.get(k)!.answer, a = after.get(k)!.answer;
      if (b !== "uncertain") resolvedBefore++;
      if (a !== "uncertain") resolvedNow++;
      if (b === "fail" && a === "pass") f2p++;
      else if (b === "pass" && a === "fail") p2f++;
    }
    console.log(`\n4. DIRECTION — over the ${zoomUnion.length} items zoomed either way`);
    console.log(`   fail→pass ${f2p} · pass→fail ${p2f}`);
    console.log(`   resolved (not left uncertain): ${resolvedBefore} → ${resolvedNow}`);

    // 5. The labels this run creates.
    const named = zoomedNow.map((k) => namedView(after.get(k)!.detail)).filter((v): v is string => v !== null);
    const hist = named.reduce<Record<string, number>>((h, v) => ((h[v] = (h[v] ?? 0) + 1), h), {});
    console.log(`\n5. LABELS CREATED — the follow-up names the view it answered from`);
    console.log(`   details naming a view: ${named.length} of ${zoomedNow.length} (${pct(named.length, zoomedNow.length)})`);
    console.log(`   which view answered: ${JSON.stringify(hist)}`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
