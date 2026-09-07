# #66 — the parts inventory, measured

Experiment `b5fae9a5`, 57 examples (the 40 of #57's sheet + the 17 of #63's sample), both judges under
`parts-inventory-v1@…`, zoom on, concurrency 3, **sole tenant** (139 `llm_usage_events` in the window, all
`experiment / vlm_evaluation`; no chat, no codegen). 57/57 answered by each arm, 0 failures.

## The candidate moved enormously, and in one direction

qwen3.8-27b-nvfp4 (thinking off), 278 items on the 57 examples against its stored control:

| | |
|---|---|
| identical | 210 of 278 (**75.5%**) — floor is **0%** (511/511 in #61, sole tenant) |
| hard flips | **67 (24.1%)** |
| direction | **fail→pass 61 · pass→fail 6** |
| pass rate | **62.6% → 82.7%** (net +56 passes) |

On the graded items: the 69 — fixed 16, **broken 15**; the 26 — fixed 10, broken 3. *Every* one of those 31
changes on the 69 is fail→pass. ADR 0004's terms recomputed on the re-answered items:

| sheet | confirmed false passes | confirmed false fails |
|---|---|---|
| the 69 (#57) | candidate **20** vs reference 18 — **FAILS** (was 5 vs 19) | 2, allowance 28 (was 18) |
| the 26 (#63) | candidate **5** vs reference 1 — **FAILS** (was 2 vs 5) | 1, allowance 6 (was 10 vs 8) |

The false-fail problem that failed the bar in #63 is gone. It was traded for a worse false-pass problem.

**The gains are not distinguishable from the leniency.** All 10 fixes on the 26 are fail→pass, and so are all 3
breaks; the sheets are enriched with items qwen failed, so a blanket shift toward pass lands on the right answer
about three times in four by construction. Nothing here shows the inventory improved its perception.

## The reference moved the other way

Claude Sonnet 4.6 (thinking off), same 278 items: **86.3% identical**, 34 hard flips (12.2%, floor 1.6–2.9%),
**fail→pass 12 · pass→fail 22**, pass rate **73.0% → 70.1%** — stricter. On the 69: fixed 11, broken 4. Its
confirmed false passes on the 26 fall **5 → 1**. Both of the named false passes on the missing-lid case
(`3069c73d` i4 "visible gap between the two parts", i5 "circular hole on the lid's surface") flipped to fail,
exactly as the ticket predicted: `bodyCount 1`, `"Case body: present. Lid: ABSENT."`

## Why it backfired on the candidate

`698b0276` — a Gridfinity bin Daniel adjudicated as a **solid block** ("a flat top surface inside the rim at
almost the rim's height, no inner wall faces, no shadowed floor"). qwen's inventory:

> `"openings": "Main bin body: hollow, open at the top (visible in top view and 45° down view). The interior
> cavity is visible."`

The same perception error it has always made — now written **first, as a premise**. Every item about the cavity
then passes, including "Is the interior of the bin hollow and open at the top?", which it used to fail correctly.

**The inventory does not fix perception; it launders a perception error into a premise.** That is consistent with
#57's finding that qwen's residual errors are misreadings of large, plainly visible features and that "the prompt
lever is exhausted for it" — the inventory is a prompt lever, and it reached the reference (whose errors are
reasoning about parts that are not there) but not the candidate (whose errors are seeing).

## Inventory shapes written

Both judges wrote one on all 57. bodyCount histograms: qwen `{1:32, 2:18, 3:4, 6:3}`, Sonnet `{1:29, 2:18, 3:6,
5:1, 6:3}`. Named a part ABSENT: qwen 13 of 57, Sonnet 7 of 57. Called a body hollow/open: qwen 50, Sonnet 54.

## Reproduce

```
CONTROL_CANDIDATE=62b4fa58-67d6-48be-b942-ae99f5bd859a \
CONTROL_REFERENCE=6f6bb5c0-7e16-414f-bf39-59743ce8fd7f \
CONTROL_REFERENCE_63=4d899046-96f6-45c3-bd94-8388443dcdad \
npx tsx prototypes/66-parts-inventory/grade66.ts b5fae9a5-ffd5-4819-922b-c26a804775ea
npx tsx prototypes/66-parts-inventory/direction66.ts
```

Outputs on the branch: `grade66.txt`, `direction66.txt`.

---

# v2 — the inventory as evidence for absence only

Daniel's call after v1. One rule changed, nothing else: the inventory may take an item **away** but never grant
it; an item passes only on what the views show, and the judge is told in so many words to contradict its own
inventory when they disagree. Experiment `1668b1c0`, same 57 examples, same judges, sole tenant.

| 278 items | v1 | **v2** | control |
|---|---|---|---|
| candidate identical | 75.5% | **76.6%** | floor 0% |
| candidate fail→pass · pass→fail | 61 · 6 | **60 · 4** | — |
| candidate pass rate | 82.7% | **83.1%** | 62.6% |
| reference identical | 86.3% | **88.8%** | floor 1.6–2.9% |
| reference fail→pass · pass→fail | 12 · 22 | **10 · 17** | — |
| reference pass rate | 70.1% | **71.2%** | 73.0% |

ADR 0004 recomputed: the 69 — candidate false passes **20 vs the reference's 19, FAILS** (false fails 4, allowance
30); the 26 — **7 vs 2, FAILS** (false fails 1, allowance 6). Slightly *worse* on the term that matters than v1.

**The rule did not reach the candidate.** Governing what the judge may *do* with the inventory moved 1 item in 278.

## What v2 proves, and how it corrects v1's reading

v1's reading — "the inventory launders a perception error into a premise" — is **wrong**, and v2 is the
experiment that shows it. On `698b0276`, the bin adjudicated as a solid block, under v2:

> `"openings": "Main bin: hollow, open at the top (visible in top view and 45° down view showing the interior
> cavity and floor)."`
> item 5 · **pass** · `"Top view and 45° down view both show the interior cavity of the bin with a visible floor,
> confirming the bin is hollow and open at the top."`

The item obeys v2 exactly: its evidence names the views, not the inventory. And it is still wrong. The inventory
and the item are not premise and conclusion — they are **two expressions of one misreading**. Cutting the link
between them changes nothing because the link was never load-bearing.

What the inventory *does* do to this judge is shift it ~20 points toward pass whatever it is then allowed to do
with it (v1 +56 net passes, v2 +57). Asking it to take stock of structure primes it to assert structure.

## The verdict

**Not adopted, either version.** The candidate's residual errors are perception on large, plainly visible
features, and a prompt-side instrument cannot reach perception — #57 concluded this from the error classes; #66
measures it twice, the second time with the procedural channel removed. The prompt lever for this judge is
exhausted, and this is the evidence.

The reference moved the other way under both versions — stricter, its confirmed false passes on the 26 falling
5 → 1 (v1) and 5 → 2 (v2), both named false passes on the missing-lid case flipping to fail. A parts inventory is
a real lever **for a judge whose errors are about parts that are not there**. Re-making the reference is its own
ticket (the map: a reference change needs its own self-pair), not this one.

What remains for qualification is a lever that changes what the judge **sees**, not what it is told — which is
what [#67](https://github.com/kreuzhofer/chat3d-app/issues/67) is: the zoom follow-up's angle pick.
