/**
 * PROTOTYPE (throwaway page around it; this module is the liftable part).
 *
 * The shape of one card in an adjudication sitting, and the tally under
 * ADR 0004's adjudicated terms. Pure: no DOM, no fetch.
 */

export type ItemState = "pass" | "fail" | "uncertain";
export type Decision = "R" | "C" | "N";

export interface JudgeAnswer {
  state: ItemState;
  detail: string;
}

export interface Triage {
  verdict: Decision;
  confidence: string;
  what: string;
  decidingView: string;
  resolvedBy: string;
}

export interface PrototypeItem {
  id: string;
  exampleId: string;
  category: string;
  prompt: string;
  itemIndex: number;
  question: string;
  ref: JudgeAnswer;
  cand: JudgeAnswer;
  triage: Triage | null;
}

export interface Adjudication {
  decision: Decision;
  agreedWithTriage: boolean;
  note: string;
}

export const VIEW_ORDER = ["front", "back", "left", "right", "top", "bottom", "ortho_45", "ortho_45_bottom"] as const;
export const VIEW_LABEL: Record<(typeof VIEW_ORDER)[number], string> = {
  front: "Front", back: "Back", left: "Left", right: "Right", top: "Top", bottom: "Bottom", ortho_45: "45° down", ortho_45_bottom: "45° up",
};

export type Direction = "cand-fails" | "cand-passes" | "one-uncertain";
export function direction(it: PrototypeItem): Direction {
  if (it.ref.state === "uncertain" || it.cand.state === "uncertain") return "one-uncertain";
  return it.cand.state === "fail" ? "cand-fails" : "cand-passes";
}
export const DIRECTION_LABEL: Record<Direction, string> = {
  "cand-fails": "candidate fails · reference passes",
  "cand-passes": "candidate passes · reference fails",
  "one-uncertain": "one side uncertain",
};

export interface Tally {
  hard: number;
  decided: number;
  n: number;
  candFalsePass: number;
  refFalsePass: number;
  candFalseFail: number;
  refFalseFail: number;
  /** ADR 0004: the candidate's confirmed false passes must not exceed the reference's. */
  falsePassHolds: boolean;
  /** ADR 0004: the candidate's confirmed false fails must not exceed twice the reference's. */
  falseFailHolds: boolean;
  falseFailAllowance: number;
}

/** The bar's two adjudicated terms over the hard pass/fail flips; items with one side uncertain are outside the tally. */
export function tally(items: PrototypeItem[], decisionOf: (it: PrototypeItem) => Decision | null | undefined): Tally {
  const t = { hard: 0, decided: 0, n: 0, candFalsePass: 0, refFalsePass: 0, candFalseFail: 0, refFalseFail: 0 };
  for (const it of items) {
    if (direction(it) === "one-uncertain") continue;
    t.hard++;
    const d = decisionOf(it);
    if (!d) continue;
    t.decided++;
    if (d === "N") { t.n++; continue; }
    if (it.cand.state === "fail") { if (d === "R") t.candFalseFail++; else t.refFalsePass++; }
    else { if (d === "R") t.candFalsePass++; else t.refFalseFail++; }
  }
  return {
    ...t,
    falsePassHolds: t.candFalsePass <= t.refFalsePass,
    falseFailHolds: t.candFalseFail <= 2 * t.refFalseFail,
    falseFailAllowance: 2 * t.refFalseFail,
  };
}

/** "Careful look first": low-confidence triage and items without triage before the confident ones. */
export function carefulLookRank(it: PrototypeItem): number {
  if (!it.triage) return 0;
  const c = it.triage.confidence.toLowerCase();
  if (c.startsWith("low")) return 1;
  if (c.startsWith("med")) return 2;
  return 3;
}
