/**
 * PROTOTYPE (throwaway): pieces every variant shares — a view image that
 * carries the token, the eight-view grid, the two judges' columns, the
 * triage column, the verdict buttons and the meters. Shared parts only;
 * each variant owns its layout.
 */
import { useEffect, useState } from "react";
import { DIRECTION_LABEL, direction, VIEW_LABEL, VIEW_ORDER, type Adjudication, type Decision, type PrototypeItem, type Tally } from "./types";

export function ViewImage({ exampleId, view, token, className, onClick }: { exampleId: string; view: string; token: string; className?: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false; let revoke: string | null = null;
    (async () => {
      try {
        const res = await fetch(`/api/admin/workbench/examples/${exampleId}/screenshot/${view}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok || cancelled) return;
        const u = URL.createObjectURL(await res.blob());
        if (cancelled) { URL.revokeObjectURL(u); return; }
        revoke = u; setUrl(u);
      } catch { /* prototype: ignore */ }
    })();
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [exampleId, view, token]);
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-[hsl(var(--muted))]`} />;
  return <img src={url} alt={`${VIEW_LABEL[view as keyof typeof VIEW_LABEL]} view`} className={className} onClick={onClick} />;
}

export function ViewsGrid({ exampleId, token, deciding, cols = 4, onOpen }: { exampleId: string; token: string; deciding?: string; cols?: number; onOpen?: (view: string) => void }) {
  const d = (deciding ?? "").toLowerCase();
  return (
    <div className={`grid gap-2 ${cols === 8 ? "grid-cols-8" : cols === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
      {VIEW_ORDER.map((v) => {
        const hit = d.includes(v === "ortho_45" ? "45° down" : v === "ortho_45_bottom" ? "45° up" : v);
        return (
          <figure key={v} className={`rounded border ${hit ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]" : "border-[hsl(var(--border))]"}`}>
            <ViewImage exampleId={exampleId} view={v} token={token} className="aspect-square w-full cursor-zoom-in object-contain" onClick={() => onOpen?.(v)} />
            <figcaption className="px-1 py-0.5 text-center text-[10px] text-[hsl(var(--muted-foreground))]">{VIEW_LABEL[v]}{hit ? " · deciding" : ""}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

const STATE_CLASS: Record<string, string> = {
  pass: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100",
  fail: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
  uncertain: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",
};
export function StateBadge({ state }: { state: string }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${STATE_CLASS[state] ?? ""}`}>{state}</span>;
}

export function DirectionChip({ item }: { item: PrototypeItem }) {
  return <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">{DIRECTION_LABEL[direction(item)]}</span>;
}

export function JudgeColumns({ item, stacked = false }: { item: PrototypeItem; stacked?: boolean }) {
  const t = item.triage;
  return (
    <div className={`grid gap-3 ${stacked ? "grid-cols-1" : "grid-cols-3"}`}>
      <div className="rounded border border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]"><span>Sonnet 4.6 · reference</span><StateBadge state={item.ref.state} /></div>
        <p className="text-sm text-[hsl(var(--foreground))]">{item.ref.detail}</p>
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]"><span>qwen3.8-27b · candidate</span><StateBadge state={item.cand.state} /></div>
        <p className="text-sm text-[hsl(var(--foreground))]">{item.cand.detail}</p>
      </div>
      <div className="rounded border border-dashed border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]"><span>Third opinion · triage, not a judge</span>{t ? <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs font-semibold">{t.verdict} · {t.confidence}</span> : <span className="text-xs">none yet</span>}</div>
        {t ? (<>
          <p className="text-sm text-[hsl(var(--foreground))]">{t.what}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Deciding view: {t.decidingView || "—"} · {t.resolvedBy}</p>
        </>) : null}
      </div>
    </div>
  );
}

export function VerdictButtons({ item, value, onChange, compact = false }: { item: PrototypeItem; value: Adjudication | undefined; onChange: (a: Adjudication | null) => void; compact?: boolean }) {
  const btn = (key: Decision | "agree", label: string, pressed: boolean) => (
    <button
      type="button"
      aria-pressed={pressed}
      className={`rounded border px-2 py-1 text-xs font-medium transition ${pressed ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"}`}
      onClick={() => {
        if (key === "agree") { if (item.triage) onChange({ decision: item.triage.verdict, agreedWithTriage: true, note: value?.note ?? "" }); return; }
        if (value?.decision === key && !value.agreedWithTriage) onChange(null);
        else onChange({ decision: key, agreedWithTriage: false, note: value?.note ?? "" });
      }}
      disabled={key === "agree" && !item.triage}
    >{label}</button>
  );
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`}>
      <span className="text-xs text-[hsl(var(--muted-foreground))]">Your verdict</span>
      {btn("agree", `Agree with triage${item.triage ? ` (${item.triage.verdict})` : ""}`, !!value?.agreedWithTriage)}
      {btn("R", "R · reference right", value?.decision === "R" && !value.agreedWithTriage)}
      {btn("C", "C · candidate right", value?.decision === "C" && !value.agreedWithTriage)}
      {btn("N", "N · neither", value?.decision === "N" && !value.agreedWithTriage)}
      <input
        className="min-w-[16rem] flex-1 rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-xs"
        placeholder="Note (optional): what you saw, or why the triage is wrong"
        value={value?.note ?? ""}
        onChange={(e) => onChange(value ? { ...value, note: e.target.value } : { decision: "N", agreedWithTriage: false, note: e.target.value })}
      />
    </div>
  );
}

export function Meters({ t, total, agreed, overruled, layout = "row" }: { t: Tally; total: number; agreed: number; overruled: number; layout?: "row" | "column" }) {
  const state = (ok: boolean, open: boolean) => (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${open ? "bg-[hsl(var(--muted))]" : ok ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100" : "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100"}`}>{open ? "open" : ok ? "holds" : "fails"}</span>
  );
  const open = t.decided < t.hard;
  return (
    <div className={`grid gap-3 ${layout === "row" ? "grid-cols-3" : "grid-cols-1"}`}>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>Adjudicated</span><span className="font-mono">{t.decided + (total - t.hard - 0)} of {total}</span></div>
        <div className="mt-1 h-1.5 rounded bg-[hsl(var(--muted))]"><div className="h-1.5 rounded bg-[hsl(var(--primary))]" style={{ width: `${total ? (100 * (t.decided)) / t.hard : 0}%` }} /></div>
        <div className="mt-1 flex justify-between text-[hsl(var(--muted-foreground))]"><span>Agreed with triage</span><span className="font-mono">{agreed}</span></div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>Overruled triage</span><span className="font-mono">{overruled}</span></div>
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>False passes · cand ≤ ref</span>{state(t.falsePassHolds, open)}</div>
        <div className="mt-1 text-lg font-semibold"><span>{t.candFalsePass}</span> <small className="text-[hsl(var(--muted-foreground))]">cand</small> vs <span>{t.refFalsePass}</span> <small className="text-[hsl(var(--muted-foreground))]">ref</small></div>
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>False fails · cand ≤ 2× ref</span>{state(t.falseFailHolds, open)}</div>
        <div className="mt-1 text-lg font-semibold"><span>{t.candFalseFail}</span> <small className="text-[hsl(var(--muted-foreground))]">cand</small> vs <span>{t.refFalseFail}</span> <small className="text-[hsl(var(--muted-foreground))]">ref (allowance {t.falseFailAllowance})</small></div>
        <div className="text-[hsl(var(--muted-foreground))]">{t.n} N · {t.hard - t.decided} undecided</div>
      </div>
    </div>
  );
}

export function Lightbox({ exampleId, view, token, onClose, onStep }: { exampleId: string; view: string; token: string; onClose: () => void; onStep: (dir: 1 | -1) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onStep(1); if (e.key === "ArrowLeft") onStep(-1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose, onStep]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <div className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <ViewImage exampleId={exampleId} view={view} token={token} className="max-h-[85vh] w-auto rounded bg-white" />
        <div className="mt-2 flex justify-between text-xs text-white"><span>{VIEW_LABEL[view as keyof typeof VIEW_LABEL]} · ← → to step, Esc to close</span><button onClick={onClose}>close</button></div>
      </div>
    </div>
  );
}
