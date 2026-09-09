### EX 1 `10a93ee5` — Hinges
> A long strap hinge: two tapered leaves, each 200mm long tapering from 40mm wide at the barrel end to 20mm wide at the tip, 2.5mm thick. Five 4mm mounting holes per leaf. Barrel with five knuckles and a 3.5mm pin.

- item 1: Do both leaves taper visibly from a wider barrel end to a narrower tip?
  - Sonnet **fail** — Top and bottom views: the overall shape is a symmetric lens/diamond tapering at both ends equally, not a shape that is widest at the barrel end and narrower at the tip. The 45° down view shows a nearly uniform-width flat strip with no clear wide-at-barrel, narrow-at-tip taper.
  - batch **pass** — Top view: The leaves clearly show a trapezoidal profile, being wider at the central barrel junction and tapering linearly to a narrower width at the outer tips.
- item 2: Are there exactly five knuckles on the barrel, visibly interleaved between the two leaves?
  - Sonnet **fail** — Front, left, right, 45° down views: only a tiny cylindrical stub is visible at the center of the hinge. No five distinct cylindrical knuckles are present; the barrel assembly is essentially missing.
  - batch **pass** — Left and Right views: The barrel section shows a segmented cylindrical structure. While the individual knuckles are small, the vertical extent and segmentation are consistent with a 5-knuckle barrel assembly.
- item 3: Does the pin pass through all five knuckles along the barrel axis?
  - Sonnet **fail** — 45° down view: a small pin stub is visible at the center, but since there are no knuckles present, the pin cannot be passing through any knuckle bores. The pin appears to simply protrude from the flat leaf surface.
  - batch **pass** — Front and Back views: A vertical cylindrical pin is visible extending through the center of the barrel assembly, consistent with the requested pin geometry.
- item 5: Are the two leaves extending in opposite directions from the shared barrel?
  - Sonnet **fail** — Top view and 45° down view: the model appears as a single continuous flat strip/diamond shape. There is no visible separation between two distinct leaves extending in opposite directions from a central barrel; the geometry looks like one merged flat piece.
  - batch **pass** — Top view: The two leaves extend horizontally in opposite directions (left and right) from the central vertical barrel, forming a straight line.

### EX 2 `1a2cb147` — Missing Examples
> A 2D closed profile consisting of a vertical line 4.5mm tall on the right, connected at the top by a circular arc that curves inward and upward to meet a point on the vertical axis 8mm above. The arc starts horizontal (tangent to the vertical line) at the top of the 4.5mm segment and ends at the tip point, forming a smooth ogive nose outline.

- item 2: Right side of profile includes a straight vertical segment at the bottom
  - Sonnet **pass** — 45° down view: the right edge of the extruded profile shows a straight vertical segment at the lower portion before the arc begins, consistent with the 4.5mm straight segment.
  - batch **fail** — Top/bottom views show the right edge as one continuous straight line from base to tip; there is no distinct short vertical segment at the bottom followed by a curve.
- item 3: Smooth continuous arc connecting the top of the vertical segment to the tip with no kink
  - Sonnet **pass** — 45° down view and top view: the curved edge of the profile transitions smoothly from the straight segment to the pointed tip, showing a continuous arc with no visible kink or discontinuity.
  - batch **fail** — No arc is visible on the right side in any view; the right edge is straight, and the only curve is on the left side, so the requested arc is missing.

### EX 3 `26d025de` — Simple Everyday Objects
> A simple coffee mug: cylindrical body 80mm diameter and 90mm tall with 3mm walls, a D-shaped handle on the side, open at the top.

- item 4: Does the handle form a closed loop (D-shape) that a finger could pass through?
  - Sonnet **fail** — Top view shows only a short straight tube protrusion rather than a closed D-loop; 45° down and up views show a very small loop opening that appears insufficient for finger clearance, and the handle lacks the characteristic flat straight side of a D-shape flush with the cylinder.
  - batch **pass** — Front and back views show the handle as a closed D-loop with a clear opening; the 45° views confirm the loop is continuous and large enough for finger clearance.

### EX 4 `2aa0d5f2` — PCB Cases
> A Wemos D1 case: rectangular box 80mm x 50mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: a USB cutout (12mm x 7mm). Flat lid 80mm x 50mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).

- item 2: Is there a rectangular cutout on one short side of the box?
  - Sonnet **pass** — 45° down view and 45° up view: a small rectangular notch/cutout is visible on one short side wall of the box, consistent with a USB port cutout
  - batch **fail** — Front, back, left, and right views show solid walls with no visible rectangular cutouts or slots.

### EX 5 `3c97d2c4` — Surface Modifications
> An extruded T-shape (cross-section T, 100mm long) with all sharp outer edges filleted to 3mm.

- item 3: Re-entrant notch edges (inner corners where stem meets flange underside) are also filleted
  - Sonnet **fail** — 45° down and 45° up views: the inner concave corners where the stem meets the underside of the flange appear sharp and unrounded, with no visible fillet transition at those re-entrant edges
  - batch **pass** — The 45° up view clearly shows the inner corners where the stem meets the underside of the flange are rounded, not sharp. The top view also shows the inner corners of the T-profile are rounded.

### EX 6 `59cd58c4` — Arrays and Patterns
> A bar 200mm × 15mm × 8mm with a row of triangular teeth 8mm wide and 5mm tall along one edge — a rack for a rack-and-pinion mechanism.

- item 3: 25 distinct triangular teeth visible along the toothed edge
  - Sonnet **fail** — [2x zoom] 45° up view: counting the distinct triangular teeth along the toothed edge reveals approximately 24 sharp triangular points visible along the full length of the bar, not 25.
  - batch **pass** — The 45° down view clearly shows a row of 25 distinct triangular teeth along the length of the bar.

### EX 7 `6170ff9d` — Missing Examples
> A 30mm × 30mm × 3mm flat rectangular base plate. Two cones, each with a base diameter of 8mm, top diameter of 2mm, and height of 6mm, are placed upright with their base faces flush on the top surface of the plate. The first cone is centered at 10mm from the left edge and 15mm from the front edge; the second cone is centered at 20mm from the left edge and 15mm from the front edge.

- item 1: Are there exactly two cone-like (tapered) shapes standing upright on the base plate?
  - Sonnet **fail** — 45° down view and front view: Two tapered shapes are present, but they appear as concave recesses cut into the plate rather than raised protrusions standing above it.
  - batch **pass** — Front and back views clearly show two distinct upright tapered shapes rising from the plate; the 45° down view confirms two separate cone-like features.

### EX 8 `620be3fc` — Arrays and Patterns
> A circular base 120mm diameter and 10mm thick with six evenly spaced T-slots (T cross-section, 8mm wide stem, 14mm wide head, 10mm deep) on a 80mm radius.

- item 4: Each T-slot has a narrow stem opening and wider undercut head forming a T cross-section
  - Sonnet **pass** — [2x zoom] 45° down view: each of the six slots shows a narrow upper opening at the top surface with wider undercut ledges visible on both sides below, forming the characteristic T cross-section with a stem and broader head.
  - batch **fail** — 45° down view shows the slots as uniform-width rectangular cutouts. There is no visible wider undercut channel (the horizontal bar of the T) beneath the narrower top opening. The slots appear to be simple rectangular through-holes rather than T-shaped cross-sections.

### EX 9 `6978676f` — Boolean Operations
> A castellated nut blank: hexagonal prism 30mm across flats and 25mm tall with six rectangular slots 4mm wide and 10mm deep cut from the top face downward, one slot centered on each flat face, each slot open to both the top surface and the outer flat.

- item 1: Overall shape is a hexagonal prism with a castellated (battlemented) top profile
  - Sonnet **pass** — 45° down view and front view: clearly shows a hexagonal prism with raised teeth and recessed slots at the top, forming a classic castellated/battlemented profile.
  - batch **fail** — Top and 45° down views show a star-shaped cross-section extending through the full height of the part, not a hexagonal prism with a castellated top.
- item 4: Lower unslotted portion of the prism is a clean solid with no features
  - Sonnet **pass** — Bottom view shows a clean uninterrupted hexagon; front and side views show the lower half of the prism is solid with no cutouts or features.
  - batch **fail** — 45° up view and side views show the slots extend all the way to the bottom of the part; there is no solid lower portion.

### EX 10 `6b30228e` — Missing Examples
> A cable duct assembly 200mm long consisting of two parts. The main body is a U-channel extruded 200mm along its length, with a 46mm wide by 33mm tall outer rectangular cross-section, 3mm uniform wall thickness on the bottom and both sides, and fully open along the top. The lid is a flat plate 46mm wide by 200mm long by 3mm thick, with a 2mm tall by 1.5mm wide rectangular retaining lip running the full 200mm length along each bottom edge, sized to fit snugly inside the open top of the U-channel.

- item 2: Is the main body open along the full top face (U-channel shape)?
  - Sonnet **pass** — 45° down view shows the U-channel body with open top, visible U-shaped cross-section with bottom floor and two side walls; front view also shows the U-profile outline.
  - batch **fail** — Front view: The body appears as a solid filled rectangle with no visible U-shaped cross-section or open top cavity. The 45° down view shows the body as a solid block without an internal hollow channel.

### EX 11 `6edac583` — Extrusions and Revolutions
> A kayak paddle blade: wide teardrop profile extruded 8mm — 200mm × 90mm blade.

- item 1: The profile outline passes through the point (0, 0) as a sharp cusp — the interior angle at the cusp vertex is acute (less than 90°) and the two curve tangents at that point are both directed along the positive X-axis (collinear), confirming a true pointed tip with no flat or rounded termination
  - Sonnet **pass** — Top view and bottom view: the left end of the teardrop profile terminates in a visibly pointed/sharp cusp with no flat or rounded termination; the 45° down and 45° up views also confirm a sharp pointed end on the left/narrow side of the blade
  - batch **fail** — Top and bottom views: the narrow end of the blade appears rounded/blunt rather than a sharp acute-angled cusp; no pointed vertex is visible at the left extremity.

### EX 12 `8099f7bc` — PCB Cases
> A Raspberry Pi 4 Model B case with lid. The case should fit the board with proper standoff mounting holes and port cutouts matching the Pi 4 port layout. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).

- item 5: Are there cylindrical standoff posts visible inside the box?
  - Sonnet **fail** — [2x zoom] 45° down view: Only one small cylindrical post is visible near the upper-left corner of the box interior floor; the other three expected standoff posts at the four corners of the 58×49mm pattern are absent, indicating the full set of 4 cylindrical standoff posts is not present.
  - batch **pass** — 45° down view shows cylindrical posts rising from the floor of the box, and the top view shows the corresponding holes in the lid.

### EX 13 `8c059166` — Sketch Operations
> A flat kidney-bean shape with a final bounding box of 80mm wide × 50mm tall × 1mm thick, formed by subtracting a smooth concave arc from the top of an ellipse. The concave indentation is along the top long side and curves inward approximately 15mm radially from the original ellipse boundary, using tangent-continuous curves with no sharp edges. Symmetry is not a criteria to judge.

- item 2: No sharp corners, cusps, or kinks are visible anywhere along the profile boundary
  - Sonnet **pass** — Top view and 45° down view: all transitions along the profile boundary appear smooth and continuously curved with no visible corners or kinks at the junctions between the concave and convex sections
  - batch **fail** — Top view: While the transitions from the concave arc to the convex sides are smooth, there is a distinct cusp or point at the center of the concave indentation, which violates the requirement for a smooth, kink-free boundary.

### EX 14 `8d43e195` — Missing Examples
> A cable duct assembly consisting of two separate parts. The first part is a U-channel 200mm long with a 40mm wide by 30mm deep inner cavity, 3mm wall thickness on the bottom and both sides, giving an outer width of 46mm and an outer height of 33mm, with the top fully open. The second part is a flat rectangular cover plate 46mm wide, 200mm long, and 2mm thick, positioned so that its underside sits exactly 10mm above the top edge of the U-channel, floating above it to clearly show the open, lifted state with a 10mm air gap between the channel opening and the cover.

- item 3: Upper part is a thin flat rectangular plate visibly floating above the channel
  - Sonnet **fail** — [2x zoom] 45° down view: The cover plate appears to be resting directly on top of the U-channel walls with no visible air gap between the plate's underside and the channel's top edge — the plate sits flush against the channel rather than floating above it with a visible 10mm gap.
  - batch **pass** — Left view: The upper part appears as a thin horizontal line (plate) floating above the main body. 45° down view: The flat rectangular plate is clearly visible floating above the channel.

### EX 15 `8d81a4b9` — Extrusions and Revolutions
> A kayak paddle blade: wide teardrop profile extruded 8mm — 200mm × 90mm blade.

- item 1: The profile outline passes through the point (0, 0) as a sharp cusp — the interior angle at the cusp vertex is acute (less than 90°) and the two curve tangents at that point are both directed along the positive X-axis (collinear), confirming a true pointed tip with no flat or rounded termination
  - Sonnet **pass** — Top view, bottom view, 45° down view, 45° up view: all show a clearly pointed/sharp cusp at the narrow end (left side of the shape), with no flat or rounded termination — the tip tapers to a distinct point
  - batch **fail** — Top and bottom views: the narrow left end of the profile is rounded/blunt rather than a sharp acute cusp, so the pointed shaft-junction tip is not clearly present.

### EX 16 `8ef4a5b9` — PCB Cases
> A Arduino Uno R3 case: rectangular box 77mm x 62mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: USB cutout (12mm x 7mm). Flat lid 77mm x 62mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).

- item 2: Are there exactly four standoff posts visible inside the box at the corners?
  - Sonnet **pass** — Top view: four small circular features are visible at the four interior corners of the box; 45° down view shows at least one standoff post clearly in the upper-left corner area
  - batch **fail** — 45° down view shows only one standoff post in the back-left corner; the other three corners appear empty.

### EX 17 `aa556764` — Missing Examples
> A flat 2D profile of a rectangular step shape: start at the origin, draw a horizontal line 10mm right, then a vertical line 5mm up, then a horizontal line 4mm left, then a vertical line 3mm up, then a horizontal line 6mm left, then close back down to the origin. The overall shape is a stepped rectangle lying flat.

- item 1: Shape has a clearly visible two-level stepped/staircase outline
  - Sonnet **pass** — Top view and bottom view both show a clear L/stepped outline with two rectangular levels; the 45° down and 45° up views confirm the staircase profile with a distinct notch cut from the upper-right corner.
  - batch **fail** — Top view and 45° down view show a single L-shaped step, not a two-level staircase profile. The model has one notch/step rather than two distinct horizontal levels.

### EX 18 `afe25cdc` — Electronic Components
> A simple I2C OLED cable management clip: small clip 30mm × 8mm × 4mm designed to route and secure a flat FFC cable along a surface.

- item 2: Are there retaining lips/flanges overhanging the channel on both sides to hold the cable in place?
  - Sonnet **fail** — Left/right views show a U-shaped cross-section with no visible inward overhang at the top of the walls; 45° down view shows the channel walls but no clearly distinguishable inward-projecting lips; the geometry appears to be a plain open U-channel
  - batch **pass** — Left and Right views: The cross-section shows a U-shape with the top edges extending slightly inward over the central gap, indicating the presence of retaining lips. 45° down view: The inner edges of the channel walls appear to overhang the central gap.

### EX 19 `b6de3001` — Extrusions and Revolutions
> A goblet cup revolved 360°: narrow 15mm-radius stem at the bottom, flaring outward via a concave arc to a 50mm-radius rim at the top, 80mm tall, 3mm wall thickness. The stem is a straight cylinder 20mm tall, then the bowl flares over 60mm.

- item 3: Bowl profile curves concavely (inward cup shape) as it flares from stem to rim
  - Sonnet **pass** — Front view and 45° down view: the bowl wall curves concavely outward from the narrow stem junction to the wide open rim, forming an inward-cupped bowl shape
  - batch **fail** — Front, back, left, and right views show the bowl profile curving outward (convex) rather than inward (concave), which does not match the requested concave arc.

### EX 20 `bf7400b0` — Sketch Operations
> A gear-tooth arc sketch: a small arc with a radial tooth projection, approximating a single gear tooth in 2D. Extruded to 1mm.

- item 1: Profile has a concave curved base edge (arc), not a straight bottom
  - Sonnet **fail** — [2x zoom] 45° up view: The base edge of the profile is clearly straight and flat — no concave arc curvature is visible; the bottom edge runs as a perfectly straight line across the full width of the extruded solid.
  - batch **pass** — Top view: A concave curved edge is clearly visible on the left side of the profile, forming the base of the shape.
- item 2: Exactly one tooth projection is present on the arc
  - Sonnet **pass** — 45° down view and top view: a single tooth-like projection extends from one side of the central slab body, with two flanks converging to a flat tip — one tooth confirmed
  - batch **fail** — Top view: Instead of a single tooth projection, the profile shows two long, sharp spikes extending from the arc endpoints, which does not match the description of a single gear tooth.
- item 3: Tooth cross-section is trapezoidal (wider at base than at tip)
  - Sonnet **pass** — Top view: the tooth profile shows a wider base connecting to the arc region and a narrower flat tip, consistent with a trapezoidal cross-section
  - batch **fail** — Top view: The shape is not a closed trapezoid. It is an open form with long, thin extensions, lacking the flat top edge and straight flanks of a trapezoidal tooth.

### EX 21 `e19192a3` — PCB Cases
> An ESP8266 bare module (ESP-12E) enclosure. The module is 24mm × 16mm. The case holds it in a recessed pocket with an antenna clearance notch on one short end. 2mm walls, open on top (no top face); no pin header cutouts — intended for firmware-flashed sealed use.

- item 4: Is there a recessed internal pocket/shelf visible inside the box?
  - Sonnet **fail** — [2x zoom] 45° down view: The interior shows a single flat floor surface at the bottom of the box with uniform walls rising from it — there is no visible raised shelf, ledge, or recessed pocket step inside; the floor appears continuous with no Z-height change creating a 1mm shelf.
  - batch **pass** — 45° down view: A recessed pocket is clearly visible inside the enclosure, with the pocket floor sitting below the top rim, creating the required shelf.

### EX 22 `e254a3fc` — Missing Examples
> A solid of revolution created by rotating an asymmetric profile 360° around a central vertical axis, forming a disc 100mm in outer diameter and 8mm thick, with a central cylindrical boss 25mm in diameter rising 20mm total height from the base (protruding 12mm above the disc surface), and a raised annular ring 15mm wide sitting 3mm above the disc surface, positioned between the boss and the outer edge of the disc.

- item 3: Does the boss appear taller than the annular ring above the disc surface?
  - Sonnet **fail** — Front view and 45° down view: the boss appears only marginally taller than the annular ring; given the 12mm vs 3mm protrusion ratio, the boss should appear approximately 4x taller than the ring, but the height difference looks much less pronounced
  - batch **pass** — In the front, back, left, and right views, the central boss extends vertically much higher than the intermediate annular ring step. The 45° down view also confirms the boss is the highest feature.

### EX 23 `ff87549e` — Missing Examples
> A cable saddle with a flat rectangular base 30×10×3mm, topped by a U-shaped channel centered along its length, with 8mm inner diameter, 1mm wall thickness on each side, and 12mm total height measured from the base top surface.

- item 3: Does the outer width of the U-channel match the base width?
  - Sonnet **pass** — Left/right views show the channel width appears approximately equal to the base width; 45° views confirm the channel does not dramatically overhang or undercut the base.
  - batch **fail** — Left and right views show the U-channel is narrower than the base, with a flat ledge of the base visible on the left side of the channel.
- item 4: Is the U-channel centered on the base along both axes?
  - Sonnet **pass** — Front and top views show the channel runs centered along the length; left/right views show it centered on the width of the base.
  - batch **fail** — Left and right views show the channel is offset to the right, not centered on the base width.
