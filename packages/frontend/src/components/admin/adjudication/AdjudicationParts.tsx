/**
 * The pieces of an adjudication card: a view image that carries the token,
 * the eight-view grid with the deciding view marked, the two judges' answers
 * beside the triage, the decision buttons and the tally meters.
 */
import { useEffect, useState } from "react";
import {
  DIRECTION_LABEL, itemDirection, VIEW_LABEL, VIEW_ORDER,
  type AdjudicationTally, type Decision, type DecisionInput, type SittingItem, type ViewName,
} from "../../../api/adjudication.api";

export function ViewImage({ exampleId, view, token, className, onClick }: { exampleId: string; view: ViewName; token: string; className?: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false; let revoke: string | null = null;
    setUrl(null); setFailed(false);
    (async () => {
      try {
        const res = await fetch(`/api/admin/workbench/examples/${exampleId}/screenshot/${view}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!res.ok) { setFailed(true); return; }
        const u = URL.createObjectURL(await res.blob());
        if (cancelled) { URL.revokeObjectURL(u); return; }
        revoke = u; setUrl(u);
      } catch { if (!cancelled) setFailed(true); }
    })();
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [exampleId, view, token]);
  if (failed) return <div className={`${className ?? ""} flex items-center justify-center bg-[hsl(var(--muted))] text-[10px] text-[hsl(var(--muted-foreground))]`}>no {VIEW_LABEL[view]} view</div>;
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-[hsl(var(--muted))]`} />;
  return <img src={url} alt={`${VIEW_LABEL[view]} view`} className={className} onClick={onClick} />;
}

/** Which of the eight views a triage's "deciding view" text names. */
export function decidingViews(text: string | null | undefined): Set<ViewName> {
  const t = (text ?? "").toLowerCase();
  const out = new Set<ViewName>();
  for (const v of VIEW_ORDER) {
    const needle = v === "ortho_45" ? "45° down" : v === "ortho_45_bottom" ? "45° up" : v;
    if (t.includes(needle)) out.add(v);
  }
  return out;
}

export function ViewsGrid({ exampleId, token, deciding, cols = 8, onOpen }: { exampleId: string; token: string; deciding?: string | null; cols?: 4 | 8; onOpen?: (view: ViewName) => void }) {
  const d = decidingViews(deciding);
  return (
    <div className={`grid gap-2 ${cols === 8 ? "grid-cols-4 lg:grid-cols-8" : "grid-cols-2 lg:grid-cols-4"}`}>
      {VIEW_ORDER.map((v) => (
        <figure key={v} className={`rounded border ${d.has(v) ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]" : "border-[hsl(var(--border))]"}`}>
          <ViewImage exampleId={exampleId} view={v} token={token} className="aspect-square w-full cursor-zoom-in object-contain" onClick={() => onOpen?.(v)} />
          <figcaption className="px-1 py-0.5 text-center text-[10px] text-[hsl(var(--muted-foreground))]">{VIEW_LABEL[v]}{d.has(v) ? " · deciding" : ""}</figcaption>
        </figure>
      ))}
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

export function DirectionChip({ item }: { item: SittingItem }) {
  return <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">{DIRECTION_LABEL[itemDirection(item)]}</span>;
}

export function JudgeColumns({ item, refLabel, candLabel }: { item: SittingItem; refLabel: string; candLabel: string }) {
  const t = item.triage;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded border border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]"><span className="truncate" title={refLabel}>{refLabel} · reference</span><StateBadge state={item.refState} /></div>
        <p className="text-sm text-[hsl(var(--foreground))]">{item.refDetail}</p>
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]"><span className="truncate" title={candLabel}>{candLabel} · candidate</span><StateBadge state={item.candState} /></div>
        <p className="text-sm text-[hsl(var(--foreground))]">{item.candDetail}</p>
        {item.arm2State ? <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Second arm answered <b>{item.arm2State}</b>: {item.arm2Detail}</p> : null}
      </div>
      <div className="rounded border border-dashed border-[hsl(var(--border))] p-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <span>Triage · not a judge</span>
          {t ? <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs font-semibold">{t.verdict}{t.confidence ? ` · ${t.confidence}` : ""}</span> : <span className="text-xs">none</span>}
        </div>
        {t ? (<>
          <p className="text-sm text-[hsl(var(--foreground))]">{t.what}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Deciding view: {t.view || "—"}{t.resolvedBy ? ` · ${t.resolvedBy}` : ""}</p>
          {t.model ? <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.model}</p> : null}
        </>) : <p className="text-xs text-[hsl(var(--muted-foreground))]">No third opinion on this item.</p>}
      </div>
    </div>
  );
}

export function DecisionButtons({ item, disabled, onDecide }: { item: SittingItem; disabled?: boolean; onDecide: (input: DecisionInput) => void }) {
  const [note, setNote] = useState(item.note);
  useEffect(() => { setNote(item.note); }, [item.id, item.note]);
  const pressed = (key: Decision) => item.decision === key && !item.agreedWithTriage;
  const btn = (label: string, isPressed: boolean, onClick: () => void, extraDisabled = false) => (
    <button
      type="button"
      aria-pressed={isPressed}
      disabled={disabled || extraDisabled}
      className={`rounded border px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${isPressed ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"}`}
      onClick={onClick}
    >{label}</button>
  );
  const decide = (decision: Decision | null, agreedWithTriage = false) => onDecide({ decision, note, agreedWithTriage });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-[hsl(var(--muted-foreground))]">Your decision</span>
      {btn(`Agree with triage${item.triage ? ` (${item.triage.verdict})` : ""}`, item.agreedWithTriage, () => item.triage && decide(item.triage.verdict, true), !item.triage)}
      {btn("R · reference right", pressed("R"), () => decide(pressed("R") ? null : "R"))}
      {btn("C · candidate right", pressed("C"), () => decide(pressed("C") ? null : "C"))}
      {btn("N · neither", pressed("N"), () => decide(pressed("N") ? null : "N"))}
      <input
        className="min-w-[14rem] flex-1 rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-xs"
        placeholder={item.decision ? "Note (optional): what you saw, or why the triage is wrong — saved when you leave the field" : "Note (optional): saved with your decision"}
        value={note}
        disabled={disabled}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => { if (note !== item.note && item.decision) onDecide({ decision: item.decision, note, agreedWithTriage: item.agreedWithTriage }); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </div>
  );
}

export function TallyMeters({ t, agreed, overruled, layout = "row" }: { t: AdjudicationTally; agreed: number; overruled: number; layout?: "row" | "column" }) {
  const open = !t.complete;
  const state = (ok: boolean) => (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${open ? "bg-[hsl(var(--muted))]" : ok ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100" : "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100"}`}>{open ? "open" : ok ? "holds" : "fails"}</span>
  );
  return (
    <div className={`grid gap-3 ${layout === "row" ? "md:grid-cols-3" : "grid-cols-1"}`}>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>Decided</span><span className="font-mono">{t.decided} of {t.hard} hard flips</span></div>
        <div className="mt-1 h-1.5 rounded bg-[hsl(var(--muted))]"><div className="h-1.5 rounded bg-[hsl(var(--primary))]" style={{ width: `${t.hard ? (100 * t.decided) / t.hard : 0}%` }} /></div>
        <div className="mt-1 flex justify-between text-[hsl(var(--muted-foreground))]"><span>Agreed with triage</span><span className="font-mono">{agreed}</span></div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>Overruled triage</span><span className="font-mono">{overruled}</span></div>
        {t.items > t.hard ? <div className="text-[hsl(var(--muted-foreground))]">{t.items - t.hard} with one side uncertain, outside the terms</div> : null}
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>False passes · candidate ≤ reference</span>{state(t.falsePassHolds)}</div>
        <div className="mt-1 text-lg font-semibold">{t.candFalsePass} <small className="font-normal text-[hsl(var(--muted-foreground))]">cand</small> vs {t.refFalsePass} <small className="font-normal text-[hsl(var(--muted-foreground))]">ref</small></div>
      </div>
      <div className="rounded border border-[hsl(var(--border))] p-2 text-xs">
        <div className="flex justify-between"><span>False fails · candidate ≤ 2× reference</span>{state(t.falseFailHolds)}</div>
        <div className="mt-1 text-lg font-semibold">{t.candFalseFail} <small className="font-normal text-[hsl(var(--muted-foreground))]">cand</small> vs {t.refFalseFail} <small className="font-normal text-[hsl(var(--muted-foreground))]">ref · allowance {t.falseFailAllowance}</small></div>
        <div className="text-[hsl(var(--muted-foreground))]">{t.n} N · {t.open} open</div>
      </div>
    </div>
  );
}

export function stepView(view: ViewName, d: 1 | -1): ViewName {
  return VIEW_ORDER[(VIEW_ORDER.indexOf(view) + d + VIEW_ORDER.length) % VIEW_ORDER.length];
}

export function Lightbox({ exampleId, view, token, onClose, onStep }: { exampleId: string; view: ViewName; token: string; onClose: () => void; onStep: (d: 1 | -1) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onStep(1); if (e.key === "ArrowLeft") onStep(-1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose, onStep]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6" onClick={onClose} role="dialog" aria-label="View at full size">
      <div className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <ViewImage exampleId={exampleId} view={view} token={token} className="max-h-[85vh] w-auto rounded bg-white" />
        <div className="mt-2 flex justify-between text-xs text-white"><span>{VIEW_LABEL[view]} · ← → to step · Esc to close</span><button type="button" onClick={onClose}>close</button></div>
      </div>
    </div>
  );
}
