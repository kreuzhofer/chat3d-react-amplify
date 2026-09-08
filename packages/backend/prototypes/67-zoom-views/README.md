# PROTOTYPE — wayfinder #67: the zoom follow-up's angle pick

Record for [issue #67](https://github.com/kreuzhofer/chat3d-app/issues/67) (map #45). The change itself is in
`src/` on this branch (`wayfinder/67-zoom-views`); this directory holds the evidence behind the decision and the
measurement of it.

## The decision, and the evidence for it

The follow-up picked ONE view from the item's wording by keyword (`"face"` fired on front; the word `"top"` was
the only route to the top view; default `ortho_45`). Both adjudicated sheets record a **deciding view** per item
(Fable's reading in the third opinion — triage-grade, not Daniel's arbitration, but a mechanical observation, and
n = 92 across two independent sheets). Scoring each strategy by whether its pick is among the deciding views:

| strategy | picks a deciding view | images |
|---|---|---|
| the keyword heuristic in production | **39/92 (42%)** | 1 |
| feature classes, as #67 sketched them | 55/92 (60%) | 1 |
| constant `top` | 54/92 (59%) | 1 |
| constant `45° down` | 49/92 (53%) | 1 |
| **top + 45° down** | 76/92 (83%) | 2 |
| **top + 45° down + 45° up** | **84/92 (91%)** | 3 |
| top + 45° down + front + 45° up | 87/92 (95%) | 4 |
| all eight | 92/92 (100%) | 8 |

**The production rule is worse than always sending `top`.** And no one-view rule gets past about 60%: the deciding
view is item-specific and often plural — `top` decides 54 of the 92 and `45° down` 49, with little overlap. So the
problem was never which single view to pick; it was picking one.

**Decided (Daniel, 2026-09-07): the fixed set `top + 45° down + 45° up`** — 91% coverage, three images, no
question-reading left to get wrong. Asking the judge which views to enlarge was declined: its ceiling is 9 points
above this, it costs a call per uncertain item, and it leans on exactly the spatial reads #66 found unreliable.

## Two defects found alongside, fixed here

- **The 45° up view could never be zoomed.** `DEFAULT_HIGHRES_ANGLES` rendered seven angles and omitted
  `ortho_45_bottom`, so the follow-up could not be shown one of the eight views the judge is promised — and 13 of
  95 adjudicated items name it as deciding. All eight are rendered now. This costs nothing: every high-res view was
  *already rendered on every evaluation* and six of seven thrown away; only what is sent changes.
- **A resolved item dropped the angle.** On success the item was rewritten as `{question, pass, detail}`;
  `zoomFollowUp` was stamped only on the failure paths. No stored run could say which view answered an item, which
  is why #61's angles were unrecoverable when a container restart took the logs. Items now carry `zoomViews`
  whatever the outcome, and the follow-up's instrument makes the judge **name the view it answered from**, so the
  next run's deciding view is readable off the row instead of guessed.

## The instrument moves

The follow-up's view set is now part of the procedure hash (`visual-eval-instrument-id.service.ts`): two runs that
enlarge different views are not the same instrument, and a hash cannot be forgotten the way a constant can
(ADR 0003). With the follow-up template's rewording, production's id goes

    production@22e0f10b0505  →  production@4892d8d1b160

so **every stored rating reads Stale while this branch is deployed**. Staleness is computed by comparing the
stored id to the current one, never written, so reverting the branch restores the corpus exactly.

## The measurement (stated before running, as the ticket asks)

**Population.** The revision touches only items that reach a follow-up. The main call's instrument text and schema
are byte-identical, so the first pass is unchanged. Controls (all under `production@22e0f10b0505`) carry
**53 + 15 zoomed items for Sonnet and 16 for qwen** — that is the whole available n, and it is small.

**Set.** The 125 (the map's fixed set, the selections behind run `62b4fa58`) + the 17 of #63's sample = 142
examples, both judges, sole tenancy by rule (#65). Controls: qwen `62b4fa58` + the corpus rows; Sonnet `6f6bb5c0`
+ `4d899046`.

**Readouts, in the order they decide anything:**

1. **Confinement.** Items that never went to a follow-up must not move. qwen is deterministic as the pool's sole
   tenant (#61: 511/511), so anything but 100% identical there means the revision leaked out of the follow-up.
   This is the precondition for reading anything below it.
2. **Coverage.** For zoomed items carrying a deciding-view label, is it among the views sent? 42% → 91% by
   construction — a check that the code does what the design says, not a discovery.
3. **Correctness.** Zoomed items intersecting the 84 truth-graded ones: right/wrong before and after. **n is very
   small** (10 of Sonnet's follow-ups on the #57 sheet carried a recorded angle). State n; do not over-read it.
4. **Direction.** On all zoomed items: fail→pass against pass→fail, and the uncertain-resolution rate. #66's
   lesson: a change that merely resolves more items toward pass is a leniency shift wearing an improvement's
   clothes.
5. **The label set this creates.** Every zoomed item now stores the views sent and a detail naming the view
   answered from — the labels whose absence made this ticket guess in the first place.

**Adopt if** (1) holds, (3) does not get worse, and (4) shows no one-directional shift beyond the floor. Coverage
alone is not adoption: #66 adopted nothing on a mechanically better instrument that made the judge worse.
