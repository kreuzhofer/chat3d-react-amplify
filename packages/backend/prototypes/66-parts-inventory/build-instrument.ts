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
const variant = PRODUCTION_INSTRUMENT_TEMPLATE.replace(PRODUCTION_JSON_BLOCK, VARIANT_JSON_BLOCK);

const errors = validateInstrumentTemplate(variant);
if (errors.length > 0) throw new Error(`variant is not a valid instrument: ${errors.join("; ")}`);

const here = new URL(".", import.meta.url).pathname;
writeFileSync(`${here}instrument.txt`, variant);
writeFileSync(`${here}instrument.production.txt`, PRODUCTION_INSTRUMENT_TEMPLATE);
process.stdout.write(
  `variant written: ${variant.length} chars (production ${PRODUCTION_INSTRUMENT_TEMPLATE.length}, +${variant.length - PRODUCTION_INSTRUMENT_TEMPLATE.length})\n`,
);
