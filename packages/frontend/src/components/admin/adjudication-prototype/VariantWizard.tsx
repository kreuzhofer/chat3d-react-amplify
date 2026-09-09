/**
 * PROTOTYPE variant B — "One at a time": a single card fills the screen,
 * the views large (two rows of four), the judges' columns underneath, and a
 * left rail with the tally and a dot per item. Deciding advances to the next
 * undecided card; "careful look first" is the default order.
 */
import { useEffect, useMemo, useState } from "react";
import { carefulLookRank, type Adjudication, type PrototypeItem, type Tally } from "./types";
import { DirectionChip, JudgeColumns, Lightbox, Meters, VerdictButtons, ViewsGrid } from "./shared";
import { stepView } from "./VariantSheet";

interface Props { items: PrototypeItem[]; verdicts: Record<string, Adjudication>; setVerdict: (id: string, a: Adjudication | null) => void; tally: Tally; token: string }

export function VariantWizard({ items, verdicts, setVerdict, tally, token }: Props) {
  const ordered = useMemo(() => items.slice().sort((a, b) => carefulLookRank(a) - carefulLookRank(b)), [items]);
  const [pos, setPos] = useState(0);
  const [lb, setLb] = useState<string | null>(null);
  const it = ordered[pos];
  const agreed = Object.values(verdicts).filter((v) => v.agreedWithTriage).length;

  const decide = (a: Adjudication | null) => {
    setVerdict(it.id, a);
    if (a) { const next = ordered.findIndex((x, i) => i > pos && !verdicts[x.id]); if (next >= 0) setPos(next); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "j") setPos((p) => Math.min(ordered.length - 1, p + 1));
      if (e.key === "ArrowLeft" || e.key === "k") setPos((p) => Math.max(0, p - 1));
      if (e.key === "a" && it?.triage) decide({ decision: it.triage.verdict, agreedWithTriage: true, note: verdicts[it.id]?.note ?? "" });
      if (e.key === "r" || e.key === "c" || e.key === "n") decide({ decision: e.key.toUpperCase() as "R" | "C" | "N", agreedWithTriage: false, note: verdicts[it.id]?.note ?? "" });
      if (e.key >= "1" && e.key <= "8") setLb(["front", "back", "left", "right", "top", "bottom", "ortho_45", "ortho_45_bottom"][Number(e.key) - 1]);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it, pos, verdicts, ordered]);

  if (!it) return null;
  return (
    <div className="grid grid-cols-[14rem_1fr] gap-4">
      <aside className="sticky top-4 self-start space-y-3">
        <Meters t={tally} total={items.length} agreed={agreed} overruled={Object.keys(verdicts).length - agreed} layout="column" />
        <div className="rounded border border-[hsl(var(--border))] p-2">
          <div className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">Items · careful look first</div>
          <div className="flex flex-wrap gap-1">
            {ordered.map((x, i) => (
              <button key={x.id} title={`${x.exampleId.slice(0, 8)} · ${x.question}`} onClick={() => setPos(i)}
                className={`h-5 w-5 rounded text-[10px] ${i === pos ? "ring-2 ring-[hsl(var(--primary))]" : ""} ${verdicts[x.id] ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"}`}>{verdicts[x.id]?.decision ?? ""}</button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">← → move · a agree · r/c/n decide and advance · 1–8 open a view</p>
      </aside>
      <section>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-mono">{pos + 1} / {ordered.length}</span><span>{it.category}</span><span className="font-mono">{it.exampleId.slice(0, 8)} · item {it.itemIndex + 1}</span><DirectionChip item={it} />
        </div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{it.question}</h3>
        <p className="mb-3 text-xs text-[hsl(var(--muted-foreground))]">{it.prompt}</p>
        <ViewsGrid exampleId={it.exampleId} token={token} deciding={it.triage?.decidingView} cols={4} onOpen={setLb} />
        <div className="mt-3"><JudgeColumns item={it} /></div>
        <div className="mt-3 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted)_/_0.3)] p-2">
          <VerdictButtons item={it} value={verdicts[it.id]} onChange={decide} compact />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <button className="underline" onClick={() => setPos((p) => Math.max(0, p - 1))}>← previous</button>
          <button className="underline" onClick={() => setPos((p) => Math.min(ordered.length - 1, p + 1))}>skip for now →</button>
        </div>
      </section>
      {lb ? <Lightbox exampleId={it.exampleId} view={lb} token={token} onClose={() => setLb(null)} onStep={(d) => setLb((v) => v && stepView(v, d))} /> : null}
    </div>
  );
}
