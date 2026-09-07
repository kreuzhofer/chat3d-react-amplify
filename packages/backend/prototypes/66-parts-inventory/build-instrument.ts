/**
 * PROTOTYPE — wayfinder #66. Builds the `parts-inventory` variant instrument
 * from production's template, so the only difference between the two is the
 * inventory: everything else is a byte copy (the discipline of #35).
 *
 *   docker compose exec -T backend npx tsx prototypes/66-parts-inventory/build-instrument.ts
 *
 * Writes `instrument.txt` (the variant) and `instrument.diff.txt` beside it.
 */
import { writeFileSync } from "node:fs";
import { PRODUCTION_INSTRUMENT_TEMPLATE } from "../../src/services/visual-eval-instrument-templates.js";
import { validateInstrumentTemplate } from "../../src/services/visual-eval-instrument.service.js";

/**
 * The lever (#57, #63). Of the reference's 19 confirmed false passes on the
 * 125, most credit a part that is not in the scene: once a part is missing,
 * every item about it passes. Of the candidate's 10 confirmed false fails on
 * the corpus sample, six deny a cavity that is there: an open box read as a
 * solid block, a U-channel as a block, a bowl's opening as a floor. Both are
 * failures of the same prior act — taking stock of what is in the scene
 * before being asked whether a feature of it is correct.
 *
 * Three questions, in the order the errors need them: how many bodies and are
 * they apart; is each part the request names actually here; and is each body
 * solid, hollow or open, and which way does the opening face.
 */
const INVENTORY_SECTION = `FIRST — parts inventory:
Before you answer any checklist item, take stock of what the images actually show and write
it in "inventory".

- bodyCount / bodies: how many separate solid bodies are in the scene? Name each one in a few
  words and say whether it stands apart from the others with a visible gap, or meets them.
  Two shapes that touch along a face or an edge are ONE body, not two.
- partsNamed: for each part the request names, state whether it is present in the scene. A
  whole part — a lid, a second cylinder, a second leaf — cannot be hidden by occlusion the way
  an interior feature can: it would show in at least one of the eight views. If you cannot find
  it in any view, it is ABSENT. Never treat a part as present because the request asked for it.
- openings: for each body, say whether it is solid, hollow (shelled, with an interior cavity),
  or an open profile (channel, U, tube). Where it is hollow or open, name the view that shows
  the opening and say which way the opening faces. Read that direction from the LABELLED views,
  not from the shape of the cavity: an opening that shows in the bottom or 45° up view faces
  DOWN, one that shows in the top or 45° down view faces UP.

Then answer the checklist against this inventory. If an item asks about a part the inventory
found ABSENT, or about a feature of such a part, the item FAILS — a feature of a part that is
not in the scene cannot be correct.`;

/**
 * v2 (Daniel's call after v1's measurement). v1 moved the candidate 24.1% of
 * items with fail→pass running 61 to 6 and its pass rate 62.6% → 82.7%: it
 * did not fix perception, it wrote the same misreading down FIRST and then
 * believed it ("hollow, open at the top" of a body that is a solid block), so
 * every item about the cavity passed. The reference, whose errors are about
 * parts that are not there rather than about seeing, moved the other way.
 *
 * One change: the inventory may take an item AWAY but never grant it. An item
 * may cite it for absence, never for presence, and the judge is told in so
 * many words that it may contradict its own inventory — the escape hatch v1
 * did not give it.
 */
const V2_RULE = `Then answer the checklist. The inventory can only ever take an item AWAY, never grant it:

- If an item asks about a part the inventory found ABSENT, or about a feature of such a part, the
  item FAILS — a feature of a part that is not in the scene cannot be correct.
- Otherwise the inventory is NOT evidence. An item passes only on what you can see in the views at
  that location, named in its "detail" as always. Never cite the inventory to pass an item: having
  written "hollow", "open" or "present" above does not make a feature correct. If the views at that
  location do not show it, the inventory was wrong — say so in the detail and answer the item from
  the views.`;

const V1_RULE = `Then answer the checklist against this inventory. If an item asks about a part the inventory
found ABSENT, or about a feature of such a part, the item FAILS — a feature of a part that is
not in the scene cannot be correct.`;

const PRODUCTION_JSON_BLOCK = `Return JSON only:
{
  "score": <integer 1–10>,
  "issues": ["<geometric/structural problem>", ...],
  "suggestions": ["<rendering observation or code improvement>", ...]
}`;

/**
 * The inventory is the first key on purpose: on vLLM the schema is the
 * decoding grammar and its key order is the generation order, so the
 * inventory is written before any item is answered. On the Anthropic path
 * there is no grammar, and this block is the reference's only instruction.
 */
const VARIANT_JSON_BLOCK = `${INVENTORY_SECTION}

Return JSON only:
{
  "inventory": {
    "bodyCount": <integer>,
    "bodies": "<each body named; apart with a gap, or touching>",
    "partsNamed": "<each part the request names: present, or ABSENT>",
    "openings": "<each body: solid, hollow or open profile; which view shows the opening and which way it faces>"
  },
  "score": <integer 1–10>,
  "issues": ["<geometric/structural problem>", ...],
  "suggestions": ["<rendering observation or code improvement>", ...]
}`;

if (!PRODUCTION_INSTRUMENT_TEMPLATE.includes(PRODUCTION_JSON_BLOCK)) {
  throw new Error("production's JSON block has moved; the variant must be rebuilt against it");
}
const v1 = PRODUCTION_INSTRUMENT_TEMPLATE.replace(PRODUCTION_JSON_BLOCK, VARIANT_JSON_BLOCK);
if (!v1.includes(V1_RULE)) throw new Error("v1's rule is not in the built variant");
const v2 = v1.replace(V1_RULE, V2_RULE);

const here = new URL(".", import.meta.url).pathname;
for (const [name, text] of [["instrument.txt", v1], ["instrument-v2.txt", v2]] as const) {
  const errors = validateInstrumentTemplate(text);
  if (errors.length > 0) throw new Error(`${name} is not a valid instrument: ${errors.join("; ")}`);
  writeFileSync(`${here}${name}`, text);
  process.stdout.write(`${name}: ${text.length} chars (production ${PRODUCTION_INSTRUMENT_TEMPLATE.length}, +${text.length - PRODUCTION_INSTRUMENT_TEMPLATE.length})\n`);
}
writeFileSync(`${here}instrument.production.txt`, PRODUCTION_INSTRUMENT_TEMPLATE);
