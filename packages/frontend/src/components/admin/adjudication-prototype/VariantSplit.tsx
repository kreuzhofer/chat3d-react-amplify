/**
 * PROTOTYPE variant C — "By example": the left pane lists the disagreements
 * grouped by example (one row per item, its verdict beside it); the right
 * pane shows the selected example's eight views pinned at the top and the
 * selected item's card beneath. Moving between items of the same example
 * keeps the views in place — the views are the example's, not the item's.
 */
import { useMemo, useState } from "react";
import { type Adjudication, type PrototypeItem, type Tally } from "./types";
import { DirectionChip, JudgeColumns, Lightbox, Meters, StateBadge, VerdictButtons, ViewsGrid } from "./shared";
import { stepView } from "./VariantSheet";

interface Props { items: PrototypeItem[]; verdicts: Record<string, Adjudication>; setVerdict: (id: string, a: Adjudication | null) => void; tally: Tally; token: string }

export function VariantSplit({ items, verdicts, setVerdict, tally, token }: Props) {
  const groups = useMemo(() => {
    const m = new Map<string, PrototypeItem[]>();
    for (const it of items) m.set(it.exampleId, [...(m.get(it.exampleId) ?? []), it]);
    return [...m.entries()];
  }, [items]);
  const [selected, setSelected] = useState<string>(items[0]?.id);
  const [lb, setLb] = useState<string | null>(null);
  const it = items.find((x) => x.id === selected) ?? items[0];
  const agreed = Object.values(verdicts).filter((v) => v.agreedWithTriage).length;
  const siblings = groups.find(([ex]) => ex === it.exampleId)?.[1] ?? [];

  return (
    <div className="grid grid-cols-[22rem_1fr] gap-4">
      <aside className="space-y-3">
        <div className="max-h-[70vh] overflow-y-auto rounded border border-[hsl(var(--border))]">
          {groups.map(([ex, list], gi) => (
            <div key={ex} className="border-b border-[hsl(var(--border))] last:border-b-0">
              <div className="flex items-center justify-between bg-[hsl(var(--muted)_/_0.4)] px-2 py-1 text-xs">
                <span className="truncate"><span className="font-mono">{gi + 1}</span> · {list[0].category} · <span className="font-mono">{ex.slice(0, 8)}</span></span>
                <span className="font-mono text-[hsl(var(--muted-foreground))]">{list.filter((x) => verdicts[x.id]).length}/{list.length}</span>
              </div>
              {list.map((x) => (
                <button key={x.id} onClick={() => setSelected(x.id)}
                  className={`flex w-full items-start gap-2 px-2 py-1.5 text-left text-xs hover:bg-[hsl(var(--muted))] ${x.id === it.id ? "bg-[hsl(var(--muted))]" : ""}`}>
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded text-center text-[10px] leading-4 ${verdicts[x.id] ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"}`}>{verdicts[x.id]?.decision ?? ""}</span>
                  <span className="flex-1">{x.itemIndex + 1}. {x.question}</span>
                  <span className="shrink-0 space-x-1"><StateBadge state={x.ref.state} /><StateBadge state={x.cand.state} /></span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <Meters t={tally} total={items.length} agreed={agreed} overruled={Object.keys(verdicts).length - agreed} layout="column" />
      </aside>
      <section>
        <div className="sticky top-0 z-10 -mt-2 bg-[hsl(var(--background))] pb-2 pt-2">
          <div className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">{it.category} · <span className="font-mono">{it.exampleId.slice(0, 8)}</span> · {siblings.length} disagreement{siblings.length === 1 ? "" : "s"} on this example</div>
          <p className="mb-2 text-xs text-[hsl(var(--muted-foreground))]">{it.prompt}</p>
          <ViewsGrid exampleId={it.exampleId} token={token} deciding={it.triage?.decidingView} cols={8} onOpen={setLb} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="font-mono">item {it.itemIndex + 1}</span><DirectionChip item={it} /></div>
        <h3 className="mb-2 text-base font-semibold text-[hsl(var(--foreground))]">{it.question}</h3>
        <JudgeColumns item={it} />
        <VerdictButtons item={it} value={verdicts[it.id]} onChange={(a) => {
          setVerdict(it.id, a);
          if (a) { const next = items.findIndex((x, i) => i > items.indexOf(it) && !verdicts[x.id]); if (next >= 0) setSelected(items[next].id); }
        }} />
      </section>
      {lb ? <Lightbox exampleId={it.exampleId} view={lb} token={token} onClose={() => setLb(null)} onStep={(d) => setLb((v) => v && stepView(v, d))} /> : null}
    </div>
  );
}
