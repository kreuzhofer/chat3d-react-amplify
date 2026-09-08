/**
 * PROTOTYPE — wayfinder #67 / the two-replica incident. The self-pair that
 * separates "two replicas changes the numerics" from "today's pool is
 * nondeterministic for some other reason".
 *
 *   npx tsx prototypes/67-zoom-views/selfpair67.ts <arm A run> <arm B run>
 *
 * Both arms are the same judge on the same 142 examples under the same
 * instrument, minutes apart, sole tenant, on today's two-replica pool. Items
 * that reached a zoom follow-up are excluded: the follow-up is not the thing
 * under test here, and its answer is a second call.
 */
import { prisma } from "../../src/db/prisma.js";

type A = "pass" | "fail" | "uncertain";
const ans = (p: unknown): A => (p === true ? "pass" : p === false ? "fail" : "uncertain");
const zoomed = (it: any) =>
  Array.isArray(it?.zoomViews) || String(it?.detail ?? "").startsWith("[2x zoom]") || typeof it?.zoomFollowUp === "string";

async function arm(runId: string) {
  const rows = await prisma.vlmExperimentResult.findMany({
    where: { runId }, select: { exampleId: true, checklistResults: true, rawResponse: true, visualScore: true },
  });
  const items = new Map<string, { a: A; z: boolean }>();
  const raw = new Map<string, string>();
  const score = new Map<string, number | null>();
  for (const r of rows) {
    const list = Array.isArray(r.checklistResults) ? (r.checklistResults as any[]) : [];
    list.forEach((it, i) => items.set(`${r.exampleId}#${i + 1}`, { a: ans(it?.pass), z: zoomed(it) }));
    raw.set(r.exampleId, r.rawResponse ?? "");
    score.set(r.exampleId, r.visualScore == null ? null : Number(r.visualScore));
  }
  return { items, raw, score };
}

async function main() {
  const [idA, idB] = process.argv.slice(2);
  if (!idA || !idB) throw new Error("give two run ids");
  const a = await arm(idA), b = await arm(idB);

  const keys = [...a.items.keys()].filter((k) => b.items.has(k));
  const clean = keys.filter((k) => !a.items.get(k)!.z && !b.items.get(k)!.z);
  const moved = clean.filter((k) => a.items.get(k)!.a !== b.items.get(k)!.a);

  const examples = [...a.raw.keys()].filter((e) => b.raw.has(e));
  const byteIdentical = examples.filter((e) => a.raw.get(e) === b.raw.get(e));
  const sameScore = examples.filter((e) => a.score.get(e) === b.score.get(e));

  console.log(`\nSELF-PAIR on today's two-replica pool — same judge, same 142, same instrument, minutes apart`);
  console.log(`  first-pass items paired ${clean.length} (of ${keys.length}; ${keys.length - clean.length} reached a follow-up in one arm or the other)`);
  console.log(`  identical ${clean.length - moved.length} (${((100 * (clean.length - moved.length)) / clean.length).toFixed(1)}%) · moved ${moved.length} (${((100 * moved.length) / clean.length).toFixed(1)}%)`);
  console.log(`  whole responses byte-identical: ${byteIdentical.length}/${examples.length}`);
  console.log(`  same visual score: ${sameScore.length}/${examples.length}`);
  for (const k of moved.slice(0, 12)) console.log(`    ${k} ${a.items.get(k)!.a}→${b.items.get(k)!.a}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
