/**
 * PROTOTYPE variant A — "The sheet": the #57 page transplanted. Every card
 * on one scrolling page, meters and filters pinned at the top, j/k to move,
 * r/c/n/a to decide. Views load lazily as the card scrolls in.
 */
import { useEffect, useMemo, useState } from "react";
import { carefulLookRank, direction, type Adjudication, type PrototypeItem, type Tally } from "./types";
import { DirectionChip, JudgeColumns, Lightbox, Meters, VerdictButtons, ViewsGrid } from "./shared";

interface Props { items: PrototypeItem[]; verdicts: Record<string, Adjudication>; setVerdict: (id: string, a: Adjudication | null) => void; tally: Tally; token: string }

export function VariantSheet({ items, verdicts, setVerdict, tally, token }: Props) {
  const [sort, setSort] = useState<"sheet" | "careful">("sheet");
  const [state, setState] = useState<"all" | "todo" | "done">("all");
  const [dir, setDir] = useState<"all" | "cand-fails" | "cand-passes">("all");
  const [current, setCurrent] = useState<string | null>(items[0]?.id ?? null);
  const [lb, setLb] = useState<{ exampleId: string; view: string } | null>(null);

  const ordered = useMemo(() => {
    const arr = items.slice();
    if (sort === "careful") arr.sort((a, b) => carefulLookRank(a) - carefulLookRank(b));
    return arr;
  }, [items, sort]);
  const visible = ordered.filter((it) => (state === "all" || (state === "done") === !!verdicts[it.id]) && (dir === "all" || direction(it) === dir));
  const agreed = Object.values(verdicts).filter((v) => v.agreedWithTriage).length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input, textarea")) return;
      const idx = visible.findIndex((it) => it.id === current);
      if (e.key === "j" || e.key === "ArrowDown") { const n = visible[Math.min(visible.length - 1, idx + 1)]; if (n) { setCurrent(n.id); document.getElementById(`card-${n.id}`)?.scrollIntoView({ block: "start" }); e.preventDefault(); } }
      if (e.key === "k" || e.key === "ArrowUp") { const n = visible[Math.max(0, idx - 1)]; if (n) { setCurrent(n.id); document.getElementById(`card-${n.id}`)?.scrollIntoView({ block: "start" }); e.preventDefault(); } }
      const it = visible[idx];
      if (!it) return;
      if (e.key === "a" && it.triage) setVerdict(it.id, { decision: it.triage.verdict, agreedWithTriage: true, note: verdicts[it.id]?.note ?? "" });
      if (e.key === "r" || e.key === "c" || e.key === "n") setVerdict(it.id, { decision: e.key.toUpperCase() as "R" | "C" | "N", agreedWithTriage: false, note: verdicts[it.id]?.note ?? "" });
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [visible, current, verdicts, setVerdict]);

  const seg = <T extends string>(val: T, cur: T, set: (v: T) => void, label: string) => (
    <button className={`rounded px-2 py-0.5 text-xs ${cur === val ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "hover:bg-[hsl(var(--muted))]"}`} onClick={() => set(val)}>{label}</button>
  );

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2">
        <Meters t={tally} total={items.length} agreed={agreed} overruled={Object.keys(verdicts).length - agreed} />
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <div className="flex gap-1 rounded border border-[hsl(var(--border))] p-0.5">{seg("all", dir, setDir, "All directions")}{seg("cand-fails", dir, setDir, "candidate fails")}{seg("cand-passes", dir, setDir, "candidate passes")}</div>
          <div className="flex gap-1 rounded border border-[hsl(var(--border))] p-0.5">{seg("all", state, setState, "All")}{seg("todo", state, setState, "To do")}{seg("done", state, setState, "Done")}</div>
          <div className="flex gap-1 rounded border border-[hsl(var(--border))] p-0.5">{seg("sheet", sort, setSort, "Sheet order")}{seg("careful", sort, setSort, "Careful look first")}</div>
          <span className="self-center text-[hsl(var(--muted-foreground))]">j/k move · a agree · r/c/n decide · click a view to enlarge</span>
        </div>
      </div>
      <div className="mt-3 space-y-4">
        {visible.map((it, i) => (
          <article key={it.id} id={`card-${it.id}`} onClick={() => setCurrent(it.id)}
            className={`rounded-lg border p-3 ${current === it.id ? "border-[hsl(var(--primary))]" : "border-[hsl(var(--border))]"} ${verdicts[it.id] ? "opacity-80" : ""}`}>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="font-mono">{i + 1}</span><span>{it.category}</span><span className="font-mono">{it.exampleId.slice(0, 8)} · item {it.itemIndex + 1}</span><DirectionChip item={it} />
              {verdicts[it.id] ? <span className="rounded bg-[hsl(var(--primary))] px-1.5 text-[hsl(var(--primary-foreground))]">{verdicts[it.id].decision}</span> : null}
            </div>
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">{it.question}</h3>
            <details className="mb-2 text-xs text-[hsl(var(--muted-foreground))]"><summary>Prompt</summary><p className="mt-1">{it.prompt}</p></details>
            <JudgeColumns item={it} />
            <div className="mt-3"><ViewsGrid exampleId={it.exampleId} token={token} deciding={it.triage?.decidingView} cols={8} onOpen={(view) => setLb({ exampleId: it.exampleId, view })} /></div>
            <VerdictButtons item={it} value={verdicts[it.id]} onChange={(a) => setVerdict(it.id, a)} />
          </article>
        ))}
        {visible.length === 0 ? <p className="text-sm text-[hsl(var(--muted-foreground))]">Nothing matches these filters.</p> : null}
      </div>
      {lb ? <Lightbox exampleId={lb.exampleId} view={lb.view} token={token} onClose={() => setLb(null)} onStep={(d) => setLb((s) => s && { ...s, view: stepView(s.view, d) })} /> : null}
    </div>
  );
}

export function stepView(view: string, d: 1 | -1): string {
  const order = ["front", "back", "left", "right", "top", "bottom", "ortho_45", "ortho_45_bottom"];
  return order[(order.indexOf(view) + d + order.length) % order.length];
}
