# PROTOTYPE — wayfinder #66: a parts inventory before the checklist

Throwaway record for [issue #66](https://github.com/kreuzhofer/chat3d-app/issues/66) (map #45). The variant
instrument and its measurement are here; the harness change that lets a variant carry its own answer shape is
in `src/` on this branch (`wayfinder/66-parts-inventory`).

## The lever

Both judges' confirmed errors turn on the same prior act — taking stock of what is in the scene before being
asked whether a feature of it is correct.

- **The reference's 19 confirmed false passes on the 125** (#57) mostly credit a part that is *not there*: a lid
  never generated, a second cylinder missing, a second leaf missing, walls that are not there. Once a part is
  missing, every item about it passes. Three more read a cavity seen in the 45° **up** view as "open side facing
  upward" on an upside-down case.
- **The candidate's 10 confirmed false fails on the corpus sample** (#63) — the ones that failed the bar by two —
  are the mirror image: six *deny a cavity that is there* (an open shelled box read as a solid block ×2, a
  U-channel as a block, a channel plus a plate as one plate ×2, a bowl's opening as a floor). Three more are
  orientation words on a flat-lying plate ("bottom edge", "top of the plate"), which the map's fog calls
  criteria-side, not judge-side; one is a fillet reading.

So the inventory has to catch the cavities the judge then denies, not only the parts that are missing.

## The variant

`parts-inventory-v1` = production's instrument **plus exactly one section** (built by `build-instrument.ts` from
`PRODUCTION_INSTRUMENT_TEMPLATE`, so everything else is a byte copy — the discipline of #35). Three questions, in
the order the errors need them:

1. **bodyCount / bodies** — how many separate solid bodies; each named; apart with a gap, or touching. *Two shapes
   that touch along a face or an edge are ONE body.*
2. **partsNamed** — for each part the request names: present, or ABSENT. *A whole part cannot be hidden by
   occlusion the way an interior feature can; if no view shows it, it is ABSENT.*
3. **openings** — each body solid, hollow (shelled) or an open profile; which view shows the opening and which way
   it faces, *read from the labelled views: an opening in the bottom or 45° up view faces DOWN.*

Then the rule that converts an inventory fact into an answer: **an item about a part the inventory found ABSENT
fails.**

`instrument.txt` is the variant, `instrument.production.txt` the base; `diff` them to see only the section above.

## The harness change (in `src/`, not throwaway)

A variant could change the instrument's *text* but not the shape of the answer — and on vLLM the response schema
**is** the decoding grammar, so a template asking for an inventory could never get one: the key had no room. A
judge-prompt variant now carries a `responseShape`, stored on the run (`experiment_runs.judge_response_shape`).

The `inventory` shape declares its object **before** `checklist` in `properties` and `required`. That is the whole
mechanism: **schema key order is generation order**, so the inventory is written first and every item is answered
with it already in the judge's own context. The shape is hashed into the Instrument id, so two variants differing
only in the answer's shape are two instruments. `production@22e0f10b0505` is unmoved (verified; goldens pass).

## The measurement (stated before the run)

The 69 (#57) and the 26 (#63) were adjudicated by Daniel, so his verdict **already fixes the correct answer** on
each: 84 items with a truth, across 57 examples (40 + 17, disjoint). Re-answering them under the variant grades
directly — no new adjudication.

- **BENEFIT** — per judge on the 84: fixed (wrong→right), broken (right→wrong), held, still wrong; then ADR 0004's
  two terms recomputed per sheet (candidate's confirmed false passes ≤ the reference's; confirmed false fails ≤ 2×).
- **COST** — every item on the 57 against the stored control (qwen: run `62b4fa58` on the 40, the corpus rows on
  the 17; Sonnet: run `6f6bb5c0` on the 40, run `4d899046` on the 17): identical %, hard pass↔fail flips, against
  each judge's floor (Sonnet 1.6–2.9%; qwen 0% as sole tenant). Flips outside the 84 have no truth attached and are
  reported as **unadjudicated**, never as a gain.
- **INVENTORY** — what the judge wrote first: the body-count histogram, how often it names a part ABSENT or a body
  hollow/open, and where its own checklist answer contradicts it.

**What the 84 is not:** a qualification. These are old disagreements re-answered; a new instrument makes fresh ones
elsewhere. Qualification is the 125 under the new id, then the batch and its spot check (ADR 0004).

The arithmetic that decides it: on the #63 sheet the candidate needs confirmed false fails **≤ 8**. It has 10, of
which ~6 are the cavity class the inventory targets and 3 are the criteria-side orientation items it cannot fix.
It needs 2, without breaking answers that were already right.

## Files

- `build-instrument.ts` — builds `instrument.txt` from production's template. `npx tsx prototypes/66-parts-inventory/build-instrument.ts`
- `instrument.txt`, `instrument.production.txt` — the variant and its base.
- `grade66.ts` — the measurement above. `CONTROL_CANDIDATE=<run> CONTROL_REFERENCE=<run> CONTROL_REFERENCE_63=<run> npx tsx prototypes/66-parts-inventory/grade66.ts <experiment id>`
- `exp66.txt` — the experiment id.

## Run conditions

Sole tenancy by rule (#65): nothing submitted in chat while the judge arm is on; `llm_usage_events` read
afterwards and must show no other tenant. Concurrency 3 on the three-replica pool.

**Found on the way (2026-09-07):** Docker could not reach the DGX LAN at all — the Colima VM's default route was
the user-mode NAT (`eth0 → 192.168.5.2`), which has no path to `192.168.44.0/24`; `col0` reached the gateway (200)
where `eth0` did not (exit 7). Every vLLM provider was ECONNREFUSED from the backend container while the internet
was fine, so the first start wrote 57 empty rows before it was cancelled. A Colima restart fixed it. Worth
recognising by its signature: `NoOutputGeneratedError` on every example with `ECONNREFUSED` beneath it, Anthropic
unaffected.
