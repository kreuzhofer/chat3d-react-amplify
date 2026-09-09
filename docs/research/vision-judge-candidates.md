# Vision-judge candidates: what the cluster has tested against what the public lists say

Research note for [issue #97](https://github.com/kreuzhofer/chat3d-app/issues/97) (child of map #45), feeding the screen in [#98](https://github.com/kreuzhofer/chat3d-app/issues/98). Written 2026-09-09. Two lists reconciled: (1) what has actually run on the Sparks and on the token factory for this project, from dgx-manager and from the app's own records; (2) the public open-weights VLMs, from model cards, configs and the boards they cite, read on 2026-09-09. The bar is [ADR 0004](../adr/0004-local-judge-qualifies-by-adjudicated-parity.md); the map's standing preference is a **local** judge, so the two rankings at the end are kept apart. Every number carries its source in §7; where a card is silent the cell says so rather than guessing.

## 0. The answer in one screen

- **Tested here:** exactly four open vision models have answered judge calls on this hardware — `qwen3.8-27b-nvfp4` (the qualified incumbent), `glm-5.3-flash` (two Sparks, lost the #61 screen, temperature-0 unstable), Qwen3.8-27B BF16 and Muse Glimmer 30B (both only under the superseded #52 harness), plus Gemma 4 26B-A4B under the pre-instrument scalar rubric in April. dgx-manager confirms image input on the first two only, and reports no failed VLM loads because nothing else was ever tried; its warning is that on GB10 (sm_121a, arm64) **kernel coverage, not memory, is what breaks a deployment**.
- **Served there:** the account's token factory has **six** ids that take an image today — `zai-org/GLM-5.3-Flash`, `moonshotai/Kimi-K2.6`, `moonshotai/Kimi-K3`, `openbmb/MiniCPM-V-4_5`, and, typed text-only but verified by probe, `google/gemma-3-27b-it` and `MiniMaxAI/MiniMax-M3`. The four ids in Daniel's screenshot that the account lacks are gone: Cosmos3-Super-Reasoner and Qwen2.5-VL-72B-Instruct were **deprecated 2026-08-31**; qwen3-vl-32b and Nemotron-Nano-V2-12B-VL are in no current Nebius document.
- **The public boards are weaker than they look.** The OpenCompass OpenVLM feed is frozen at 2025-09-17 and the MMMU board at 2025-11; neither holds a 2026 model. The current signals are the Arena vision board (2026-08-27; preference votes, top open entries glm-5.3-flash, kimi-k2.6, **gemma-4-31b**, qwen3.8-27b within ~20 Elo) and OCRBench v2 (2026-06; **Nemotron 3 Nano Omni 30B-A3B** leads open models). No board measures multi-view geometric checking; the 172-item adjudicated gold is the only instrument that does.
- **Shortlist for #98** (§6): locally, six one-Spark candidates the idle spark-01 can take one at a time — **Gemma 4 31B, Qwen3-VL-32B-Instruct (FP8), Cosmos3-Super reasoner, Nemotron 3 Nano Omni 30B-A3B (NVFP4), Muse Glimmer 30B (NVFP4), InternVL3.5-38B** — with GLM-4.6V (FP8, two Sparks) as the only two-node candidate worth the pool's R=2; hosted, **Kimi K2.6, GLM-5.3-Flash, MiniMax-M3, gemma-3-27b-it, MiniCPM-V-4_5** at under $10 for the whole screen, Kimi K3 excluded as the triage model. Kimi K3 / K2.6 / MiniMax-M3 / Qwen3.5-397B / Qwen3-VL-235B / GLM-5.3-Flash-at-FP8 are hosted-only or two-node by size; Pixtral Large is research-licensed; Llama 4 has no fit or quant story and a 5-image test ceiling.

## 1. What has actually run here (the cluster half)

### 1.1 dgx-manager's answer (session bridge, 2026-09-09)

Asked by `SendMessage` to `bridge:session_01DQKj8QgCYAjSQ92YMHQRhz` at ~18:55Z for a table of every vision model deployed or tested on the Sparks, with recipe and what was ruled out. Reply received the same evening, quoted verbatim below; nothing was deployed for it. (Two of its rows disagree with chat3d's own usage log — see §1.2.)

> Plainly, up front: we have verified image input on exactly TWO models — `qwen3.8-27b-nvfp4` and `glm-5.3-flash`. Everything else is either the same architecture run for text only, or not vision-capable at all. There is no third candidate we have tested.

| # | model | vision verified as served? | quant | vLLM build / image | backend + MTP | thinking | nodes + footprint | status | why not | deployment id(s) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `unsloth/Qwen3.8-27B-NVFP4` (`@dgxrun/qwen3.8-27b-nvfp4`) | YES — measured | NVFP4 (vision tower unquantized) | `v0.27.2rc1.dev113+g5cecfc013` / `ghcr.io/spark-arena/dgx-vllm-eugr-nightly:2026081501` | FLASHINFER; MTP on, nst=5 | optional — `enable_thinking:false` works per request; recipe pins `reasoning_effort=medium` | TP=1 per Spark, ×3; ~103.5 GB resident at gmu 0.88 (weights ~22 GB, rest KV; mml 262144) | serving now, R=3 | — | `cmtpeql4y1etk2auhbk9668ry` (sp-04), `cmtpsaud71whj2auh0k27ynki` (sp-03), `cmtsqj5lz5qd42auh8vvrfn03` (sp-02) |
| 2 | `LibertAIDAI/GLM-5.3-Flash-NVFP4` (`@dgxrun/zai-glm-5.3-flash-libertai-nvfp4-2x`) | YES — measured | NVFP4 | same build/image | FLASHINFER; MTP on, nst=4 | optional — `enable_thinking:false` honoured; recipe default `reasoning_effort=high` | TP=2 (two Sparks); gmu 0.87, mml 327680; per-node footprint not separately measured | stopped, row kept (~25 min restart) | — | `cmtmtc64857kx2auheovbmrla` |
| 3 | `Qwen/Qwen3.8-27B` (`@dgxrun/qwen3.8-27b-bf16`) | architecture yes, NEVER EXERCISED | BF16 | same build/image | FLASHINFER; MTP on, nst=5 | optional; pinned medium | TP=1; ~104 GB resident, weights 51.7 GB | deleted after use | ran 33.5 h of SWE-bench — text only, no image ever sent | `cmtpl47n71n3z2auhm0c2124v` (deleted) |
| 4 | Qwen3.8-27B SQL LoRA, merged | architecture yes, never exercised | BF16 | same build/image | FLASHINFER; MTP on | optional; pinned medium | TP=1; 52 GB weights | tested-then-removed | SQL text eval only | `cmtsg22n75d2p2auh8ykhd0ze` (deleted) |
| 5 | `Qwen/Qwen3.8-Flash-Next` | not deployed — config declares a 27-layer vision tower | NVFP4 (`RadixArk`, 126 GB staged on NFS) | would need `:2026090501` (vLLM `main`) | n/a | n/a | TP=2 minimum; 180 B params / 335 GB BF16, ~63 GB/rank at NVFP4 | researched only, weights staged | never launched — see below | — |
| 6 | GLM-5.2 family (`QuantTrio/GLM-5.2-Int4-Int8Mix`, `CosmicRaisins/GLM-5.2-AWQ-INT4-15pct`) | NO — text-only, no vision tower | Int4/AWQ | DCP image | — | — | TP=4 (all four Sparks) | ran extensively, now stopped | not a VLM | several, superseded |
| 7 | ~60 other models historically launched (Qwen2.5/3/3.5/3.6, gemma-3, gemma-4, Nemotron-3, gpt-oss, mistral, phi-4, DeepSeek distills…) | no vision testing on any | mixed | mixed | mixed | mixed | mixed | historical | most ran on the RTX box or the older sparkrun path; several are VLMs (gemma-3/4) but image input was never sent | many |

> (a) Vision models we could NOT load on a Spark: none — because we never tried one beyond the two above. No failed VLM loads to report. The nearest thing is Qwen3.8-Flash-Next: not attempted, and the blockers found in research were correctness, not fit — open sm_121 bugs in its sparse-attention indexer (greedy non-determinism above `indexer_budget`, `persistent_topk` returning wrong values, all fixes unreviewed) plus multi-node long-context wedges around 95–100 K tokens.
>
> (b) Of your candidate list, what I would consider deployable on 1–2 Sparks — with a caveat that matters more than the arithmetic. On size alone, at 4-bit against ~105 GB usable per node: MiniCPM-V-4.5, Nemotron-Nano-V2-12B-VL, gemma-3-27b-it, Cosmos3-Super-Reasoner 33B, Qwen3-VL-32B all fit one Spark comfortably; Qwen2.5-VL-72B and InternVL3.5 (size-dependent) fit one at 4-bit; Llama 4 Scout, Pixtral Large and Qwen3-VL-235B-A22B would need TP=2 and are marginal. Kimi-K2.6/K3 — no. The caveat: size is not what stops us here. These are GB10, sm_121a, arm64. Every model we run needs kernels that work on that arch, and this week alone we hit a Marlin MoE hang, an FP8 path broken on sm_120, an NVFP4-KV lever that fails silently, and a MoE backend that faults on sm_121. I would treat "fits" as necessary and nowhere near sufficient, and I would not rank that list without first checking each one's architecture against in-tree vLLM support and known sm_121 issues — which is a research task, not a deploy.
>
> (c) Free capacity right now: dgx-spark-01 is idle. spark-02/03/04 are the serving `qwen3.8-27b-nvfp4` pool (R=3, ten production purposes). So one Spark free — enough for a TP=1 VLM trial, not for TP=2 without taking the pool to R=2.

### 1.2 What chat3d's own records say, and where they disagree with §1.1

Two records cross-check the table above: the gateway's own deployment table (`GET http://192.168.44.14:4000/api/deployments`, read 2026-09-09 18:53Z, ten rows — it keeps stopped rows but not deleted ones) and chat3d's `llm_usage_events` joined to `llm_models` on `purpose = 'vlm_evaluation'` (read 2026-09-09).

**Every vision-capable model that has answered a judge call from chat3d, by served name:**

| served name (chat3d row) | model | provider / host | judge calls | first–last | quantisation | what happened |
|---|---|---|---|---|---|---|
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | Bedrock, then Anthropic API | 22,623 + 2,929 | 2026-03-09 → 09-09 | — | the reference (ADR 0004) |
| `qwen3.8-27b-nvfp4` (+ `qwen38-nvfp4-spark` alias, pinned rows, cachetest) | `unsloth/Qwen3.8-27B-NVFP4` | vllm-dgx-14 pool, spark-02/03/04, TP=1 each | 6,519 + 1,254 + 277 + 170 + 102 + 86 + 43 + 1 | 2026-08-31 → 09-09 | NVFP4 | **incumbent, qualified** under `production@4892d8d1b160` (#85, #87) |
| `qwen3.8-27b-bf16` | `Qwen/Qwen3.8-27B` | vllm-dgx-14, spark-01, TP=1 | 133 | 2026-08-29 → 09-02 | BF16 | four-judge baseline (#52): 81.0% identical, 7.4% hard flips, **134 s/example** — slowest; row stopped |
| `glm-5.3-flash` (thinking on, then off) | `LibertAIDAI/GLM-5.3-Flash-NVFP4` | vllm-dgx-14, spark-02+03, **TP=2** | 250 + 876 | 2026-09-02 → 09-06 | NVFP4 | #52 baseline 84.3% identical / 7.0% flips at 44 s; qualification screen #61 alongside qwen; **temperature 0 not reproducible on this deployment** (MTP suspected, #59); stopped, row kept, ~25 min restart |
| `meta-muse-glimmer-30b-bf16` | `meta-models/Muse-Glimmer-30B` | vllm-dgx-14 (deployment row no longer in the table) | 125 | 2026-09-02 → 09-03 | BF16 | #52 baseline: closest to Sonnet on scores and gate (82.2% identical, 8.8% flips, mean abs Δ 0.976, 108 s/example under the old harness); never re-screened under the current instrument |
| `google/gemma-4-26B-A4B-it` (three rows) | Gemma 4 26B-A4B | `vllm-gx10*` = 192.168.44.36 = dgx-spark-01 | 259 + 242 + 198 | 2026-04-08 | W4A16 | pre-instrument era; roadmap records **0.57 Spearman** with Sonnet and two calibration preambles; superseded by the item-based instrument |
| `moonshotai/Kimi-K3` | Kimi K3 | Nebius token factory | 114 | 2026-07-28 → 09-09 | (hosted) | mostly `adjudication_triage` (#93, Daniel's choice) plus early vlm_eval trials; a party to sittings cannot triage them (#98) |

Not in the usage table but on the gateway or in the model rows: `Qwen/Qwen3.6-27B-FP8` on spark-01 (row flagged vision-capable; used for codegen only), `nvidia` Nemotron 3 Nano/Super/Ultra (text-only variants, `supports_vision` flag unreliable — `docs/oss-model-evaluation.md` §"VL?"), `Intel/Qwen3.5-397B-A17B-int4-AutoRound` (text row), `openai/gpt-oss-120b` (text-only). The M1 sweep note records the physics rule the cluster has used so far: "TP2 across two Sparks does not add per-stream speed; it buys capacity to fit a stronger model" and "dropped on physics/fit (not tested): dense ≥ 27B FP8 (~14 tok/s), MiniMax-M2.x, Qwen3.5-122B/397B, step-3.7-flash (exceeds 121 GB even on 2× Spark)" (`docs/local-model-strategy.md` §3).

**The recipes the gateway holds today** (from the `config.dgxrunRecipe` blob of each row):

| recipe | model | container | attention / MTP | thinking as served | TP | vram est./actual (MiB) |
|---|---|---|---|---|---|---|
| `@dgxrun/qwen3.8-27b-nvfp4` (3 running + 2 failed-launch rows) | `unsloth/Qwen3.8-27B-NVFP4` | `ghcr.io/spark-arena/dgx-vllm-eugr-nightly:2026081501` (vLLM `v0.27.2rc1.dev113+g5cecfc013`) | FlashInfer (FLASH_ATTN for the ViT), MTP on 5 draft tokens, `VLLM_FLASHINFER_AUTOTUNE_CACHE_DIR` shared on the newest row (#86) | `reasoning_effort=medium` pinned; `enable_thinking:false` per request works | 1 | 105,864 / 104,499–104,730 |
| `@dgxrun/qwen3.8-27b-bf16` | `Qwen/Qwen3.8-27B` | same image | same | same | 1 | 105,864 / — (stopped) |
| `@dgxrun/zai-glm-5.3-flash-libertai-nvfp4-2x` | `LibertAIDAI/GLM-5.3-Flash-NVFP4` | `vllm-glm53-flash-sm121:probe` (local day-0 build, spark-02+03 only) | `--moe-backend marlin --kv-cache-dtype fp8_e4m3 --enforce-eager`, MTP 4 draft tokens, block-size 2304 | `reasoning_effort=high` pinned, off per request | **2** (`cluster_only`) | — |
| `@dgxrun/qwen3.8-27b-nvfp4-rtx` | same NVFP4 | `rtx-vllm:v0.28.0` on aihost01 (RTX 5090, 32 GB) | MTP 3 | medium | 1 | 27,716 (stopped, host offline) |

**Discrepancies with §1.1, left open rather than resolved here.** chat3d's usage log has judge calls with images on three models dgx-manager reports as never having received an image or does not list: (i) `qwen3.8-27b-bf16` via the gateway, 133 `vlm_evaluation` calls 2026-08-29 → 09-02 — the #52 baseline run `8375fef6` (123 examples, 134 s/example) — while dgx-manager's row 3 says "no image ever sent" and names a different, deleted deployment id than the one the gateway still holds (`cmtmvb5ud5azz2auhkj56zyd6`, created 09-04); (ii) `meta-muse-glimmer-30b-bf16` via the gateway, 125 calls 09-02 → 09-03 (#52 run `794927ab`), absent from dgx-manager's table and from the gateway's deployment list — probably deployed by another path (sparkrun, or Daniel) and deleted; (iii) `google/gemma-4-26B-A4B-it` on spark-01 (the `vllm-gx10*` providers, 699 calls on 2026-04-08), which dgx-manager's row 7 files as "image input never sent". The likeliest reading is that dgx-manager's table covers what *it* launched and exercised, not every process that ever answered on port 8000 of a Spark; the point for #98 is that the **four-judge baseline's Muse and Qwen-BF16 numbers are real measurements on this hardware**, under the old harness, and the recipes behind them are not on record.

Reading: the cluster has served **four open vision models as judges** (Qwen3.8-27B in two precisions, GLM-5.3-Flash, Muse Glimmer 30B) plus Gemma 4 26B-A4B in the pre-instrument era; image input is verified by dgx-manager on two. Everything else in §2 is **untested here**, and dgx-manager's caveat (b) — sm_121a/arm64 kernel coverage, not memory, is what breaks deployments — applies to every row of it.

### 1.3 The Spark envelope, for the fit column

Each Spark reports 124,546–124,610 MiB (`/api/nodes`); the incumbent recipe runs at `gpu_memory_utilization 0.88` and lands at ~104.5 GiB actual for a 27B NVFP4 model with a 262k-token `max_model_len`. For the fit estimates below: **~105–110 GB usable per node**, weights + KV + vision-tower activations; the judge prompt is eight PNG views plus a ~9K-token prompt, so KV need is small (tens of GB at most with a 32–64k `max_model_len`) and weights dominate. TP=2 across two Sparks costs per-stream speed (Super TP2 = 25 tok/s; the glm pair ~21 tok/s decode) and, on the gateway, the pair cannot be pooled with a single-node replica of the same name. A model needing four Sparks takes the whole pool.
## 2. The public list: open-weights VLMs as of 2026-09-09

Per model: HF id, size, licence, how images are handled, whether thinking is a switch, quantised footprint, vLLM status, the card's scores on the benchmarks closest to reading a labelled engineering view (DocVQA, ChartQA, OCRBench, MMMU, MathVista, RealWorldQA, CountBench, VSI-Bench/ERQA for spatial), and the Spark arithmetic of §1.3. On-disk sizes are safetensors totals from the HF API. "Not reported" means the card does not carry it. Fit is weights + KV only; dgx-manager's kernel caveat is not folded in.

### 2.1 Qwen (Alibaba) — Apache-2.0 throughout except the two largest

Since Qwen3.5 (2026-02) **every dense and small-MoE Qwen checkpoint is natively multimodal**: `Qwen/Qwen3.8-27B`'s `config.json` declares `Qwen3_5ForConditionalGeneration`, `language_model_only: false`, a 27-layer SigLIP-shaped ViT (hidden 1152, patch 16, spatial merge 2 → one token per 32×32 px, no DeepStack) — so the incumbent *is* the family's current VLM at this size, and **no `Qwen3.5-VL*` / `Qwen3.8-VL*` checkpoint exists** (author search 2026-09-09). Thinking is a switch (`enable_thinking`, plus `reasoning_effort` xhigh/medium/low on 3.8). The vLLM recipe for Qwen3.8-27B (0.17.0+) says plainly "**Text serving is what this recipe covers and what has been verified**" — the vision path on GB10 is verified only by this project's own runs.

| model | HF id(s) | params | licence | vision / resolution | thinking | quantised footprint | vLLM | card scores relevant to reading drawings | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **Qwen3.8-27B** (incumbent) | `Qwen/Qwen3.8-27B`, `-FP8`, `unsloth/Qwen3.8-27B-NVFP4` (vision tower, GDN projections, MTP head left unquantised), `nvidia/Qwen3.8-27B-NVFP4` (2026-09-04) | 27B dense, 64 layers (48 GDN + 16 attention) | Apache-2.0 | ViT as above; image `longest_edge` 16.8 Mpx (16,384 tokens max), 64 tokens min; multi-image documented, no count limit (vLLM default 999/prompt) | switch, default on | BF16 55.6 GB; FP8 30.9 GB; NVFP4 23.4 GB | 0.17.0+; text verified, vision not | MathVision 90.0, CharXiv-RQ 83.7, OmniDocBench-1.5 91.1, **RealWorldQA 85.9**, ERQA 65.5; DocVQA/ChartQA/OCRBench/MMMU/CountBench not reported | **one** (measured: ~104 GB resident at gmu 0.88 with 262K ctx; weights ~22 GB) |
| Qwen3.8-Flash-Next | `Qwen/Qwen3.8-Flash-Next` | 125B (6B active) + 51B n-gram + 4B MTP = 180B; Qwen Sparse Attention | `qwen-community-1.0` (HF tag `other`) | ViT present; image + video | switch + `reasoning_effort` | BF16 ~335–360 GB; RadixArk NVFP4 126 GB (staged on the cluster NFS) | v0.29.0 (2026-09-09) | RealWorldQA 88.5, MathVision 90.6, CharXiv 90.6, ERQA 72.3 | **two at NVFP4 (~63 GB/rank)** — but dgx-manager: open sm_121 correctness bugs in the sparse-attention indexer, never launched |
| Qwen3.5-397B-A17B | `Qwen/Qwen3.5-397B-A17B`, `-FP8`, `nvidia/…-NVFP4` | 397B / 17B active | Apache-2.0 | same ViT family | switch | FP8 406 GB; NVFP4 251 GB | main at release | **MMMU 85.0, MathVista 90.3, OCRBench 93.1, RealWorldQA 83.9, CountBench 97.2, EmbSpatial 84.5, RefSpatial 73.6** | **neither** (≥3 nodes even at NVFP4); token factory serves it **text-only** |
| Qwen3.5-122B-A10B / Qwen3.6-35B-A3B / Qwen3.5-27B | `Qwen/…` | 122B-A10B / 35B-A3B / 27B | Apache-2.0 | same | switch | 250 / 72 / 56 GB BF16 | 0.17.0+ | not fetched in detail | two BF16 (122B) / one / one |
| Qwen3-VL-32B | `Qwen/Qwen3-VL-32B-Instruct`, `-Thinking`, both `-FP8`; `RedHatAI/…-NVFP4` 21.9 GB | 33B dense | Apache-2.0 | SigLIP-2-SO-400M ViT + DeepStack; same pixel budget | **separate checkpoints** | BF16 66.7 GB; FP8 35.5 GB | 0.11.0 (2025-10); ViT fixes through v0.28 | MMMU 76.0, MathVista 83.8, **DocVQA 96.9, OCRBench 895, RealWorldQA 79.0, CountBench 94.9**, VSI-Bench 61.5, ERQA 48.8 | **one** (FP8 33 GiB + 128K KV 32 GiB) |
| Qwen3-VL-235B-A22B | `Qwen/Qwen3-VL-235B-A22B-Instruct`/`-Thinking`, `-FP8`; `nvidia/…-NVFP4` 135 GB | 236B / 22B active | Apache-2.0 | same | separate | FP8 238 GB; NVFP4 135 GB | 0.11.0 | MMMU 78.7, DocVQA 97.1, OCRBench 920, RealWorldQA 79.3, CountBench 93.0 | **two at NVFP4 only** (~63 GiB/rank); not at official precisions |
| Qwen3-VL-30B-A3B / 8B | `Qwen/Qwen3-VL-30B-A3B-*`, `-8B-*` | 31B-A3B / 9B | Apache-2.0 | same | separate | 62 / 17.5 GB BF16 | 0.11.0 | 30B-A3B: MMMU 74.2, DocVQA 95.0, RealWorldQA 73.7, CountBench 89.8 | one / one |
| Qwen2.5-VL-72B | `Qwen/Qwen2.5-VL-72B-Instruct`, `-AWQ` (no official FP8) | 73B dense | **Qwen licence** | ViT 32 layers, patch 14, window attention; `max_pixels` 12.8 Mpx | none | BF16 147 GB; AWQ 43 GB | 0.7.2 | DocVQA 96.4, ChartQA 89.5, OCRBench 885, MMMU 70.2, MathVista 74.8, RealWorldQA 75.7; OpenCompass avg 76.1 (2025-02) | two at BF16 / **one at AWQ**; token factory **retired it 2026-08-31** |

### 2.2 Meta

| model | HF id | params | licence | vision | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **Muse Glimmer 30B** (already baselined here, #52) | `meta-models/Muse-Glimmer-30B` (2026-08-09, blog 08-10); `nvidia/Muse-Glimmer-30B-NVFP4` 24.7 GB | 29.6B dense incl. ~1.8B ViT-G/14 perception encoder | Apache-2.0 | max 4,096 visual tokens per image; multi-image not stated; 131K+ ctx | `Reasoning strength: low/medium/high/xhigh` via system prompt — **no documented off** | BF16 59.6 GB; NVFP4 24.7 GB; Meta K-Quant ~17 GB LM | `MuseGlimmerForConditionalGeneration` T+I+V ("vLLM with transformers backend" at release) | MMMU-Pro 74, CharXiv-R 78.8, OmniDocBench 75.8, ScreenSpot-Pro 75.4; no DocVQA/OCRBench/RealWorldQA | **one** |
| Llama 4 Scout | `meta-llama/Llama-4-Scout-17B-16E-Instruct` (gated) | 109B / 17B active | Llama 4 Community | MetaCLIP early fusion; tested to 5 images (card), 8 (blog) | none | BF16 217 GB; no official quant | `Llama4ForConditionalGeneration` | ChartQA 88.8, DocVQA 94.4, MMMU 69.4 | three at BF16; one only with a community int4 |
| Llama 4 Maverick | `…-Maverick-17B-128E-Instruct(-FP8)` | 400B / 17B | Llama 4 Community | same | none | FP8 417 GB | same | ChartQA 90.0, DocVQA 94.4, MMMU 73.4, MathVista 73.7 | ≥5 nodes — not a Spark model |

No newer Llama takes images (newest `meta-llama` repos are Llama-Guard-4 and Prompt-Guard-2, April 2025); Meta's 2026 open VLM is Muse Glimmer.

### 2.3 Mistral

| model | HF id | params | licence | vision | thinking | footprint | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|
| Pixtral Large | `mistralai/Pixtral-Large-Instruct-2411` | 123B + 1B encoder | **Mistral AI Research License — research only** | ≥30 hi-res images in 128K | none | BF16 248 GB, no official quant | MMMU 64.0, MathVista 69.4, ChartQA 88.1, DocVQA 93.3 | three; licence excludes a production judge anyway |
| Mistral Small 4 | `mistralai/Mistral-Small-4-119B-2603` (FP8), `-NVFP4` 70.8 GB | 119B / 6.5B active MoE | Apache-2.0 | Pixtral encoder, image_size 1540, vision tower kept BF16 | **optional** (`reasoning_effort` none/high) | FP8 121 GB; **NVFP4 70.8 GB** | MMMU-Pro 60 (reasoning) / 46.3 (instruct); nothing else published | **one at NVFP4**, two at FP8 |
| Mistral Medium 3.5 | `mistralai/Mistral-Medium-3.5-128B` (FP8) | 128B dense | Modified MIT (revenue clause) | Pixtral-type | optional | FP8 134 GB | none published for vision | two |
| Mistral Small 3.2 / Magistral Small 1.2 / Pixtral-12B | `…-Small-3.2-24B-Instruct-2506`, `Magistral-Small-2509`, `Pixtral-12B-2409` | 24B / 24B / 12B | Apache-2.0 | ≤10 images | none / always-think / none | 48 / 48 / 25 GB BF16 | Small 3.2: DocVQA 94.9, ChartQA 87.4, MMMU 62.5 | one |
| Mistral Large 3 | `…-Large-3-675B-Instruct-2512`, `-NVFP4` 403 GB | 675B / 41B | Apache-2.0 | image input | none | NVFP4 403 GB | none transcribed | ≥4 nodes |

### 2.4 DeepSeek, MiniMax, OpenAI (the "vision unknown" ids)

- **DeepSeek-V4**: every `deepseek-ai/DeepSeek-V4-*` checkpoint is `DeepseekV4ForCausalLM`, **text-only** — except `deepseek-ai/DeepSeek-V4-Flash-Vision-Exp` (2026-08-31, MIT, ~305B, FP4 experts + FP8, 168 GB; vLLM `DeepseekV4ForConditionalGeneration`, recipe TP=4 on GB300). Two Sparks on paper; DSpark/FP4-expert kernels on GB10 unverified; card reports agent benchmarks only. Not on the token factory.
- **MiniMax-M3** (`MiniMaxAI/MiniMax-M3`, 2026-06-02): `MiniMaxM3SparseForConditionalGeneration`, 32-layer ViT, image + video, ~428B / ~23B active, thinking enabled/adaptive/disabled, **MiniMax Community License** (commercial use above US$20M revenue needs written authorisation; attribution required). MXFP8 444 GB → ≥5 nodes — **hosted-only**; on the token factory at fp4, image accepted (probe). Card: OmniDocBench 91.6, MMMU-Pro 78.1; Arena vision #51.
- **gpt-oss-120b**: `GptOssForCausalLM`, no vision keys, text-only. Out.
### 2.5 Google Gemma

| model | HF id | params | licence | vision / resolution | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **Gemma 4 31B** | `google/gemma-4-31B-it` (2026-03-31/04-02) | 30.7B dense + ~550M encoder | **Apache-2.0** | variable aspect; visual token budget 70/140/280/560/1120 per image (default 280); multi-image (vLLM `I⁺`); 256K ctx | **optional**, same checkpoint (`enable_thinking` / `<\|think\|>`) | BF16 62.5 GB; official QAT **W4A16 23.3 GB** (`-qat-w4a16-ct`); GGUF q4_0 17.7 GB | `Gemma4ForConditionalGeneration` from v0.19.0 (2026-04-03) | MMMU-Pro 76.9, OmniDocBench-1.5 edit-dist 0.131, MATH-Vision 85.6; DocVQA/ChartQA/OCRBench/RealWorldQA not reported; **Arena vision #34 (1261), the top open dense model** | **one** (62.5 GB BF16, or 23.3 GB W4A16) |
| Gemma 4 26B-A4B (baselined here in April, 0.57 Spearman under the old scalar harness) | `google/gemma-4-26B-A4B-it` | 25.2B / 3.8B active | Apache-2.0 | same | optional | BF16 51.6 GB; QAT GGUF 14.4 GB | v0.19.0 | MMMU-Pro 73.8, OmniDocBench 0.149, MATH-Vision 82.4; Arena #47 (1242) | one |
| Gemma 4 12B Unified | `google/gemma-4-12B-it` (2026-06-03) | 12B dense, **encoder-free** (raw patches projected) | Apache-2.0 | same budgets | optional | BF16 23.9 GB; W4A16 10.3 GB | `Gemma4UnifiedForConditionalGeneration` by v0.24.0 | MMMU-Pro 69.1, OmniDocBench 0.164; OCRBench v2 EN 51.8 | one |
| Gemma 3 27B (on the token factory) | `google/gemma-3-27b-it` (2025-03, gated) | 27.4B dense | **Gemma Terms of Use** | SigLIP-400M frozen; every image normalised to **896×896 → 256 tokens** (Pan&Scan crops optional); multi-image; 128K | none | BF16 54.9 GB; QAT q4_0 GGUF 17.2 GB | `Gemma3ForConditionalGeneration` (v0.8.0+) | IT: DocVQA 86.6, ChartQA 78.0, MMMU 64.9, MathVista 67.6; PT: RealWorldQA 53.9, CountBenchQA 68.0 | one; hosted at fp8, image accepted (probe) |

The 256-token, 896-px normalisation of Gemma 3 is the weakest resolution handling on this list for reading a labelled engineering view; Gemma 4 replaced it with a variable budget up to 1,120 tokens.

### 2.6 Z.ai GLM

| model | HF id | params | licence | vision / resolution | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **GLM-5.3-Flash** (baselined here, #52/#61) | `zai-org/GLM-5.3-Flash` (FP8 native, 2026-08-26), `-BF16`; `LibertAIDAI/GLM-5.3-Flash-NVFP4` 194.7 GB (the cluster's recipe; "tested 2× GB10 TP=2"), `RedHatAI/GLM-5.3-Flash-NVFP4` 197.8 GB | 320B / 18B active (288 experts, 34 KDA + 11 DSA layers, MTP) | **MIT** | `Glm5NextForConditionalGeneration`, 24-layer ViT, image_size 448, patch 14, merge 2; `processor_config.json` empty → **pixel/token cap per image unverified** | always on by design; `reasoning_effort` low/high/max; **the cluster's recipe honours `enable_thinking:false`** (dgx-manager) | FP8 328 GB; NVFP4 195–198 GB | PR #53906 on `main` 2026-09-03, **not in v0.29.0**; recipe says "0.29.0+" | **no vision scores published** (card chart is text/agentic; BabyVision only in footnotes); Arena vision #27 (1273) — highest open entry | **two at NVFP4 (~97–99 GB/rank)**; four at FP8; never one |
| GLM-4.6V / GLM-4.6V-Flash | `zai-org/GLM-4.6V` (+`-FP8` 110 GB), `GLM-4.6V-Flash` 20.6 GB | 106B / 12B active; 9B dense | MIT | ViT 336-base, patch 14, merge 2; ≤12,288 tokens/image, any aspect "up to 4K"; 128K | optional (`enable_thinking`, `/nothink`) | FP8 110 GB; Flash BF16 20.6 GB | ≥0.12.0 (`Glm4vMoe…`) | **OCRBench 86.5, MMMU 76.0, MathVista 85.2, ChartQAPro 65.5, CharXiv 63.2, OmniSpatial 52.0, BLINK 65.5** (Flash: OCRBench 84.7, MMMU 71.1, OmniSpatial 50.6); OCRBench v2 EN 59.0 (Flash) | 4.6V FP8: borderline one (≈0 GB KV), comfortable **two**; Flash: **one** |
| GLM-4.5V, GLM-4.1V-9B-Thinking | `zai-org/GLM-4.5V(-FP8)`, `GLM-4.1V-9B-Thinking` | 106B-A12B; 9B | MIT | same | optional; always-on | 110 / 20.6 GB | v0.10.2 | 4.5V: OCRBench 86.5, MMMU 75.4, OmniSpatial 51.0 | two / one |
| GLM-5.3 / 5.2 / 5.1 / 5 | `zai-org/GLM-5.x` | 744B-A40B | 5.3 License / MIT | **text-only** (`GlmMoeDsaForCausalLM`, no `vision_config`) | — | ≥756 GB | — | — | out |

### 2.7 Moonshot Kimi (hosted-only class)

| model | HF id | params | licence | vision / resolution | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **Kimi K3** (triage model, #93) | `moonshotai/Kimi-K3` (2026-07-17, weights 07-27) | **2.8T / 104B active** (896 experts) | Kimi K3 License (MIT-like; MaaS > $20M revenue needs agreement; attribution > 100M MAU) | MoonViT-V2 401M; ≤16,384 tokens/image; multi-image; 1M ctx | **always on**, `reasoning_effort` low/high/max — cannot be disabled | native MXFP4 **1,561 GB** | v0.27.0+, recipe floor **8× GB300** | MMMU-Pro 81.6, CharXiv-RQ 84.8, MathVision 94.3, OmniDocBench 91.1, WorldVQA 51.0; DocVQA/OCRBench not reported | **≥16 nodes — hosted-only** |
| Kimi K2.6 | `moonshotai/Kimi-K2.6` (2026-04-20) | 1T / 32B active | Modified MIT | MoonViT 400M; ≤4,096 tokens/image; ≤7,168 px/side; multi-image; 256K | **optional** (`thinking:false` = instant mode) | native INT4 QAT **595 GB** | v0.15.0+ | MMMU-Pro 79.4, CharXiv-RQ 80.4, MathVision 87.4, BabyVision 39.8; Arena vision #33 (1263) | ≥6 nodes — **hosted-only** |
| Kimi-VL-A3B-Thinking-2506 | `moonshotai/Kimi-VL-A3B-Thinking-2506` (2025-06) | 16B / 3B active | MIT | MoonViT native-res, 3.2 Mpx | separate Thinking checkpoint | BF16 32.8 GB | v0.10.2 | MMMU 64.0, MathVista 80.1, InfoVQA 83.2; OpenCompass 74.3 (2025-07) | one — but a 2025 3B-active model, below the incumbent's class |
### 2.8 NVIDIA Cosmos and Nemotron

**"Cosmos3-Super-Reasoner" is not an HF repo.** It is NVIDIA's NIM/API id for the *understanding tower* of the unified checkpoint `nvidia/Cosmos3-Super` (2026-03-10, card 05-31): a Qwen3-VL-32B-architecture dense transformer initialised from Qwen3-VL and retrained for physical/spatial reasoning — the same 33.36B parameter count as `nvidia/Cosmos-Reason2-32B` but different weights. Nebius's "33B, FP16" is that tower at BF16; the token factory retired it on 2026-08-31.

| model | HF id | params | licence | vision / resolution | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| **Cosmos3-Super (reasoner)** | `nvidia/Cosmos3-Super` (repo 132.6 GB incl. generator/VAE; vLLM loads only `transformer/` + `vision_encoder/` ≈ 66.7 GB) | 33.36B dense | **OpenMDW-1.1** | Qwen3-VL ViT + preprocessor (64–16.8 Mpx per image); multi-image; 262K | prompt-driven `<think>`; no template switch (answer-only by system prompt) | BF16 only ("only BF16 tested"); no official quant | `Cosmos3ForConditionalGeneration` since **v0.23.0** (2026-06-15); card alternatively pins vLLM 0.21 + `vllm-cosmos3` plugin with `--hf-overrides` — which override string upstream expects is unverified | **RealWorldQA 79.2, CountBenchQA 89.1, VSI-Bench 60.9, ERQA 51.2, DocVQA 90.4, OCRBench-v2 66.7**, MMMU-Pro 48.1, AI2D 87.8 | **one** (66.7 GB resident, ~40 GB headroom); 133 GB download |
| Cosmos-Reason2-32B | `nvidia/Cosmos-Reason2-32B` (2026-04-29) | 33.36B | NVIDIA Open Model License | Qwen3-VL ViT | prompt-driven | BF16 66.7 GB | `Qwen3VLForConditionalGeneration` (≥0.11) | BlinkSpatial 86.7, CVBench 88.0, ERQA 45.3; no doc benchmarks; GitHub says superseded by Cosmos 3 | one |
| Cosmos3-Nano / Edge | `nvidia/Cosmos3-Nano` (8B reasoner), `Cosmos3-Edge` (2.4B) | 8.8B / 2.4B | OpenMDW-1.1 | same | Edge: `enable_thinking` switch | 17.5 / 4.9 GB | v0.23 / v0.26 | Nano: DocVQA 94.2, CountBenchQA 84.8, RealWorldQA 72.2 | one |
| **Nemotron 3 Nano Omni 30B-A3B** | `nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16`, `-FP8`, `-NVFP4` (2026-04-28) | 31B / ~3B active, Mamba2-Transformer hybrid MoE | NVIDIA Open Model Agreement | C-RADIOv4-H; single dynamic tile 1,024–13,312 patches (BF16); FP8/NVFP4 preprocessors use the older 12×512 tiles; multi-image documented, no numeric cap; 256K | **switch** (`enable_thinking:false`), `--reasoning-parser nemotron_v3` | BF16 66.0 GB; FP8 35.2 GB; **NVFP4 22.4 GB** (quant deltas −0.4) | `NemotronH_Nano_Omni_Reasoning_V3` since **v0.20.0** (2026-04-27); `--trust-remote-code` | **OCRBench v2 EN 67.0 (public board 65.8 — best open model)**, CVBench2D 84.0, MathVista 82.8, CharXiv-R 63.6, MMLongBench-Doc 57.5; no DocVQA/MMMU/RealWorldQA | **one** |
| Nemotron-Nano-12B-v2-VL | `nvidia/NVIDIA-Nemotron-Nano-12B-v2-VL-BF16`, `-FP8`, `-NVFP4-QAD` (2025-10-28) | 12.6B dense hybrid | NVIDIA Open Model License | C-RADIOv2-H; 12 tiles × 512²; **"Input Images Supported: 4"** | template has `/no_think`; reasoning mode undocumented | 26.4 / 15.4 / **10.6 GB** | `NemotronH_Nano_VL_V2` since v0.11.0; `--trust-remote-code` | DocVQA 94.4, ChartQA 89.7, OCRBench 85.6, OCRBench-v2 62.0, MMMU 68, MathVista 76.9 | one — **but the documented 4-image cap is below the judge's eight views** |
| Nemotron-3 Nano/Super/Ultra, Nemotron-3.5-Lightning | `nvidia/NVIDIA-Nemotron-3-*` | — | — | **text-only** (`NemotronHForCausalLM`, no `vision_config`) — the token factory's `nvidia/Nemotron-3-*` ids are these | — | — | — | — | out |

### 2.9 OpenBMB MiniCPM

| model | HF id | params | licence | vision / resolution | thinking | footprint | vLLM | scores | Spark fit |
|---|---|---|---|---|---|---|---|---|---|
| MiniCPM-V-4.5 (on the token factory; now "legacy" upstream) | `openbmb/MiniCPM-V-4_5` (2025-08-26) | 8.7B (Qwen3-8B + SigLIP2-400M) | Apache-2.0 | LLaVA-UHD, any aspect up to 1.8 Mpx, ≤9 slices × 64 tokens (≤~640 tokens/image); multi-image; 40K ctx | switch (`enable_thinking`, default off) | BF16 17.4 GB; int4 6.5 GB, AWQ/GPTQ 7.1 GB | `MiniCPMV` (v0.10.2), `--trust-remote-code` | **OpenCompass 77.0**, OCRBench 89.0, ChartQA 87.4, DocVQA 94.7, MMMU 67.7, MathVista 79.9, RealWorldQA 72.1 | one; hosted at fp16 with `structured_outputs` |
| MiniCPM-V-4.6 (+`-Thinking`) | `openbmb/MiniCPM-V-4.6` (2026-05-11) | **1.3B** (Qwen3.5-0.8B) | Apache-2.0 | LLaVA-UHD v4 | separate checkpoint | 2.6 GB | v0.22.0+ | OCRBench 838, DocVQA 89.4, MMMU 52.6 — a phone-class model | one; below the class needed |
| MiniCPM-o-4.5 | `openbmb/MiniCPM-o-4_5` (2026-02-03) | 9.4B omni | Apache-2.0 | as 4.5 | switch | 18.7 GB | v0.16+ | OpenCompass 77.6, OCRBench 876, DocVQA 94.7 | one |

No MiniCPM-V-5 exists.

### 2.10 OpenGVLab InternVL3.5 (2025-08-26; no 3.6/4 exists)

Apache-2.0 throughout; 448-px tiles, ≤12 tiles + thumbnail, **256 tokens per tile** (eight views × 13 tiles × 256 ≈ 27K visual tokens at full tiling — the highest token cost on this list; `-Flash` variants route to 64 tokens/tile); thinking is a switch by system prompt; multi-image documented; `InternVLChatModel` in vLLM ≥0.10.1 with `--trust-remote-code`; **no official AWQ/FP8/NVFP4 for 3.5**; LLM context 40,960.

| size | HF id | params | BF16 | MMMU | DocVQA | ChartQA | OCRBench | RealWorldQA | **VSI-Bench** | ERQA | Spark fit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **38B** | `OpenGVLab/InternVL3_5-38B` (Qwen3-32B + InternViT-6B) | 38.4B | 76.8 GB | 76.9 | 94.0 | 88.8 | 870 | 75.9 | **66.3** | 43.3 | **one, tight** (23–33 GB KV headroom) |
| 30B-A3B | `…-30B-A3B` | 30.8B / 3B | 61.7 GB | 75.6 | 94.2 | 87.4 | 880 | 72.3 | 63.7 | 41.5 | one |
| 14B / 8B | `…-14B`, `…-8B` | 15B / 8.5B | 30 / 17 GB | 73.3 / 73.4 | 93.4 / 92.3 | 86.5 / 86.7 | 836 / 840 | 70.5 / 67.5 | 60.8 / 56.3 | 41.8 / 41.0 | one |
| 241B-A28B | `…-241B-A28B` | 241B / 28B | 481 GB | 77.7 | 94.9 | 88.0 | 907 | 75.2 | 69.5 | 46.8 | **no — not even two** (≥5 nodes BF16) |

InternVL3.5-38B's VSI-Bench 66.3 is the highest spatial score on any card in this note at a one-Spark size; the scores come from the arXiv v2 tables (2508.18265) the cards link.

### 2.11 Other 2026 open VLMs the boards surface

- **MiMo-V2.5** (`XiaomiMiMo/MiMo-V2.5`, 2026-04-27, MIT, 310B / 15B active, 316 GB) — Arena vision #54; ≥3 nodes; not on the token factory. Out on fit.
- **Intern-S2-Mobius** (`internlm/Intern-S2-Mobius`, 2026-07-29, 36B, 73 GB, Apache-2.0) — in vLLM; no leaderboard placement found; a scientific-multimodal model, listed for completeness only.
## 3. What the Nebius token factory serves (the hosted half)

Read 2026-09-09 from the catalogue's machine-readable feed (`https://tokenfactory.nebius.com/api/public/models_info`, 22 entries, no auth — the catalogue's own `model-catalog.md` names it the authoritative source), the account's `GET /v1/models?verbose=true` (23 rows, read with the stored key, read-only), and one live 64×64 PNG probe per doubtful id.

**Why the screenshot and the account disagree.** `nvidia/Cosmos3-Super-Reasoner` and `Qwen/Qwen2.5-VL-72B-Instruct` are in the **August 2026 deprecation notice, retired 2026-08-31**, replacement named `MiniMaxAI/MiniMax-M3` ([notice](https://docs.tokenfactory.nebius.com/august-2026-deprecation-notice.md)); `nvidia/Nemotron-3-Nano-Omni` went the same day (→ `Nemotron-3_5-Lightning`, text-only). Neither `qwen3-vl-32b` nor a Nemotron-Nano-V2-12B-VL id appears in the feed, the deprecation notices or the docs (the only trace is a 2025-10-28 Nebius blog post with no id string). The screenshot was of a catalogue view that has since lost four rows; the account list is current. `/v1/models` is project-scoped (`ai_project_id`) and the docs describe no per-org enabling or preview gating for public serverless models ([list-models](https://docs.tokenfactory.nebius.com/api-reference/models/list-models.md), [public-serverless](https://docs.tokenfactory.nebius.com/public-serverless.md)); `-fast` flavours were largely removed on 2026-06-22 and none of the vision ids has one.

**Vision-capable ids on the account today:**

| id | modality per `/v1/models` | catalogue `use_cases` | 64-px probe | precision | price in/out per 1M | context | region | `supported_features` |
|---|---|---|---|---|---|---|---|---|
| `zai-org/GLM-5.3-Flash` | `text+image->text` | image | — | fp8 | 0.15 / 0.50 | 1,024K | us-central1 | tools, reasoning |
| `moonshotai/Kimi-K2.6` | `text+image->text` | image | — | int4 | 0.95 / 4.00 | 256K | us-central1 | tools, reasoning |
| `moonshotai/Kimi-K3` | `text+image->text` | image | — | fp4 | 3.00 / 15.00 | 1,024K | eu-west2 | tools, reasoning |
| `openbmb/MiniCPM-V-4_5` | `text+image->text` | image | "red", 90 prompt tokens | fp16 | 0.658 / 1.11 | 32K | eu-north1 | **json_mode, structured_outputs** |
| `google/gemma-3-27b-it` | `text->text` (!) | image | **"Red.", 281 prompt tokens — image accepted** | fp8 | 0.10 / 0.30 | 110K | eu-north1 | tools |
| `MiniMaxAI/MiniMax-M3` | `text->text` (!) | image, video | **"Red", 194 prompt tokens — image accepted** | fp4 | 0.30 / 1.20 | 1,049K | us-central1 | tools, reasoning |
| `moonshotai/Kimi-K2.7-Code` | `text->text` | image | empty reply, **34 prompt tokens — image dropped**; treat as text-only | fp4 | 0.95 / 4.00 | 256K | us-central1 | tools, reasoning |

Text-only on the account (no image in `use_cases`, `text->text`, and not probed): `zai-org/GLM-5.1`, `zai-org/GLM-5.2` (+ a dedicated GLM-5.2 endpoint), `deepseek-ai/DeepSeek-V4-Flash-0731`, `deepseek-ai/DeepSeek-V4-Pro` (the family's one vision checkpoint, `DeepSeek-V4-Flash-Vision-Exp`, is not offered), all `nvidia/Nemotron-3-*` and `Nemotron-3_5-Lightning`, `Qwen/Qwen3.5-397B-A17B` (natively multimodal upstream — served text-only here), `openai/gpt-oss-120b` (text-only by architecture). `zai-org/GLM-5.3` (non-Flash) does not exist in the catalogue.

**Facts that shape a screen run on this provider.** Images go as URL or base64 `image_url` parts, `url` capped at 13,981,514 characters (~14 MB), `detail` auto/low/high; **no documented per-request image count, resolution cap or downscaling rule** — eight views per call is untested on every id but Kimi-K3 (114 calls to date). Only MiniCPM-V-4_5 advertises `structured_outputs`; the judge's guided-JSON contract (#53) is a vLLM-path feature, so on GLM-5.3-Flash/Kimi/Gemma-3/MiniMax the schema must be enforced by prompt and parser, as the Anthropic path already does. Rate limits are dynamic per 15-minute window (baseline example 60 RPM / 400K TPM, scaling ×1.2 up to 20× base; over-limit requests may still be served with `x-ratelimit-over-limit: yes`) — a 125-example screen at N=3 is well inside; a corpus pass is not the point of a screen. The Batch API docs page is gone (404); `POST /v1/operations` with `type: batch_inference` exists in the OpenAPI spec but whether it takes image parts is undocumented. Cost of one screen (125 examples × 8 PNGs ≈ 125 × ~6–9K input tokens, ~1K output): Kimi-K3 ≈ $3–4, Kimi-K2.6 ≈ $1.5, MiniMax-M3 ≈ $0.5, GLM-5.3-Flash / Gemma-3 / MiniCPM ≈ $0.1–0.3 — an order of magnitude, not a budget.
## 4. What the public boards say, and how much to trust them today

- **OpenCompass OpenVLM leaderboard** — the HF Space loads `http://opencompass.openxlab.space/assets/OpenVLM.json`, whose `time` field is **2025-09-17**; 285 models, none from 2026, no Qwen3-VL/3.5/3.8, no Gemma 4, no GLM-5. `rank.opencompass.org.cn` did not resolve / its ranking API answers 405 unauthenticated. Its last open-weights top five (InternVL3-78B 79.1, InternVL3-38B 77.8, InternVL2.5-78B-MPO 77.0, Ovis2-34B 76.5, Qwen2.5-VL-72B 76.1) is a year old and is **not** a ranking of today's candidates. The MMMU official board is likewise frozen at 2025-11-24.
- **Arena vision leaderboard** (`arena.ai/leaderboard/vision`, dated 2026-08-27) — human preference, not drawing-reading, but current. Open-weights entries in the top 60: glm-5.3-flash #27 (1273), kimi-k2.6 #33 (1263), **gemma-4-31b #34 (1261)**, **qwen3.8-27b #40 (1251)**, kimi-k2.5-thinking #43, qwen3.5-397b-a17b #44 (1247), gemma-4-26b-a4b #47 (1242), minimax-m3 #51 (1237), mimo-v2.5 #54, qwen3.5-122b-a10b #58. Llama 4, Pixtral, Mistral Small 4, Muse Glimmer, DeepSeek-V4-Vision are absent. Note that the incumbent and the two token-factory Kimi/GLM models sit within ~20 Elo of each other — the board does not separate them.
- **OCRBench v2** (2026-06 board) — the closest public proxy for reading rendered views with labels: open-weights English top is **Nemotron 3 Nano Omni 30B-A3B 65.8**, Qwen3.6-35B-A3B 65.5, Qwen3.5-35B-A3B 65.3, Qwen3-Omni-30B-A3B 61.3, Nemotron Nano V2 VL 61.2, GLM-4.6V-Flash 59.0, Qwen3.5-9B 58.7, Gemma 4 12B 51.8, MiniCPM-V-4.6 40.4. Neither Qwen3.8-27B nor Gemma 4 31B has been submitted.
- No public board measures the judge's actual task (multi-view geometric consistency, part counting, hole/fillet presence). The 172-item adjudicated gold (#98) is the only instrument that does; everything above is a prior for ordering the screen, not a result.
## 5. The two lists side by side

Legend: **tested** = has answered a judge call from chat3d on this hardware (§1); **served** = takes an image on the token factory account today (§3); **deployable** = fits one (1) or two (2) Sparks on the arithmetic of §2 with an in-tree vLLM class — dgx-manager's caveat (kernels on sm_121a) applies to every "untried" row.

| model | tested here | served there (id) | deployable on Sparks | thinking off possible | licence | strongest public signal for reading views | verdict for #98 |
|---|---|---|---|---|---|---|---|
| Qwen3.8-27B NVFP4 | **yes — qualified incumbent** | no | 1 (serving, R=3) | yes | Apache-2.0 | RealWorldQA 85.9; Arena #40 | anchor |
| Claude Sonnet 4.6 | reference | (Anthropic) | — | yes | — | — | anchor |
| GLM-5.3-Flash | yes (#52, #61; lost) | **yes** (fp8) | 2 at NVFP4 (recipe exists, stopped) | yes on our recipe; z.ai API says no | MIT | Arena #27; no vision card scores | hosted re-screen only (cheap); local slot not worth R=2 |
| Muse Glimmer 30B | yes (#52, old harness; closest to Sonnet) | no | 1 (NVFP4 24.7 GB official) | **no** — min reasoning "low" | Apache-2.0 | MMMU-Pro 74, OmniDocBench 75.8 | local screen, tier A |
| Qwen3.8-27B BF16 | yes (#52; slowest, 134 s) | no | 1 | yes | Apache-2.0 | same model as incumbent | skip — same weights unquantised |
| Gemma 4 26B-A4B | April, scalar rubric (0.57 Spearman) | no | 1 | yes | Apache-2.0 | Arena #47 | superseded by 31B |
| **Gemma 4 31B** | no | no | **1** (62.5 GB BF16 / 23.3 GB W4A16) | yes | Apache-2.0 | **Arena #34, top open dense**; MMMU-Pro 76.9 | **local tier A** |
| **Qwen3-VL-32B-Instruct** | no | no (qwen3-vl-32b gone) | **1** (FP8 35.5 GB) | no thinking in checkpoint | Apache-2.0 | DocVQA 96.9, OCRBench 895, CountBench 94.9, RealWorldQA 79.0, VSI 61.5 | **local tier A** |
| **Cosmos3-Super reasoner** | no | retired 08-31 | **1** (66.7 GB BF16) | prompt-driven | OpenMDW-1.1 | CountBenchQA 89.1, RealWorldQA 79.2, VSI 60.9, ERQA 51.2 | **local tier A** (spatial specialist) |
| **Nemotron 3 Nano Omni 30B-A3B** | no | no (text Nemotron-3 ids only) | **1** (NVFP4 22.4 GB) | yes | NVIDIA Open Model Agreement | **OCRBench v2 EN best open (65.8)** | **local tier A** |
| **InternVL3.5-38B** | no | no | 1, tight (76.8 GB BF16, no quant) | yes (prompt) | Apache-2.0 | VSI-Bench 66.3 (highest one-Spark), DocVQA 94.0 | **local tier A** (highest token cost) |
| GLM-4.6V | no | no | 2 (FP8 110 GB; 1 with no KV) | yes | MIT | OCRBench 86.5, MMMU 76.0, OmniSpatial 52.0 | local tier C (two nodes) |
| Qwen2.5-VL-72B | no | retired 08-31 | 1 at AWQ (43 GB) | no thinking | Qwen licence | DocVQA 96.4, ChartQA 89.5; OpenCompass 76.1 (2025) | local tier B |
| Mistral Small 4 | no | no | 1 at NVFP4 (70.8 GB) | yes | Apache-2.0 | none published for vision | local tier B (MoE kernel risk) |
| Nemotron-Nano-12B-v2-VL | no | not on any Nebius list | 1 (10.6 GB NVFP4) | undocumented | NVIDIA OML | DocVQA 94.4, ChartQA 89.7 | tier B only if the 4-image cap can be lifted |
| Qwen3-VL-235B-A22B | no | no | 2 at third-party NVFP4 only | separate ckpt | Apache-2.0 | DocVQA 97.1, OCRBench 920 | tier C |
| DeepSeek-V4-Flash-Vision-Exp | no | no (V4 ids are text-only) | 2 on paper; FP4/DSpark kernels on GB10 unverified | unverified | MIT | agent benchmarks only | defer |
| Qwen3.8-Flash-Next | staged (126 GB NVFP4 on NFS), never launched | no | 2 — open sm_121 correctness bugs (dgx-manager) | yes | qwen-community-1.0 | RealWorldQA 88.5 | defer until the indexer fixes land |
| **Kimi K2.6** | no | **yes** (int4) | no (≥6 nodes) | **yes** (`thinking:false`) | Modified MIT | Arena #33; MMMU-Pro 79.4 | **hosted tier 1** |
| Kimi K3 | triage only (114 calls) | **yes** (fp4) | no (≥16 nodes) | **no** (always on) | Kimi K3 License | MMMU-Pro 81.6, OmniDocBench 91.1 | excluded — it triages the sittings (#98) |
| MiniMax-M3 | no | **yes** (fp4, probe) | no (≥5 nodes) | yes (`disabled`) | MiniMax Community (revenue clause) | Arena #51; OmniDocBench 91.6, MMMU-Pro 78.1 | hosted tier 1 |
| gemma-3-27b-it | no | **yes** (fp8, probe) | 1 | no thinking | Gemma Terms | DocVQA 86.6; 896-px/256-token images | hosted tier 2 (near-free) |
| MiniCPM-V-4_5 | no | **yes** (fp16, `structured_outputs`) | 1 | yes | Apache-2.0 | OpenCompass 77.0, OCRBench 89.0 | hosted tier 2 |
| Qwen3.5-397B-A17B | no | text-only there | no (≥3 nodes at NVFP4) | yes | Apache-2.0 | MMMU 85.0, OCRBench 93.1, CountBench 97.2 — strongest card on this list | neither, unless Nebius serves the vision path |
| Llama 4 Scout / Maverick | no | no | 3 / ≥5 (no official quant for Scout) | none | Llama 4 Community | DocVQA 94.4; tested to 5 images | out |
| Pixtral Large | no | no | 3 | none | **research-only** | DocVQA 93.3 | out (licence) |
| MiMo-V2.5, Mistral Large 3, Kimi K2.7-Code, GLM-5.x text, Nemotron-3 text, DeepSeek-V4 text, gpt-oss-120b | no | some (text) | no | — | — | — | out (fit or no vision) |

## 6. Recommended shortlist for the #98 screen

The screen (#98) runs each candidate once on the gold examples plus the rest of the 125, under the current instrument, temperature 0, thinking off where the model allows, and ranks by confirmed false passes on gold. Anchors are the incumbent's and Sonnet's existing runs. What follows is an ordering for the queue, not a prediction of the result; it weighs (a) a card signal on document/spatial reading, (b) whether thinking can be turned off (#99 makes off the default), (c) an in-tree vLLM class on a release the cluster's image family can reach, (d) fit on the one idle Spark, (e) an open licence a production judge can live under.

### 6.1 Local-deployable ranking (one Spark each, spark-01, one at a time, TP=1)

| # | candidate | recipe suggestion | why here | risk to check first |
|---|---|---|---|---|
| 1 | **Gemma 4 31B** — `google/gemma-4-31B-it` (BF16 62.5 GB) or `-qat-w4a16-ct` (23.3 GB) | `Gemma4ForConditionalGeneration`, vLLM ≥0.19 (the cluster image is 0.27-class); `enable_thinking:false`; visual token budget 560–1120 per view | the top open dense model on the only current board; Apache-2.0; the Gemma 4 family already ran on this hardware (26B-A4B in April); dense → no MoE kernel exposure | no DocVQA/OCRBench on the card; the April 26B-A4B scalar result (0.57 Spearman) was a different harness |
| 2 | **Qwen3-VL-32B-Instruct-FP8** — `Qwen/Qwen3-VL-32B-Instruct-FP8` (35.5 GB) | `Qwen3VLForConditionalGeneration`, in-tree since 0.11 with ViT fixes through 0.28; no thinking to disable | best card numbers at this size on exactly the reading tasks (DocVQA 96.9, OCRBench 895, CountBench 94.9, VSI 61.5); same ViT lineage as the incumbent, so a clean test of "does DeepStack + Instruct-only training beat the 3.8 generalist" | FP8 path on sm_120 was "broken this week" per dgx-manager — use BF16 (66.7 GB, still one Spark) if so |
| 3 | **Cosmos3-Super reasoner** — `nvidia/Cosmos3-Super` (vLLM loads the 66.7 GB tower) | `Cosmos3ForConditionalGeneration`, vLLM ≥0.23; answer-only system prompt | the only candidate trained *for* spatial/physical reasoning on a Qwen3-VL-32B body: CountBenchQA 89.1, VSI 60.9, ERQA 51.2 | 133 GB download; BF16 only; the `--hf-overrides` string in the card is the plugin's, not upstream's; OpenMDW-1.1 licence is new to the project |
| 4 | **Nemotron 3 Nano Omni 30B-A3B** — `nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4` (22.4 GB) | `NemotronH_Nano_Omni_Reasoning_V3`, vLLM ≥0.20, `--trust-remote-code --reasoning-parser nemotron_v3`, `enable_thinking:false` | leads OCRBench v2 among open models; 3B active → the fastest candidate by far; official NVFP4 with −0.4 delta | Mamba2 + MoE hybrid on sm_121a is exactly the kernel class dgx-manager warns about; BF16 vs FP8/NVFP4 preprocessors differ (tiling); no DocVQA/MMMU on card |
| 5 | **Muse Glimmer 30B** — `nvidia/Muse-Glimmer-30B-NVFP4` (24.7 GB) or BF16 59.6 GB | `MuseGlimmerForConditionalGeneration`; `Reasoning strength: low` | the only untested-under-the-instrument model with prior evidence here (closest to Sonnet on the #52 gate, 0.976 mean abs Δ) | reasoning cannot be switched off — screen at `low` with the #93 output ceiling, and expect it to be the slowest; the #52 recipe is not on record |
| 6 | **InternVL3.5-38B** — `OpenGVLab/InternVL3_5-38B` (76.8 GB BF16) | `InternVLChatModel`, `--trust-remote-code`, `max_dynamic_patch` 6 or the `-Flash` variant to hold visual tokens under ~10K for eight views | highest one-Spark VSI-Bench (66.3), DocVQA 94.0, Apache-2.0 | tight fit with no official quant; 2025 model; 40K context bound with 27K visual tokens at full tiling |
| B | Qwen2.5-VL-72B-Instruct-AWQ (43 GB); Mistral Small 4 NVFP4 (70.8 GB); Nemotron-Nano-12B-v2-VL NVFP4 (10.6 GB) | — | run only if tier A leaves a slot: the first is a 2025 Qwen-licensed model; the second has no vision numbers and is a MoE; the third documents a **4-image** ceiling against the judge's eight | — |
| C | GLM-4.6V-FP8 (110 GB, TP=2); Qwen3-VL-235B-A22B NVFP4 (135 GB, TP=2) | needs the pool at R=2 for the run | GLM-4.6V has the best GLM vision card (OCRBench 86.5, MMMU 76.0) and MIT; the 235B is the family's ceiling | two-node deploys cost ~25 min each and cannot pool with the incumbent; only after tier A |

Not recommended locally: GLM-5.3-Flash (already screened, two nodes, unstable at temperature 0 — re-screen hosted instead), Qwen3.8-27B BF16 (same weights), DeepSeek-V4-Flash-Vision-Exp and Qwen3.8-Flash-Next (kernel/correctness risk dgx-manager has already named), everything ≥3 nodes.

### 6.2 Hosted-only ranking (token factory, through the `nebius` provider)

| # | id | why | what to set |
|---|---|---|---|
| 1 | `moonshotai/Kimi-K2.6` | the strongest hosted model that can run thinking-off; Arena #33; ~$1.5 for the screen | `chat_template_kwargs.thinking:false` (verify the provider forwards it); JSON by prompt + parser, no `structured_outputs` |
| 2 | `zai-org/GLM-5.3-Flash` | the same model the cluster screened, at fp8 and ~$0.2; tells whether #61's loss was the model or the two-node deployment's instability | thinking off if the provider honours `enable_thinking:false` (unverified there); else the #93 ceiling |
| 3 | `MiniMaxAI/MiniMax-M3` | image verified by probe; thinking `disabled`; OmniDocBench 91.6; ~$0.5 | check the licence clause before any production use (attribution + revenue threshold) |
| 4 | `google/gemma-3-27b-it` | near-free; typed text-only but reads images | expect the 896-px / 256-token normalisation to hurt on labelled views; a low prior, cheap to confirm |
| 5 | `openbmb/MiniCPM-V-4_5` | the only hosted id with `structured_outputs`; OpenCompass 77.0; 8B | 32K context is enough for eight views (≤~5K visual tokens) |
| — | `moonshotai/Kimi-K3` | excluded: it is the adjudication triage model (#93), and #98 says a party to a sitting cannot triage it; also thinking cannot be disabled and it costs 10× the rest | keep as the third opinion |

A hosted winner is a scope decision for the map, not a ranking outcome (the standing preference is local); the hosted list is worth running because it is cheap and because two of its models (GLM-5.3-Flash, Gemma 3) calibrate the local list.

### 6.3 What the screen must settle before it trusts a number

- **Eight images per call** is undocumented on every hosted id and every untested local model; the first run of each candidate should confirm all eight views were counted (prompt-token count vs. a one-image call), as the probe did for Gemma 3 and MiniMax.
- **Guided JSON** exists only on the vLLM path; the Anthropic-path prompt-and-parser contract is what the hosted candidates get, and their completeness term (ADR 0004) is measured under it.
- **Serving provenance** (ADR 0005/0006): local candidates on spark-01 are single-replica by construction; hosted calls get `serving_source` unknown, which is fine for a screen and not for qualification.
- **Kernel coverage on sm_121a** is the deploy risk dgx-manager names for every untested row; a candidate that fails to load is a fact for the table, not a reason to skip the next.

## 7. Sources (all read 2026-09-09 unless dated otherwise)

**Cluster and app records (§1)**
- dgx-manager, session bridge `bridge:session_01DQKj8QgCYAjSQ92YMHQRhz`, reply of 2026-09-09 (quoted verbatim in §1.1).
- Spark gateway: `http://192.168.44.14:4000/api/deployments`, `/api/nodes`, `/v1/models` (18:53Z).
- chat3d database: `llm_usage_events ⋈ llm_models` on `purpose = 'vlm_evaluation'`; `llm_models.supports_vision`; `llm_purpose_map`; admin API `/api/admin/llm-providers`.
- Issues [#52](https://github.com/kreuzhofer/chat3d-app/issues/52) (four-judge baseline numbers), [#61](https://github.com/kreuzhofer/chat3d-app/issues/61), [#85](https://github.com/kreuzhofer/chat3d-app/issues/85), [#87](https://github.com/kreuzhofer/chat3d-app/issues/87), [#93](https://github.com/kreuzhofer/chat3d-app/issues/93), [#98](https://github.com/kreuzhofer/chat3d-app/issues/98); `docs/roadmap.md` (Gemma 4 0.57 Spearman), `docs/oss-model-evaluation.md`, `docs/local-model-strategy.md` §3, ADRs 0004–0006.

**Token factory (§3)**
- https://tokenfactory.nebius.com/api/public/models_info · https://tokenfactory.nebius.com/model-catalog.md · https://api.tokenfactory.nebius.com/openapi.json · account `GET /v1/models?verbose=true` (stored key, read-only) · live probes `POST /v1/chat/completions` with a 64×64 PNG on four ids.
- https://docs.tokenfactory.nebius.com/august-2026-deprecation-notice.md · https://docs.tokenfactory.nebius.com/june-2026-deprecation-notice.md · https://docs.tokenfactory.nebius.com/api-reference/models/list-models.md · https://docs.tokenfactory.nebius.com/public-serverless.md · https://docs.tokenfactory.nebius.com/ai-models-inference/overview.md · https://docs.tokenfactory.nebius.com/api-reference/examples/vision-capabilities.md · https://docs.tokenfactory.nebius.com/api-reference/inference/create-chat-completion.md · https://docs.tokenfactory.nebius.com/ai-models-inference/rate-limits.md · https://docs.tokenfactory.nebius.com/team-access/org-projects.md · https://docs.tokenfactory.nebius.com/data-lab/overview.md · https://nebius.com/blog/posts/nvidia-nemotron-nano-2-vl-in-ai-studio (2025-10-28).

**Qwen (§2.1)**
- HF `raw/main/config.json`, `preprocessor_config.json`, `README.md` and `api/models/<id>?blobs=true` for: `Qwen/Qwen3.8-27B`, `-FP8`, `unsloth/Qwen3.8-27B-NVFP4`, `nvidia/Qwen3.8-27B-NVFP4`, `Qwen/Qwen3.8-Flash-Next`, `Qwen/Qwen3.8-2.4T-A95B`, `Qwen/Qwen3.5-397B-A17B` (+`-FP8`, `nvidia/…-NVFP4`), `Qwen/Qwen3.5-27B`, `-35B-A3B`, `-122B-A10B`, `Qwen/Qwen3.6-27B`, `-35B-A3B`, `Qwen/Qwen3-VL-{8B,30B-A3B,32B,235B-A22B}-{Instruct,Thinking}[-FP8]`, `RedHatAI/Qwen3-VL-32B-Instruct-NVFP4`, `nvidia/Qwen3-VL-235B-A22B-Instruct-NVFP4`, `Qwen/Qwen2.5-VL-72B-Instruct`, `-AWQ`.
- Benchmark images linked from the Qwen3-VL cards (`qianwen-res.oss-accelerate.aliyuncs.com/Qwen3-VL/*.jpg`); https://github.com/QwenLM/Qwen3-VL · https://github.com/QwenLM/Qwen3.8 · https://arxiv.org/html/2511.21631 · https://recipes.vllm.ai/Qwen/Qwen3.8-27B · https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3-VL.html · https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html.

**Meta, Mistral, DeepSeek, MiniMax, OpenAI (§2.2–2.4)**
- https://huggingface.co/meta-models/Muse-Glimmer-30B · https://huggingface.co/blog/muse-glimmer (2026-08-10) · https://huggingface.co/nvidia/Muse-Glimmer-30B-NVFP4 · https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct · https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct[-FP8] · https://ai.meta.com/blog/llama-4-multimodal-intelligence/ · https://huggingface.co/docs/transformers/model_doc/llama4.
- https://huggingface.co/mistralai/{Pixtral-Large-Instruct-2411, Pixtral-12B-2409, Mistral-Small-3.1-24B-Instruct-2503, Mistral-Small-3.2-24B-Instruct-2506, Magistral-Small-2509, Mistral-Small-4-119B-2603, Mistral-Small-4-119B-2603-NVFP4, Mistral-Medium-3.5-128B, Mistral-Large-3-675B-Instruct-2512, Ministral-3-14B-Instruct-2512} · https://mistral.ai/news/mistral-small-4.
- https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp (+ `config.json` of every `deepseek-ai/DeepSeek-V4-*`) · https://huggingface.co/MiniMaxAI/MiniMax-M3 (+ LICENSE, `figures/benchmark.jpeg`) · https://huggingface.co/MiniMaxAI/MiniMax-M3-MXFP8 · https://huggingface.co/openai/gpt-oss-120b.

**Gemma, GLM, Kimi (§2.5–2.7)**
- https://huggingface.co/google/{gemma-3-27b-it, gemma-3-12b-it, gemma-3n-E4B-it, gemma-4-31B-it, gemma-4-26B-A4B-it, gemma-4-12B-it, gemma-4-31B-it-qat-w4a16-ct, gemma-4-12B-it-qat-w4a16-ct, gemma-3-27b-it-qat-q4_0-gguf, gemma-4-31B-it-qat-q4_0-gguf, gemma-4-26B-A4B-it-qat-q4_0-gguf} · https://ai.google.dev/gemma/docs/core/model_card_3 · https://ai.google.dev/gemma/docs/core/model_card_4 · https://ai.google.dev/gemma/docs/releases · https://arxiv.org/html/2503.19786 · https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/ · https://blog.google/…/introducing-gemma-4-12b/.
- https://huggingface.co/zai-org/{GLM-4.1V-9B-Thinking, GLM-4.5V[-FP8], GLM-4.6V[-FP8], GLM-4.6V-Flash, GLM-5.3-Flash[-BF16], GLM-5.3[-BF16], GLM-5.2[-FP8], GLM-5.1[-FP8], GLM-5[-FP8]} · https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-NVFP4 · https://huggingface.co/RedHatAI/GLM-5.3-Flash-NVFP4 · https://github.com/zai-org/GLM-V (`resources/bench_46v.jpeg`) · https://github.com/zai-org/GLM-5 · https://docs.z.ai/guides/vlm/glm-4.6v · https://docs.z.ai/guides/llm/glm-5.3-flash · https://recipes.vllm.ai/zai-org/GLM-5.3-Flash · https://github.com/vllm-project/vllm/pull/53906.
- https://huggingface.co/moonshotai/{Kimi-K3, Kimi-K2.6, Kimi-K2.5, Kimi-VL-A3B-Thinking, Kimi-VL-A3B-Thinking-2506} (+ `docs/deploy_guidance.md`) · https://www.kimi.com/en/blog/kimi-k3 · https://forum.moonshot.ai/t/meet-kimi-k2-6-advancing-open-source-coding/369 · https://recipes.vllm.ai/moonshotai/Kimi-K3 · https://recipes.vllm.ai/moonshotai/Kimi-K2.5.

**NVIDIA, MiniCPM, InternVL (§2.8–2.10)**
- https://huggingface.co/nvidia/{Cosmos3-Super, Cosmos3-Nano, Cosmos3-Edge, Cosmos-Reason2-32B, Cosmos-Reason2-8B, Cosmos-Reason2-2B, Cosmos-Reason1-7B} · https://research.nvidia.com/labs/cosmos-lab/cosmos3/technical-report.pdf · https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/cosmos-reason3/api.html · https://huggingface.co/blog/nvidia/cosmos-3-for-physical-ai · https://github.com/NVIDIA/cosmos (cookbooks/cosmos3/reasoner) · https://github.com/vllm-project/vllm/blob/v0.29.0/vllm/model_executor/models/cosmos3.py.
- https://huggingface.co/nvidia/{NVIDIA-Nemotron-Nano-12B-v2-VL-BF16, -FP8, -NVFP4-QAD, Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16, -FP8, -NVFP4, Llama-3.1-Nemotron-Nano-VL-8B-V1} and `config.json` of every `nvidia/NVIDIA-Nemotron-3-*` and `Nemotron-3.5-Lightning-*`.
- https://huggingface.co/openbmb/{MiniCPM-V-4_5, MiniCPM-V-4.6, MiniCPM-V-4.6-Thinking, MiniCPM-o-4_5} (+ quant siblings) · https://github.com/OpenBMB/MiniCPM-V · https://github.com/OpenSQZ/MiniCPM-V-CookBook (vLLM deployment pages).
- https://huggingface.co/OpenGVLab/InternVL3_5-{8B,14B,30B-A3B,38B,241B-A28B,GPT-OSS-20B-A4B-Preview}[-HF|-Flash] · https://github.com/OpenGVLab/InternVL · https://arxiv.org/html/2508.18265.

**vLLM and hardware (all sections)**
- https://raw.githubusercontent.com/vllm-project/vllm/main/docs/models/supported_models.md (last changed 2026-09-05) · `vllm/model_executor/models/registry.py` at tags v0.10.2 … v0.29.0 · https://api.github.com/repos/vllm-project/vllm/releases (v0.29.0 published 2026-09-09) · `vllm/config/multimodal.py` (`limit_mm_per_prompt` default 999) · https://www.nvidia.com/en-us/products/workstations/dgx-spark/.

**Boards (§4)**
- https://huggingface.co/spaces/opencompass/open_vlm_leaderboard (`meta_data.py`, `gen_table.py`) → http://opencompass.openxlab.space/assets/OpenVLM.json (`time` 20250917132916) · https://rank.opencompass.org.cn/leaderboard-multimodal (unreachable / 405) · https://github.com/open-compass/VLMEvalKit · https://arena.ai/leaderboard/vision (2026-08-27; redirect from lmarena.ai) · https://99franklin.github.io/ocrbench_v2/ (2026-06 board) · https://raw.githubusercontent.com/MMMU-Benchmark/mmmu-benchmark.github.io/main/leaderboard_data.json (newest 2025-11-24).

## 8. Could not verify

- Any vendor-documented **maximum number of images per request** for Qwen, Gemma, GLM, Kimi, MiniCPM, InternVL, Cosmos, MiniMax — only Llama 4 (5 tested), Nemotron-Nano-12B-v2-VL (4) and Pixtral (≥30) state one; vLLM's default cap is 999.
- GLM-5.3-Flash's per-image pixel/token cap (empty `processor_config.json`) and any vision benchmark for it; whether the token factory forwards `enable_thinking:false` to it.
- Whether the token factory's `google/gemma-3-27b-it` and `MiniMaxAI/MiniMax-M3` (typed `text->text`) count all eight images — the probe used one.
- Nemotron-Nano-V2-12B-VL and qwen3-vl-32b ids on Nebius (no document names them); whether deprecated ids survive as dedicated-endpoint templates (needs the authenticated templates endpoint).
- Upstream vLLM's expected `--hf-overrides` for Cosmos3-Super; official FP8/NVFP4 Cosmos checkpoints (NIM claims them, no ids found).
- Kernel support on GB10/sm_121a for every untested architecture (DeepSeek-V4 FP4 experts + DSpark, MiniMax MSA, NemotronH hybrid, Mistral Small 4 MoE) — dgx-manager's point; nothing in any vendor source addresses it.
- The Muse Glimmer and Gemma 4 recipes used for the #52 and April runs (not in the gateway's table; dgx-manager does not list them).
- `rank.opencompass.org.cn` (DNS/405) and a newer OpenCompass feed than 2025-09-17, if one exists.
- Qwen3.8-27B and Qwen3.5-397B DocVQA/ChartQA/OCRBench(3.8)/CountBench(3.8) — not on the cards; Gemma 4 DocVQA/ChartQA/OCRBench/RealWorldQA — not on the cards; Llama 4 Scout's MMMU/MathVista (column mis-read).
