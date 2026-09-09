/**
 * The sittings: every adjudication sitting with its tally, and the form that
 * starts a new one over a candidate/reference pair of completed VLM runs (or
 * the corpus's own ratings for an experiment's sample).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionCard } from "../../layout/SectionCard";
import { InlineAlert } from "../../layout/InlineAlert";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { createSitting, listSittings, startSittingDraw, type SittingSummary } from "../../../api/adjudication.api";
import { getJobStatus } from "../../../api/workbench.api";
import { listVlmExperiments, type VlmExperimentListItem } from "../../../api/vlm-experiment.api";

interface Props { token: string; onOpen: (id: string) => void }

const selectClass = "w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))]";

export function AdjudicationSittingsList({ token, onOpen }: Props) {
  const [sittings, setSittings] = useState<SittingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { setSittings((await listSittings(token)).sittings); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 p-4">
      {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      <SectionCard
        title="Adjudication sittings"
        description="Disagreement inspection under ADR 0004: the items two judges answered differently, decided by a human — R the reference was right, C the candidate, N neither."
        actions={<Button size="sm" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Start a sitting"}</Button>}
      >
        {showForm && <StartSittingForm token={token} onCreated={(id) => { setShowForm(false); load(); onOpen(id); }} />}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                <th className="p-2">Sitting</th><th className="p-2">Pair</th><th className="p-2">Instrument</th>
                <th className="p-2 text-right">Items</th><th className="p-2 text-right">Decided</th>
                <th className="p-2 text-right">False passes</th><th className="p-2 text-right">False fails</th><th className="p-2">State</th>
              </tr>
            </thead>
            <tbody>
              {sittings?.map((s) => (
                <tr key={s.id} className="border-b border-[hsl(var(--border)_/_0.4)] hover:bg-[hsl(var(--muted)_/_0.3)]">
                  <td className="p-2"><Link className="font-medium text-[hsl(var(--primary))] hover:underline" to={`/admin/adjudication/${s.id}`}>{s.title}</Link>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(s.createdAt).toLocaleDateString()} · {s.adjudicator?.displayName ?? s.adjudicator?.email ?? "unassigned"}{s.origin === "import" ? " · imported" : ""}</div></td>
                  <td className="p-2 text-xs"><div>cand: {s.candidateLabel}</div><div>ref: {s.referenceLabel}</div></td>
                  <td className="p-2 font-mono text-xs">{s.instrumentId}</td>
                  <td className="p-2 text-right">{s.itemCount} <span className="text-xs text-[hsl(var(--muted-foreground))]">on {s.exampleCount}</span></td>
                  <td className="p-2 text-right font-mono">{s.tally.decided}/{s.tally.hard}</td>
                  <td className="p-2 text-right font-mono">{s.tally.candFalsePass} vs {s.tally.refFalsePass}</td>
                  <td className="p-2 text-right font-mono">{s.tally.candFalseFail} vs {s.tally.refFalseFail} <span className="text-xs text-[hsl(var(--muted-foreground))]">/ {s.tally.falseFailAllowance}</span></td>
                  <td className="p-2 text-xs">{s.completedAt ? (s.tally.falsePassHolds && s.tally.falseFailHolds ? "complete · holds" : "complete · fails") : `open · ${s.tally.open} left`}</td>
                </tr>
              ))}
              {sittings && sittings.length === 0 ? <tr><td className="p-4 text-center text-[hsl(var(--muted-foreground))]" colSpan={8}>No sittings yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function StartSittingForm({ token, onCreated }: { token: string; onCreated: (id: string) => void }) {
  const [experiments, setExperiments] = useState<VlmExperimentListItem[]>([]);
  const [candidateMode, setCandidateMode] = useState<"corpus" | "run" | "production">("corpus");
  const [size, setSize] = useState(50);
  const [seed, setSeed] = useState<string>(String(Math.floor(Math.random() * 1000000)));
  const [triage, setTriage] = useState(true);
  const [draw, setDraw] = useState<{ jobId: string; completed: number; total: number; text: string } | null>(null);
  const [candidateRunId, setCandidateRunId] = useState("");
  const [productionExperimentId, setProductionExperimentId] = useState("");
  const [referenceRunId, setReferenceRunId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listVlmExperiments(token).then((r) => setExperiments(r.items.filter((e) => e.runs.some((run) => run.status === "completed")))).catch((e) => setError(String(e)));
  }, [token]);

  const runOptions = useMemo(() => experiments.flatMap((e) => e.runs.filter((r) => r.status === "completed").map((r) => ({
    id: r.id, label: `${e.name} — ${r.modelLabel}${r.judgePromptVariantId ? ` · ${r.judgePromptVariantId}` : ""} (${r.id.slice(0, 8)})`,
  }))), [experiments]);

  // The draw is a job: the reference judges the sample first, then the sitting opens.
  useEffect(() => {
    if (!draw) return;
    const timer = setInterval(async () => {
      try {
        const j = await getJobStatus(token, draw.jobId);
        setDraw({ jobId: j.jobId, completed: j.completed, total: j.total, text: j.currentPromptText ?? "" });
        if (j.status !== "running") {
          clearInterval(timer); setDraw(null);
          if (j.status === "completed" && j.sittingId) onCreated(j.sittingId);
          else setError(j.error ?? `The draw ended ${j.status}`);
        }
      } catch (e) { clearInterval(timer); setDraw(null); setError(e instanceof Error ? e.message : String(e)); }
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw?.jobId]);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      if (candidateMode === "corpus") {
        const j = await startSittingDraw(token, { size, seed: seed === "" ? undefined : Number(seed), title: title || undefined, triage });
        setDraw({ jobId: j.jobId, completed: j.completed, total: j.total, text: "" });
        return;
      }
      const s = await createSitting(token, {
        referenceRunId,
        ...(candidateMode === "run" ? { candidateRunId } : { productionExperimentId }),
        title: title || undefined, notes: notes || undefined,
      });
      onCreated(s.id);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const ready = candidateMode === "corpus" ? size >= 1 : referenceRunId && (candidateMode === "run" ? candidateRunId && candidateRunId !== referenceRunId : productionExperimentId);

  return (
    <div className="mb-4 space-y-3 rounded border border-[hsl(var(--border))] p-3 text-sm">
      {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Candidate</span>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1"><input type="radio" checked={candidateMode === "corpus"} onChange={() => setCandidateMode("corpus")} /> draw from the corpus</label>
            <label className="flex items-center gap-1"><input type="radio" checked={candidateMode === "run"} onChange={() => setCandidateMode("run")} /> an experiment run</label>
            <label className="flex items-center gap-1"><input type="radio" checked={candidateMode === "production"} onChange={() => setCandidateMode("production")} /> the corpus's own ratings for a sample</label>
          </div>
          {candidateMode === "corpus" ? (
            <div className="flex flex-wrap items-end gap-3 text-xs">
              <label className="space-y-1"><span className="block text-[hsl(var(--muted-foreground))]">Rows</span><Input type="number" min={1} max={500} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24" /></label>
              <label className="space-y-1"><span className="block text-[hsl(var(--muted-foreground))]">Seed</span><Input type="number" min={0} value={seed} onChange={(e) => setSeed(e.target.value)} className="w-32" /></label>
              <label className="flex items-center gap-1 pb-2"><input type="checkbox" checked={triage} onChange={(e) => setTriage(e.target.checked)} /> run triage when the sitting opens</label>
            </div>
          ) : candidateMode === "run" ? (
            <select className={selectClass} value={candidateRunId} onChange={(e) => setCandidateRunId(e.target.value)}>
              <option value="">Choose the candidate run…</option>
              {runOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          ) : (
            <select className={selectClass} value={productionExperimentId} onChange={(e) => setProductionExperimentId(e.target.value)}>
              <option value="">Choose the experiment whose sample to read…</option>
              {experiments.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.promptCount} examples, {e.id.slice(0, 8)})</option>)}
            </select>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Reference run</span>
          {candidateMode === "corpus" ? (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">The reference judge (the <i>Adjudication Reference</i> purpose) runs on the drawn rows first; the sitting opens when it completes, about ten to fifteen minutes for 125 rows.</p>
          ) : (
          <select className={selectClass} value={referenceRunId} onChange={(e) => setReferenceRunId(e.target.value)}>
            <option value="">Choose the reference run…</option>
            {runOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          )}
        </label>
        <label className="space-y-1"><span className="text-xs text-[hsl(var(--muted-foreground))]">Title (optional)</span><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="candidate vs reference" /></label>
        <label className="space-y-1"><span className="text-xs text-[hsl(var(--muted-foreground))]">Notes (optional)</span><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="the ticket, the seed, the window" /></label>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{candidateMode === "corpus"
        ? "The draw takes current rows outside the held-out 125 and outside every earlier sitting's sample, so a row is adjudicated at most once; the seed makes it reproducible."
        : "Both sides must be completed, unmarked by the serving gate, and under the same Instrument id. The disagreement set is drawn once and frozen."}</p>
      {draw ? <p className="text-xs">Reference judging the draw: <span className="font-mono">{draw.completed} / {draw.total}</span> {draw.text ? `· ${draw.text}` : ""}</p> : null}
      <Button size="sm" disabled={!ready || busy || !!draw} onClick={submit}>{draw ? "Drawing…" : busy ? "Starting…" : candidateMode === "corpus" ? "Draw and start" : "Start"}</Button>
    </div>
  );
}
