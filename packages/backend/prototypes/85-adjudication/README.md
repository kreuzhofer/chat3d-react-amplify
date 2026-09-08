# PROTOTYPE — wayfinder #85: adjudicate the 70 disagreements of the re-qualification

Throwaway record. Primary source for the resolution on [issue #85](https://github.com/kreuzhofer/chat3d-app/issues/85)
(map #45). No code lands with this ticket; its product is Daniel's item verdicts, which decide ADR 0004's adjudicated
terms for `qwen3.8-27b-nvfp4` (thinking off) under `production@4892d8d1b160`.

## The material

- The dump: `../83-requalification/disagreements-qwen-vs-sonnet.md` — candidate arm A `05c9a31e` (N=3/R=3, the 3-node
  pool) against the reference `bc4354d4` (Sonnet 4.6, Anthropic API, thinking off, follow-up guarded per #64) on the
  fixed 125. **70 items on 47 examples, all hard pass/fail flips**; 6 where arm B answered differently from arm A.
  #86 settled the caveat the ticket raised: the pool is fit as it is, no rebuild, so arm A stands and nothing is re-read.
- `items85.json` — the dump as records (`../63-spot-check/dump2json63.py`, path-generic), with the third-opinion
  fields filled by the reading. `reading-list85.md` — the same, per example, for reading beside the sheets.
- `views/` (not committed) — the eight stored views of the 47 examples (`../63-spot-check/views63.sh`, absolute paths);
  `sheets/` (not committed) — two 2×2 contact sheets per example (`../63-spot-check/contact63.py` in the build123d
  container). Single views at full size where a count, a small cutout or an edge feature decided it
  (`4257c1e4` 45° up, `4e3686ec` and `eb61185b` left + 45° down, `b4f1e555` 45° down).
- `third85.py` — one call per item, writes `third`, `confidence`, `what`, `deciding_view`, `resolved_by` into the records.
- `build85.py` — `sheet` → `third-opinion85.md`; `page VIEWS_DIR OUT` → the adjudication page (#57's template,
  retitled; verdicts land in the page's store as `verdicts/<example>-<item>`). `adjudicated85.json`, when present,
  holds Daniel's verdicts read back from the store.

## The page

*The Re-qualification* — https://claude.ai/code/artifact/e265b10f-06a3-4e37-86eb-4778acff385c (capability `db`,
collection `verdicts`; 11.7 MB, views inlined). One card per item: prompt, item, both judges' evidence, the eight views,
the third opinion with its confidence and deciding view, and R / C / N with a note.

## The third opinion (triage, not verdicts)

Fable 5.1, from the sheets and the single views, 2026-09-08 (`third-opinion85.md`):

| direction | items | R (Sonnet right) | C (candidate right) | N |
|---|---|---|---|---|
| candidate passes, Sonnet fails | 28 | 15 | 11 | 2 |
| candidate fails, Sonnet passes | 42 | 21 | 18 | 3 |

As read: **candidate false passes 15 vs Sonnet 18 — holds; candidate false fails 21 vs Sonnet 11, allowance 22 —
holds by one item**; 5 N. The margin is a single verdict, so the reading is not a result: Daniel's adjudication is.

What the reading found, in the judges' words rather than the tally's:

- **The candidate's false fails are still perception on large visible features** — a filled pin read as empty space
  (`4187966c`, `e49fe4ea` ×2), a flat two-leaf hinge read as a V (`8811fab8`), an open box read as closed (`f1f0a16c`
  ×2, `f4d6cff1` ×2, `efce5923` ×2), a visible seam read as a gap (`92977023`), a tapered strap read as parallel
  (`bd78cd78`) — plus a new class: **counting from the wrong feature** (`4963f2df` #3, `4890e064`'s spine) and
  **failing an item for a defect another item covers** (`59a6c7e3`, `b0fbb05d`, `676fd7b2` #5).
- **Sonnet's false passes are leniency on broken models, and twice a misread view direction**: a cavity seen *from
  below* passed as "open side up" (`91288207`, `b86a0f72`); a perpendicular rod passed as the axial pin (`4890e064`,
  `8811fab8`); a smooth rod passed as a pin through five knuckles that do not exist (`bd78cd78`); an oversized
  detached frame passed as a stacking lip while describing the defect (`7c4e61f5`, `8d2ec9e8`); a "clear gap" that no
  view has (`676fd7b2`, `f06eafd6`); an inverted cone passed as tapering to a point (`d3d877e7`).
- **Sonnet's false fails are undercounts and mis-assigned walls** (`3069c73d` #6, `7ec78504` #2, `f6cf328b`, `c7185bf2`)
  and a frame's mirror read as a second cutout (`fea1a4fa`).
- **Five N**: two featureless lids (`3d5ac379`, `def76ef7`), a 1 mm chamfer below render resolution (`4257c1e4`), a
  proportion the spec contradicts (`aeca37d7`), a criterion that compares a width to a length (`bb59ae21`) — the fog's
  class, "criteria no render can answer". Two more low-confidence calls flagged for Daniel: `56a2ef96` #4 (does a plain
  1 mm rim count as a "lip/profile"?) and `f4d6cff1` #1 (a slot on the longer face of a box whose proportions are wrong).
- **The four PCB-case standoff items** (`485cf1ba`, `4e3686ec`, `7ec78504`, `eb61185b`, `f49ccea5`, `b6caba81`) read the
  same way: the top view's corner rings are floor features, one post stands in 45° down. If Daniel reads the rings as
  posts, five R become C at once — the single largest swing in the set.
