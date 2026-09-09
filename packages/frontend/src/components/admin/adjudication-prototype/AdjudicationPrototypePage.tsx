/**
 * PROTOTYPE (throwaway) — wayfinder #92: the adjudication sitting in the app.
 *
 * Question: with the views served by the app instead of inlined, which shape
 * of sitting feels right — the scrolling sheet that worked four times on
 * claude.ai (A), one card at a time with large views (B), or a list of the
 * disagreements by example with the example's views pinned (C)?
 *
 * Three variants on the throwaway route /admin/adjudication-prototype,
 * switchable via ?variant=A|B|C and the floating bar. Verdicts live in memory
 * (persistence is what the build adds, not what this checks). The fixture is
 * 16 of #85's 70 disagreements; the views come from the screenshot route.
 * Not gated on NODE_ENV on purpose: the deployed container is a production
 * build and this branch never merges the switcher.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdmin } from "../../../contexts/AdminContext";
import { FIXTURE_ITEMS } from "./fixture";
import { tally, type Adjudication } from "./types";
import { VariantSheet } from "./VariantSheet";
import { VariantWizard } from "./VariantWizard";
import { VariantSplit } from "./VariantSplit";

const VARIANTS = [
  { key: "A", name: "The sheet (the #57 page, in-app)" },
  { key: "B", name: "One at a time, large views" },
  { key: "C", name: "By example: list + pinned views" },
] as const;

export function AdjudicationPrototypePage() {
  const { token } = useAdmin();
  const [params, setParams] = useSearchParams();
  const variant = (params.get("variant") ?? "A").toUpperCase();
  const [verdicts, setVerdicts] = useState<Record<string, Adjudication>>({});
  const setVerdict = useCallback((id: string, a: Adjudication | null) => {
    setVerdicts((v) => { const n = { ...v }; if (a) n[id] = a; else delete n[id]; return n; });
  }, []);
  const t = useMemo(() => tally(FIXTURE_ITEMS, (it) => verdicts[it.id]?.decision), [verdicts]);

  const go = useCallback((d: 1 | -1) => {
    const i = VARIANTS.findIndex((v) => v.key === variant);
    const next = VARIANTS[(i + d + VARIANTS.length) % VARIANTS.length].key;
    setParams((p) => { p.set("variant", next); return p; }, { replace: true });
  }, [variant, setParams]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input, textarea, [contenteditable]")) return;
      if (e.altKey && e.key === "ArrowRight") go(1);
      if (e.altKey && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [go]);

  if (!token) return null;
  const props = { items: FIXTURE_ITEMS, verdicts, setVerdict, tally: t, token };
  const current = VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0];
  return (
    <div className="p-4 pb-20">
      <div className="mb-3 rounded border border-dashed border-amber-500/60 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
        <b>Prototype for #92.</b> A sitting over 16 of #85's disagreements (qwen3.8-27b-nvfp4 vs Sonnet 4.6 under production@4892d8d1b160, the third opinion as it was read). Verdicts are kept in memory only. Judge the <i>shape</i> of the sitting, not the data.
      </div>
      {current.key === "A" && <VariantSheet {...props} />}
      {current.key === "B" && <VariantWizard {...props} />}
      {current.key === "C" && <VariantSplit {...props} />}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-black">
        <button aria-label="previous variant" onClick={() => go(-1)}>◀</button>
        <span className="font-mono">{current.key}</span><span>{current.name}</span>
        <button aria-label="next variant" onClick={() => go(1)}>▶</button>
        <span className="text-xs opacity-60">alt+←/→</span>
      </div>
    </div>
  );
}
