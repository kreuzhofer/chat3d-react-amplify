# #67 — the three-view follow-up, measured

Two measurements, because the first ran on a pool that had silently lost a replica. The infrastructure finding is
the larger one and is written up in its own section below.

## The judge's arms

**Candidate** — qwen3.8-27b-nvfp4 (thinking off), run `46d89f09`, the 142 examples at **concurrency 2 on the
two-replica pool** (N ≤ R; see below for why that matters), against control `62b4fa58` + the corpus rows.

| readout | result |
|---|---|
| 1. **Confinement** — items that reached no follow-up either way | **0 of 561 moved (0.0%)** |
| 2. Coverage — a deciding view was among those sent | 4 of 5 labelled items (n tiny) |
| 3. Correctness on truth-graded zoomed items | **n=5**: fixed 2 · broken 1 · held 2 · still wrong 0 |
| 4. Direction over the 17 items zoomed either way | fail→pass 3 · pass→fail 0; resolved 16 → 17 |
| 5. Labels created | **17 of 17** details name the view answered from |

**Reference** — Claude Sonnet 4.6 (thinking off), from experiment `0702d11a`; the Anthropic path never touched the
pool, so this arm was valid throughout.

| readout | result |
|---|---|
| 1. Confinement | 14 of 495 moved (2.8%) — inside its own floor of 1.6–2.9% |
| 2. Coverage | **18 of 18 (100%)** |
| 3. Correctness | **n=15**: fixed 5 · broken 2 · held 1 · still wrong 7 |
| 4. Direction over the 83 items zoomed either way | fail→pass 16 · pass→fail 8; resolved 83 → 83 |
| 5. Labels created | **56 of 56** details name the view answered from |

### Reading it

**Confinement holds**, which is what makes the rest legible: the candidate moved *nothing* outside the follow-up,
so every difference below is the follow-up's.

**The direction leans toward pass on both arms (19 fail→pass against 8 pass→fail), and that is the predicted
shape, not a leniency shift.** An angle that cannot show a feature produces a false *fail* — the judge looks, sees
nothing, and commits. Fixing the angle therefore turns fails into passes. Correctness agrees: 7 fixed against 3
broken across both arms. #66's failure mode looked different — a blanket move on *all* items, including ones no
follow-up touched — and confinement rules that out here by construction.

**n is small and the ticket said so in advance.** Five truth-graded items on the candidate, fifteen on the
reference. The correctness numbers are consistent with the design and too small to carry it alone; the load is
carried by confinement, by coverage, and by the mechanism being a straightforward "show it a view that can answer
the question".

**The labels the change creates are the durable part.** Every follow-up now names the view it answered from:

- reference (56): 45° down **27**, 45° up **16**, top **13**
- candidate (17): 45° down **11**, 45° up **6**

The **45° up view decided 22 of 73 follow-ups across both judges** — a view that could not be rendered at high
resolution at all until this change, and which the old keyword rule could never have picked. The old rule's
default was `ortho_45` and its only route to `top` was the literal word "top" in the question.

## The infrastructure finding

The first measurement failed its own confinement check: **24 of 492 items (4.9%)** moved on the candidate where
qwen should be bit-identical. It was not the revision. The `qwen3.8-27b-nvfp4` pool had dropped from **three**
replicas to **two** at 07:10:44 UTC that morning — dgx-manager traced it to a Hugging Face download on
dgx-spark-02 whose 8 `hf-xet` workers exhausted host memory and had the kernel OOM-kill the vLLM engine. GB10 is
**unified memory**: the replica held ~107 of 121.6 GiB, so a download buffering in RAM competes directly with model
weights, and "a download uses no GPU so it cannot conflict with a serving deployment" is false on this hardware.
(The deployment record's `error` field is misleading — it captures the container's first ERROR line, a benign
transformers warning, not the fatal one.)

Both survivors were verified byte-identical in build and recipe to 09-06 (`v0.27.2rc1.dev113+g5cecfc013`,
FlashInfer, MTP on with 5 draft tokens, CUDA graphs, `max_num_seqs` 8, `gpu_memory_utilization` 0.88), so the
replica count was the only changed variable. Three points on the same cluster, same hour, same everything else:

| requests in flight / replicas | items identical | responses byte-identical |
|---|---|---|
| N=3, R=3 (09-06) | 511/511 (100%) | 124/125 |
| **N=3, R=2** | **536/557 (96.2%)** | **35/142** |
| **N=2, R=2** | **561/561 (100%)** | **141/142** |

Only the row where N > R misbehaves. This model cannot run batch-invariant (#65: `VLLM_BATCH_INVARIANT=1` will
not start it), so two requests sharing a replica batch together, and batch composition depends on arrival timing,
which differs every run — there is no stable point to land on, which is why N=3/R=2 is *nondeterministic* rather
than merely *different*.

**The rule, stated narrowly on purpose.** N ≤ R is **necessary**. For qwen on our prompts it is also
**sufficient** — demonstrated at two different (N, R) pairs. It is **not** a general guarantee for this cluster:
dgx-manager's glm probe (32 identical requests, strictly sequential, single pool member — N=1, R=1) produced 5
distinct replies and 2 boolean flips, so satisfying N ≤ R did not deliver determinism there. MTP perturbs the
arithmetic on both models; what differs is whether that perturbation reaches the output, and a synthetic flat-blue
render asked "is this a pass?" sits close to a logit tie by construction in a way real geometry does not. The
wide-sounding version of this rule would mislead the next person to read it on a different model.

**#65's sole-tenancy rule is the special case.** A co-tenant and a missing replica are the same failure wearing
different clothes — both put two requests on one replica. #61 measured 3.3% item flips from a co-tenant; this
measured 3.8% from a lost replica. Stating it as N ≤ R tells you what to do when R changes; stating it as sole
tenancy does not.

Two gaps this leaves, both graduated to their own work: a run's provenance records no replica count (09-06 and
09-07 artefacts sit side by side looking comparable and are not), and nothing checks R before a judge run starts
— `GET /api/gateway` reports it, and the sampling machinery from #63 already exists.

## Reproduce

```
npx tsx prototypes/67-zoom-views/selfpair67.ts <arm A run> <arm B run>     # the (N,R) points
CONTROL_CANDIDATE=62b4fa58-… CONTROL_REFERENCE=6f6bb5c0-… CONTROL_REFERENCE_63=4d899046-… \
  npx tsx prototypes/67-zoom-views/grade67.ts <experiment id>
```

Runs: candidate `46d89f09` / `8faf4ffa` (concurrency 2), `3f613fa2` / `9ba22fa4` (concurrency 3, the bad pair),
reference in experiment `0702d11a`. Outputs: `grade67-conc2.txt`, `selfpair67.txt`, `selfpair67-conc2.txt`.
