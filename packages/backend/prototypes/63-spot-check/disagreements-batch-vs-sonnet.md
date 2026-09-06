# Disagreements: production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) vs Claude Sonnet 4.6 (Anthropic API, thinking off)

Instrument: `production@22e0f10b0505`. 26 disagreeing items on 17 examples (25 hard pass/fail flips, 1 with one side uncertain).

Verdict column: `R` the reference is right, `C` the candidate is right, `N` neither or the item is unanswerable, with a note if needed. The candidate's confirmed false passes must not exceed the reference's; its confirmed false fails must not exceed twice the reference's (ADR 0004).

## 1. Boolean Operations — example `2a53e951-becc-4a0b-ab14-a73953ab042e`

> A connecting rod blank: two cylinders 40mm and 30mm diameter and 20mm tall each, connected by a flat rectangular strap 80mm × 20mm × 10mm.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 2 | Is a flat rectangular strap visible connecting the two cylinders? | **fail** — Front and 45° down views show a flat rectangular strap extending from the large cylinder, but it does not connect to a second cylinder — it terminates freely, so it cannot be called a connecting strap between two bosses | **pass** — Front, back, and top views clearly show a flat rectangular strap extending from the large cylinder to the right. |  |

## 2. Missing Examples — example `6b30228e-9281-464d-a872-affef9a6a32b`

> A cable duct assembly 200mm long consisting of two parts. The main body is a U-channel extruded 200mm along its length, with a 46mm wide by 33mm tall outer rectangular cross-section, 3mm uniform wall thickness on the bottom and both sides, and fully open along the top. The lid is a flat plate 46mm wide by 200mm long by 3mm thick, with a 2mm tall by 1.5mm wide rectangular retaining lip running the full 200mm length along each bottom edge, sized to fit snugly inside the open top of the U-channel.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 2 | Is the main body open along the full top face (U-channel shape)? | **pass** — 45° down view and front/back views: the body shows a clear U-shaped cross-section with open top, bottom floor, and two vertical side walls. | **fail** — Front, back, and 45° views show the body as a solid rectangular block with a flat top surface; no open U-channel cavity is visible. |  |

## 3. Missing Examples — example `6c9f8897-435b-4cae-8931-888581fa416a`

> A hollow wine glass bowl with no stem and no base, formed by revolving a parabolic profile 360 degrees around a vertical axis. The rim diameter is 70mm at the top, the bowl is 100mm tall, and the wall thickness is 2mm throughout. The profile curves inward parabolically so the bottom of the bowl interior is approximately 20mm in diameter. The bowl is open at the top and open at the bottom — it is only the curved cup portion, like a wine glass bowl that has been separated from its stem.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 3 | Bottom of the bowl is open (no solid floor, annular bottom edge only) | **pass** — Bottom view and 45° up view: the bottom shows an annular ring with a central circular opening (hole), confirming no solid floor. The 45° up view clearly shows the small circular opening at the bottom with a visible annular rim edge. | **fail** — The bottom view shows a solid, dark circular surface with only a small central hole. The 45° up view confirms this, showing a solid base with a small opening, not the large open annular ring specified. |  |

## 4. Boolean Operations — example `7f1f456f-c3a3-4622-bc3f-652b5c9aed7a`

> A pipe flange: cylinder 80mm diameter and 15mm tall fused to a disc 140mm diameter and 10mm tall, with four 12mm bolt holes through the flange.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 5 | Do the bolt holes appear to pass fully through the flange disc? | **fail** — [2x zoom] The high-resolution image shows the flange disc and hub assembly with no visible bolt holes anywhere on the flange surface or passing through it — the top surface is completely smooth with no circular cutouts at the bolt circle radius. | **pass** — The bottom view shows the holes as through-cuts, and the 45-degree up view shows the internal cylindrical walls of the holes, confirming they penetrate the flange thickness. |  |

## 5. Extrusions and Revolutions — example `8d81a4b9-e276-4e86-8c9f-b19c8f1e9ec3`

> A kayak paddle blade: wide teardrop profile extruded 8mm — 200mm × 90mm blade.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | The profile outline passes through the point (0, 0) as a sharp cusp — the interior angle at the cusp vertex is acute (less than 90°) and the two curve tangents at that point are both directed along the positive X-axis (collinear), confirming a true pointed tip with no flat or rounded termination | **pass** — Top view, bottom view, 45° down view, 45° up view: all show a clearly pointed/sharp cusp at the narrow end of the teardrop, with no flat or rounded termination visible at that end | **fail** — Top and bottom views: the narrow end of the blade appears rounded/blunt rather than a sharp acute cusp, so a true pointed tip is not clearly visible. |  |

## 6. Boolean Operations — example `931f5865-ab3a-40ee-a18d-7a657f8e4d85`

> A ring with three evenly spaced ball seats: torus 80mm major radius, 10mm minor radius, with three 12mm hemisphere pockets at 120-degree intervals.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 2 | Are there exactly three hemispherical pockets visible on the torus surface? | **fail** — [2x zoom] The image shows what appears to be a small arc/segment of a torus tube viewed edge-on, with a smooth, featureless surface — no hemispherical pockets or recesses of any kind are visible anywhere on the surface. | **pass** — Top view shows three distinct circular indentations on the inner surface of the ring; 45° views confirm these are recessed pockets. |  |
| 4 | Do the pockets appear to sit on the top/outer surface of the torus cross-section? | **pass** — 45° down view and 45° up view show the visible pocket(s) located on the outer equatorial surface of the torus tube, consistent with radially outward placement at Z=0 | **fail** — Top view shows the pockets are located on the inner equatorial surface (facing the center hole), whereas the specification and prompt imply they should be on the outer surface. |  |

## 7. Missing Examples — example `9ea7e0ca-1f70-4d7f-b2c6-f885ea4c08a5`

> A cable duct assembly consisting of two separate non-touching parts. The first part is a U-shaped channel 200mm long with a 40mm wide by 30mm deep inner cavity, 3mm wall thickness on the bottom and both sides, open on top, giving outer dimensions of 46mm wide by 33mm tall by 200mm long. The second part is a flat rectangular cover plate 46mm wide, 4mm thick, and 200mm long, positioned 10mm directly above the open top of the channel, floating parallel to it and not touching it.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | Two completely separate, non-touching solid bodies are present in the assembly | **pass** — Left and right views show two distinct vertical strips with a clear gap between them; top view shows the U-channel outline and a separate thin strip above it; 45° down view confirms two separate bodies with visible air gap between channel top and cover plate bottom. | **fail** — 45° down and 45° up views show only a single flat rectangular plate. There is no second body (the channel) visible in any view. |  |
| 2 | First part is a U-shaped open-top channel with uniform side and bottom walls | **pass** — 45° down view clearly shows a U-shaped channel with two side walls and a bottom wall, open at the top; 45° up view confirms the open-top U profile with visible interior cavity; top view shows the U-shaped wall outline. | **fail** — No U-shaped channel is visible in any of the 8 views. The top and bottom views show only a single rectangular outline, not the U-profile of a channel. |  |

## 8. Simple Everyday Objects — example `a1133fbd-a11a-4cc4-bf01-a761517f5d4b`

> A simple wall-mount key holder: flat plate 200mm × 80mm × 8mm with five small hook cylinders (8mm diameter, 20mm long) projecting forward along the bottom edge, and two mounting holes at the top.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | Are there exactly five cylindrical hooks projecting forward from the bottom edge? | **pass** — Front view and 45° down/up views: five distinct cylindrical pegs are clearly visible, evenly distributed along one long edge of the plate. Count confirmed as five. | **fail** — Front and 45° views show five hooks, but they are located along the top edge of the plate, not the bottom edge. |  |
| 2 | Are the five hooks evenly spaced along the bottom edge? | **pass** — Front view and top view: the five hooks appear at regular, equal intervals across the full width of the plate, consistent with even spacing. | **fail** — The hooks are evenly spaced, but they are located along the top edge, not the bottom edge. |  |
| 3 | Are there exactly two mounting holes near the top of the plate? | **pass** — Top view and bottom view: two small circular holes are clearly visible near the corners of the plate on the edge opposite the hooks, one on each side. Confirmed in 45° down and 45° up views as well. | **fail** — Top and bottom views show two mounting holes, but they are located near the bottom edge of the plate, not the top. |  |

## 9. Generic Enclosures — example `a8a73230-ae44-4e91-b2d2-45508f85e622`

> A simple signal relay enclosure with terminal blocks on one face: 100mm × 60mm × 50mm box, 3mm walls, open on top (no top face), four 8mm terminal block entry holes on one face.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 3 | Are the four holes roughly evenly spaced and aligned horizontally on the same face? | **fail** — Front view: the four holes appear unevenly distributed — three are clustered toward the left-center portion of the face and one is isolated further to the right, suggesting uneven spacing rather than uniform 20mm intervals across the full width. | **pass** — Front view shows the four holes aligned horizontally at the same height with even spacing across the face. |  |

## 10. Extrusions and Revolutions — example `b1a1a823-4c61-4ab4-98da-a595d06b1be1`

> A kayak paddle blade: wide teardrop profile extruded 8mm — 200mm × 90mm blade.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | The profile outline passes through the point (0, 0) as a sharp cusp — the interior angle at the cusp vertex is acute (less than 90°) and the two curve tangents at that point are both directed along the positive X-axis (collinear), confirming a true pointed tip with no flat or rounded termination | **pass** — Top view, bottom view, 45° down view, 45° up view: all show a clearly pointed/sharp cusp at the narrow end of the teardrop, with no flat or rounded termination visible at that end. The cusp appears acute and well-defined. | **fail** — Top and bottom views: the narrow end of the blade appears as a soft rounded taper rather than a sharp acute cusp; no clear pointed vertex is visible at the left end. |  |

## 11. Sketch Operations — example `bf7400b0-303e-46c6-a35c-771dfb99d744`

> A gear-tooth arc sketch: a small arc with a radial tooth projection, approximating a single gear tooth in 2D. Extruded to 1mm.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | Profile has a concave curved base edge (arc), not a straight bottom | **fail** — Top and bottom views show the base edge of the profile appears as straight angled lines rather than a smooth concave arc; the 45° down view also shows no visible curvature on the base edge | **pass** — Top view: The left edge of the profile is clearly a concave curve, consistent with an arc segment. |  |
| 2 | Exactly one tooth projection is present on the arc | **pass** — Top/bottom views and 45° down view clearly show one tooth-like projection extending from the main body on one side | **fail** — Top view: The shape does not look like a tooth projection on an arc. It looks like a single, irregular shape. There is no clear 'tooth' rising from a 'base' arc. |  |
| 3 | Tooth cross-section is trapezoidal (wider at base than at tip) | **pass** — [2x zoom] The cross-section profile shows flanks that angle inward from a wider base (arc bottom) to a narrower flat tip, forming a trapezoidal shape wider at the base than at the tip, consistent with the specification. | **fail** — Top view: The cross-section is not trapezoidal. The top and bottom edges are not straight lines converging to a flat tip. The shape is irregular. |  |

## 12. Surface Modifications — example `c33b466e-293c-4d3d-af2c-5a708a67eef6`

> A rectangular block 100mm × 80mm × 50mm with the bottom corners filleted to 15mm — rounded base corners only.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 2 | Top face is a flat rectangle with sharp right-angle corners | **pass** — 45° down view shows the top face as a flat, uniformly lit surface; the top perimeter edges appear sharp where the flat top meets the vertical corner fillets, with no rounding of the top horizontal edges. | **fail** — The top view shows a rounded-rectangle shape, not a sharp-cornered rectangle. The 45° down view confirms the top face perimeter follows the same rounded profile as the bottom, meaning the top corners are also filleted. |  |
| 3 | Bottom face is a flat rectangle with sharp right-angle corners | **pass** — 45° up view and bottom view show the bottom face as flat; the bottom perimeter edges appear sharp where the flat bottom meets the vertical corner fillets, consistent with no horizontal edge fillets at the base. | **fail** — The bottom view shows a rounded-rectangle shape, not a sharp-cornered rectangle. The 45° up view confirms the bottom face perimeter is rounded, matching the top. |  |

## 13. Surface Modifications — example `d0b3fa7e-41db-47b2-9e0f-f604ae07f95c`

> A box 80mm × 60mm × 30mm with the four corners of the top face filleted to a 10mm spherical corner (all three edges at each corner filleted together).

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 4 | Side faces and bottom face are flat and unmodified between the corner fillets | **pass** — [2x zoom] The image shows a top-down view of the box with flat, uniform side edges and bottom corners that are straight and unmodified between the rounded corner fillets, with no additional curvature or modification visible along the straight sections. | **fail** — The bottom face is not unmodified; the 45° up view shows the bottom corners are rounded, which modifies the bottom face geometry. |  |

## 14. Surface Modifications — example `d7270e36-4802-4a72-8d63-83429e213ae5`

> A hollow box with textured wall thickness: 100mm × 80mm × 60mm outer, shelled to 5mm uniform walls, open top.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | Is the top of the box fully open (no lid or roof)? | **pass** — 45° down view and top view: the top view shows a clear annular rim with a darker open cavity inside; the 45° down view confirms no lid or roof is present. | **fail** — Top view: Shows a solid rectangular surface covering the entire area, indicating a closed top. 45° down view: Shows a flat top face, not an opening. |  |
| 2 | Does the box appear hollow when viewed from above? | **pass** — Top view and 45° down view: the top view shows a lighter outer rim surrounding a darker interior rectangle, confirming a hollow cavity; the 45° down view shows interior walls and floor clearly. | **fail** — Top view: The interior is not visible; the surface is solid. 45° down view: The interior cavity is not visible, confirming the top is closed. |  |
| 3 | Do all four sides and the bottom appear to have equal wall thickness? | **pass** — Top view: the rim appears uniform in width on all four sides; 45° down view confirms consistent wall thickness on visible sides; bottom view shows a solid flat face consistent with a 5mm floor. | **uncertain** — Since the box appears solid (not hollow), wall thickness is not applicable or visible. The exterior dimensions are consistent with a solid block. |  |

## 15. PCB Cases — example `db0529f3-975b-4b24-a06f-4f2498b55fbe`

> A XIAO ESP32 case: rectangular box 29mm x 25mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: USB-C cutout (12mm x 7mm). Flat lid 29mm x 25mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 4 | Are there 4 standoff posts visible inside the box at the corners? | **fail** — 45° down view shows only one cylindrical standoff post visible in one corner of the interior; top view shows 4 circular holes at corners (from axial holes) but only one post protrudes visibly, suggesting 3 standoffs are missing or not modeled. | **pass** — Top view clearly shows four circular posts at the corners of the interior. 45° down view shows the posts rising from the floor. |  |

## 16. Missing Examples — example `e752ba5c-2f0a-4e35-a1b4-5000247b361b`

> A 30mm wide, 3mm tall, 3mm thick downward-facing lip extending vertically downward from the inward end of a 4mm horizontal ledge, completing a squared hook cross-section profile.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 1 | The solid has exactly 10 faces: 2 end faces (YZ plane cross-sections at X=0 and X=30), and 8 lateral faces corresponding to the 6 outer edges of the L-profile extruded along X | **fail** — [2x zoom] The image shows only a single flat rectangular blue surface with no visible end faces, lateral step faces, or L-profile geometry — the model appears to render as a simple flat slab with no discernible face count of 10 or hook/J-profile structure visible. | **pass** — 45° down and 45° up views: The model is a single extruded solid with two flat end caps and a series of flat lateral faces running along the length, consistent with the expected face count for this profile. |  |

## 17. Simple Everyday Objects — example `efca1c1e-edab-432f-b23b-a3a7c0659e7a`

> A simple toothpaste tube cap: cylinder 22mm outer diameter and 20mm tall, open at one end with internal threads approximated by a slight taper.

| # | item | Claude Sonnet 4.6 (Anthropic API, thinking off) | production rating by vllm-dgx-14/qwen3.8-27b-nvfp4 (off) | verdict |
|---|---|---|---|---|
| 3 | Does the interior appear to taper slightly (narrower toward the closed top)? | **fail** — [2x zoom] The image shows only the closed top face of the cap — a solid, flat circular surface with no interior bore visible, so the tapered inner wall cannot be assessed from this top-down view. | **pass** — The 45° up view shows the interior wall sloping inward toward the top, and the bottom view shows the inner bore appearing smaller than the outer opening, consistent with a tapered cavity. |  |
