---
status: accepted
date: 2026-09-08
---

# The harness gates every judge dispatch on the serving condition

ADR 0005 made a judge call's **Serving provenance** readable and deliberately left it inert: a run under a broken condition still completed and still stored ratings, now labelled. This decides what the harness *does* about a violation. It gates — before the call, not after it — and it treats the two ways the condition breaks differently, because they differ in how long they last and whether they heal.

## The condition, and where it is read

One condition, **Uncontended serving**, read from one place: the cached gateway snapshot ADR 0005 already takes. `servingCount` and per-member `inflight` come out of the same payload, so the gate needs no sampler of its own — it is a predicate over the record.

It is evaluated in two halves at their natural moments:

- **N ≤ R** — the driver's configured concurrency against the serving replica count — as a pre-flight, so an overnight batch fails in the first second rather than after forty rows. This is the half the harness controls.
- **max per-replica `inflight` ≤ 1** — the condition itself — before each dispatch for the rest of the run. This is the only reading that sees a co-tenant and a lost replica alike.

The snapshot's TTL is **5 s**. Judge calls take 17–19 s and a dispatch slot opens roughly every 6 s per replica, so the cache prevents a thundering herd and nothing else; the freshness budget bounds how many calls can slip through a drop at a couple, which the rule below then declines to keep.

## What happens when it fails

**Concurrency is clamped, not refused.** The experiment executor and the stale re-rating batch runner run at `min(configured, R)`. `global.vlm_experiment_concurrency` becomes a ceiling the operator sets, not a claim about the pool. The argument is a live one: on 2026-09-08 the setting stood at 2 while the pool had returned to R=3 — a hand-set number drifting, this time in the safe direction, having drifted the unsafe way on 09-07. Deriving N from R removes the drift in both directions. Where R is **unknown** (Anthropic, no gateway), the run proceeds at the configured N and records unknown; a refusal is reserved for R = 0, which fails on the next call anyway.

**A lost replica halts the run; a co-tenant backs it off.** Both violate the condition, and #67 measured them as the same failure (3.3% item flips against 3.8%), but they are not the same event. A co-tenant clears in seconds and heals itself; a replica dies for hours. So contention holds the next dispatch until the snapshot shows headroom, bounded at **60 s** — three judge-call durations, past which it is not transient — and only then halts. A drop in R halts at once. Both drivers are already resumable (a row leaves the stale selection the moment its new rating is written; an experiment run tracks `remaining`), which is what makes halting cheap enough to be the honest answer: no work is thrown away, and you never get #67's outcome, where a run completed, looked normal, and silently produced numbers that were not comparable. Resuming is an operator action, not an automatic retry — the pool has to be fixed first, and a retry loop would only rediscover that.

**A rating taken under a violation is not written; an experiment result is.** Because the gate runs before dispatch, the small population the fog asked us to name — whatever was in flight at the drop, plus one TTL of dispatches — mostly does not come into being. What does is treated by what it is *for*: a production rating is an assertion about the corpus, so an untrustworthy one does not land, the row stays Stale, and the resumed batch re-rates it. An experiment result is an observation, and discarding it is worse than labelling it — the N=3/R=2 arm is precisely how #67 became evidence — so it is stored with its run marked, and no pair drawn from a marked run is trusted by accident. Either way the `llm_usage_events` stamp records the incident, so it stays auditable.

**Only the drivers we schedule are gated.** The experiment executor and the batch runner carry it. Production `vlm_eval` — the generation pipeline's rating and chat's own visual evaluation — records and does not gate: refusing a user's generation because a replica is busy trades a real product failure for a provenance nicety, and the row's stamp lets the export sort it out afterwards. This keeps the line #65 drew: code where an operator cannot act, rule or record where they can.

## Considered options

- **A start-time check alone.** Rejected as the one shape that could not have caught the event that motivated it: R dropped at 07:10 *during* a run that had started cleanly.
- **Refusing rather than clamping.** Rejected because it makes an overnight batch fail on a condition the harness could simply satisfy, and because the number it refuses on is hand-set and demonstrably drifts.
- **Clamping down mid-run instead of halting.** Rejected because a run whose N changed halfway has two halves that are not comparable to each other, which is the defect, not a mitigation of it.
- **Halting on a co-tenant too.** Rejected: chat's own visual evaluation shares `vlm_eval`, so the judge's product traffic could kill the judge's batch, and #65's cost analysis for chat still holds. Back-off enforces the same condition at a cost measured in seconds.
- **Leaving co-tenancy to #65's rule entirely.** Rejected in the other direction: once the snapshot is being read before every dispatch anyway, declining to act on what it plainly shows is a choice to keep a known-bad call.
- **A third admission term in the fine-tuning filter**, beside current-instrument and qualified-judge, for rows taken under a violated condition. Rejected because not writing the rating dissolves the question: there is no row in a state needing a third name. The filter keeps its two grounds.

## Consequences

- The fog patch ADR 0005 left open — what a rating taken under a violated condition is called — is closed by not creating one.
- Experiment runs gain a marked state that comparison tooling must respect; a marked run is evidence about the pool, never a term in a pair.
- Throughput can now degrade quietly under back-off, so back-offs are counted and surfaced in the run summary rather than only logged.
- The gate reads ADR 0005's snapshot, so it cannot land before that feed does. Sequencing: #71, then this, then the next corpus batch. The 125-example pair and the screen are thirteen minutes with an operator present and may still run under the hand-kept rule with R read before and after; the overnight batch is the run nobody can watch, and it waits.
