// PROTOTYPE FIXTURE (throwaway): 16 of the 70 disagreements of #85, from prototypes/85-adjudication/items85.json.
// Views are fetched live from the screenshot route; nothing here is inlined.
import type { PrototypeItem } from "./types";

export const FIXTURE_ITEMS: PrototypeItem[] = [
  {
    "id": "230a3336-1",
    "exampleId": "230a3336-9aa2-451e-873d-73c0e8403c85",
    "category": "Gridfinity Storage",
    "prompt": "Create a 1x1 Gridfinity bin, 5 height units, no compartments, no lip — a simple deep cup bin",
    "itemIndex": 0,
    "question": "Is the top edge open with no lip or rim overhang?",
    "ref": {
      "state": "fail",
      "detail": "Top view and 45° down view: the top surface appears completely solid/flat with no open cavity visible; a correct open bin should show the interior cavity walls and floor from above"
    },
    "cand": {
      "state": "pass",
      "detail": "Front, back, left, and right views show a flat top edge with no overhanging lip or rim. The 45-degree down view confirms a flat top surface."
    },
    "triage": {
      "verdict": "R",
      "confidence": "high",
      "what": "top and 45° down show a closed, flat, rounded-square top; 45° up shows only a shallow foot recess — there is no cavity, the bin is a solid block, so its top edge is not open at all",
      "decidingView": "top, 45° down",
      "resolvedBy": "views as they are (candidate credited a flat top as an open rim without a lip)"
    }
  },
  {
    "id": "3069c73d-2",
    "exampleId": "3069c73d-5480-4994-a3c5-4de3ff90d7d7",
    "category": "PCB Cases",
    "prompt": "An Adafruit Feather RP2040 case. Board is 51mm × 23mm; USB-C replaces micro-USB. Same geometry as Feather M0 otherwise. Lid has a small reset button access hole (3mm diameter). Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).",
    "itemIndex": 1,
    "question": "Is the case body oriented with its open cavity facing upward?",
    "ref": {
      "state": "pass",
      "detail": "45° down view: Clearly shows the open rectangular cavity facing upward with interior floor, walls, and standoff posts visible from above."
    },
    "cand": {
      "state": "fail",
      "detail": "The 45° down view shows the open cavity and internal floor/standoffs facing toward the right side of the image, not upward; the top view shows a closed flat top face."
    },
    "triage": {
      "verdict": "R",
      "confidence": "high",
      "what": "45° down shows the open cavity facing up with the floor, a standoff and two wall cutouts seen from above; the top view shows the interior floor, not a closed face",
      "decidingView": "45° down, top",
      "resolvedBy": "views as they are (candidate read the open cavity as facing sideways)"
    }
  },
  {
    "id": "3069c73d-6",
    "exampleId": "3069c73d-5480-4994-a3c5-4de3ff90d7d7",
    "category": "PCB Cases",
    "prompt": "An Adafruit Feather RP2040 case. Board is 51mm × 23mm; USB-C replaces micro-USB. Same geometry as Feather M0 otherwise. Lid has a small reset button access hole (3mm diameter). Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).",
    "itemIndex": 5,
    "question": "Is there a rectangular port cutout on one short wall of the case body?",
    "ref": {
      "state": "pass",
      "detail": "45° down view: Two rectangular cutouts are clearly visible on one short wall of the case body, consistent with USB-C and JST connector slots. Back view also shows faint rectangular outlines on the wall."
    },
    "cand": {
      "state": "fail",
      "detail": "The 45° down view shows two rectangular cutouts on the long wall (the 54mm face), not on the short wall; the short walls (left/right views) appear solid with no cutouts."
    },
    "triage": {
      "verdict": "C",
      "confidence": "high",
      "what": "the two rectangular cutouts sit on the far long wall in 45° down and show through the back view; the left and right views — the short walls — are solid, and a Feather's USB-C is on its short end",
      "decidingView": "45° down, back, left, right",
      "resolvedBy": "views as they are (Sonnet placed the cutouts on the wrong wall; arm B agreed with Sonnet)"
    }
  },
  {
    "id": "30f7cab2-1",
    "exampleId": "30f7cab2-dd52-4ef3-ae02-65dde4b62327",
    "category": "Hinges",
    "prompt": "A long strap hinge: two tapered leaves, each 200mm long tapering from 40mm wide at the barrel end to 20mm wide at the tip, 2.5mm thick. Five 4mm mounting holes per leaf. Barrel with five knuckles and a 3.5mm pin.",
    "itemIndex": 0,
    "question": "Do both leaves taper visibly from a wider barrel end to a narrower tip?",
    "ref": {
      "state": "fail",
      "detail": "Top and bottom views show the combined assembly tapering from a wider center outward to narrow tips on both sides — this suggests the widest point is at the center (barrel junction) which is correct for the barrel end being widest, but the taper appears symmetric like a lens/diamond shape rather than two separate trapezoidal leaves. The 45° down view shows nearly uniform width along most of the length with only slight taper, making the taper less convincing than expected."
    },
    "cand": {
      "state": "pass",
      "detail": "Top view: Both leaves clearly show a trapezoidal taper, wider at the center (barrel end) and narrowing toward the tips on both left and right sides. The 45-degree views also confirm the taper."
    },
    "triage": {
      "verdict": "C",
      "confidence": "medium",
      "what": "top and bottom show one long strip widest at the centre and narrowing to both tips — two trapezoidal leaves joined at their wide ends, which is the lens shape Sonnet objected to; the taper is slight at this scale but present on both leaves",
      "decidingView": "top, bottom",
      "resolvedBy": "views as they are (Sonnet failed the taper for looking like what two tapered leaves look like)"
    }
  },
  {
    "id": "30f7cab2-3",
    "exampleId": "30f7cab2-dd52-4ef3-ae02-65dde4b62327",
    "category": "Hinges",
    "prompt": "A long strap hinge: two tapered leaves, each 200mm long tapering from 40mm wide at the barrel end to 20mm wide at the tip, 2.5mm thick. Five 4mm mounting holes per leaf. Barrel with five knuckles and a 3.5mm pin.",
    "itemIndex": 2,
    "question": "Does the pin pass through all five knuckles along the barrel axis?",
    "ref": {
      "state": "fail",
      "detail": "[2x zoom] 45° down view: At the barrel end (center of the assembly), only a single small cylindrical pin stub is visible protruding above the leaf surface with no knuckle cylinders surrounding it — the five interleaved knuckles are entirely absent, so the pin cannot be passing through all five knuckles."
    },
    "cand": {
      "state": "pass",
      "detail": "Front and back views: A thin cylindrical pin is visible protruding vertically from the center of the barrel, consistent with a pin passing through the knuckle bores. The 45-degree views also show the pin at the barrel center."
    },
    "triage": {
      "verdict": "R",
      "confidence": "high",
      "what": "at the centre there is only a short vertical pin stub and a diagonal seam; no barrel and no knuckle cylinders exist in any view, so the pin passes through nothing",
      "decidingView": "45° down, front, top",
      "resolvedBy": "views as they are (candidate credited knuckles that are not in the scene)"
    }
  },
  {
    "id": "3d5ac379-6",
    "exampleId": "3d5ac379-03bd-48e6-a657-145308b3b02a",
    "category": "PCB Cases",
    "prompt": "A Raspberry Pi 4 compute case: rectangular box 93mm x 64mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: USB-A cutout (15mm x 8mm), Ethernet cutout (17mm x 15mm), HDMI cutout (16mm x 6mm). Flat lid 93mm x 64mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).",
    "itemIndex": 5,
    "question": "Is the lid inverted (flat top face touching the ground plane)?",
    "ref": {
      "state": "pass",
      "detail": "[2x zoom] 45° up view: The lid is shown as a flat rectangular plate with its large flat face facing downward (toward the ground plane) and only a thin edge visible at the top, confirming the flat top face is touching the ground plane and the bottom face is uppermost."
    },
    "cand": {
      "state": "fail",
      "detail": "45° down view shows the lid is resting on the ground with its top surface facing up, not inverted."
    },
    "triage": {
      "verdict": "N",
      "confidence": "medium",
      "what": "the lid is a plain 3 mm slab with no lip, rim or feature on either face — 45° down and 45° up show the same flat plate — so nothing in the scene distinguishes right-way-up from inverted; both judges assert what a featureless plate cannot show (the case itself is four loose standoffs and a small block, a separate failure)",
      "decidingView": "45° down, 45° up",
      "resolvedBy": "unanswerable from a render — a featureless slab has no orientation (the #57 precedent)"
    }
  },
  {
    "id": "4187966c-2",
    "exampleId": "4187966c-35d8-46ef-b318-d339edcbd0f0",
    "category": "Hinges",
    "prompt": "A single-axis pivot hinge with a top-mount plate: a 50mm x 50mm x 3mm square top plate with four 4mm corner mounting holes and a 6mm-diameter central pivot pin extending 15mm downward. A matching bottom plate receives the pin in a 6.2mm bore.",
    "itemIndex": 1,
    "question": "Is there a cylindrical pin projecting downward from the center of the top plate?",
    "ref": {
      "state": "pass",
      "detail": "Front, back, left, right views: a dark cylindrical pin is clearly visible projecting downward from the center of the top plate toward the bottom plate"
    },
    "cand": {
      "state": "fail",
      "detail": "Front, back, left, and right views: There is a visible gap between the top and bottom plates, but no cylindrical pin is present in the center to connect them."
    },
    "triage": {
      "verdict": "R",
      "confidence": "high",
      "what": "a dark cylinder runs from the centre of the top plate's underside down to just above the bottom plate in all four side views",
      "decidingView": "front, back, left, right",
      "resolvedBy": "views as they are (candidate denied a pin that fills the gap between the plates)"
    }
  },
  {
    "id": "4257c1e4-1",
    "exampleId": "4257c1e4-da50-44e6-b7c6-279a2017eabb",
    "category": "Hinges",
    "prompt": "A decorative strap hinge with two 150mm-long leaves featuring a pointed arrowhead tip. Each leaf is 30mm wide, 2mm thick, with four 4mm mounting holes. The barrel has five knuckles on a 3mm pin. Leaf edges have a 1mm chamfer.",
    "itemIndex": 0,
    "question": "Does each leaf have a pointed arrowhead tip at the free end?",
    "ref": {
      "state": "pass",
      "detail": "Top view and both isometric views clearly show both leaves tapering symmetrically to a sharp pointed tip at each free end, forming the classic arrowhead/spear profile."
    },
    "cand": {
      "state": "fail",
      "detail": "Top and bottom views show the free ends of the leaves are flat/straight, not tapered to a point. The 45° views also confirm the ends are blunt, not arrowhead-shaped."
    },
    "triage": {
      "verdict": "C",
      "confidence": "high",
      "what": "the top and bottom views show the strip narrowing toward both free ends and ending in short straight cut edges, not points; the 45° views show the same blunt ends — there is no arrowhead",
      "decidingView": "top, bottom, 45° down",
      "resolvedBy": "views as they are (Sonnet credited a pointed tip the leaf does not have)"
    }
  },
  {
    "id": "4257c1e4-5",
    "exampleId": "4257c1e4-da50-44e6-b7c6-279a2017eabb",
    "category": "Hinges",
    "prompt": "A decorative strap hinge with two 150mm-long leaves featuring a pointed arrowhead tip. Each leaf is 30mm wide, 2mm thick, with four 4mm mounting holes. The barrel has five knuckles on a 3mm pin. Leaf edges have a 1mm chamfer.",
    "itemIndex": 4,
    "question": "Is a chamfer visible along the leaf edges?",
    "ref": {
      "state": "fail",
      "detail": "[2x zoom] 45° down view: The leaf edges appear as sharp, square corners with no visible angled chamfer face along the perimeter edges of either leaf; the edge transitions show no distinct chamfer bevel strip between the top face and the side faces."
    },
    "cand": {
      "state": "pass",
      "detail": "[2x zoom] 45° up view: A distinct, lighter-colored beveled strip is visible along the top perimeter edges of the leaf, clearly separating the top face from the side walls, which confirms the presence of the chamfer."
    },
    "triage": {
      "verdict": "N",
      "confidence": "low",
      "what": "a 1 mm chamfer on a 2 mm-thick, 150 mm leaf is below what the eight views resolve: at full size the 45° up view shows only the usual lighter top-face edge, which is a face highlight, not a distinct bevel strip; neither judge's zoom is on record here",
      "decidingView": "45° up, 45° down",
      "resolvedBy": "not resolvable at render scale — a criterion the views cannot answer (the fog's class)"
    }
  },
  {
    "id": "427d888e-1",
    "exampleId": "427d888e-61ec-4ce5-b46e-85457cd8a4a7",
    "category": "Gridfinity Storage",
    "prompt": "Create a 4x4 Gridfinity baseplate using frame-style blocks",
    "itemIndex": 0,
    "question": "Bottom face is a single continuous flat plane at Z = 0 with no protrusions or recesses below datum",
    "ref": {
      "state": "fail",
      "detail": "45° up view and bottom view: the bottom face shows fully open cell apertures — the cells appear to be complete through-cuts with no solid bottom plane; the bottom view shows open squares arranged in a 4×4 grid with no continuous flat surface closing the bottom, indicating the pockets go all the way through with no Z=0 datum plane"
    },
    "cand": {
      "state": "pass",
      "detail": "Bottom view and 45° up view show a flat, continuous bottom surface with the 4×4 grid of openings; no protrusions or recesses are visible below the datum plane."
    },
    "triage": {
      "verdict": "C",
      "confidence": "medium",
      "what": "the underside is one connected, coplanar grid of bars — the bottom and 45° up views show every bar's lower face in one plane with nothing below it; the open cells are what a frame-style baseplate is, so Sonnet's reason (pockets go through) describes the requested design, not a protrusion or recess below datum",
      "decidingView": "bottom, 45° up",
      "resolvedBy": "views as they are (Sonnet failed the item on the design's defining feature)"
    }
  },
  {
    "id": "485cf1ba-2",
    "exampleId": "485cf1ba-1263-4b11-914c-f6e2b44431a7",
    "category": "Generic Enclosures",
    "prompt": "A rectangular electronics enclosure: 120mm × 80mm × 50mm, 3mm walls, open top, with four M3 through-hole corner boss standoffs (5mm diameter, 8mm tall) inside",
    "itemIndex": 1,
    "question": "Are there exactly 4 cylindrical standoff bosses inside the enclosure?",
    "ref": {
      "state": "fail",
      "detail": "[2x zoom] Top view: shows 4 small circular features at the four corners of the interior, but the 45° down view shows only 1 cylindrical standoff boss visible inside the enclosure (near the back-left corner), indicating the model has only 1 boss rather than 4."
    },
    "cand": {
      "state": "pass",
      "detail": "Top view: Four distinct circular features are visible at the corners of the interior cavity. 45° down view: One cylindrical boss with a central hole is clearly visible, confirming the geometry of the features seen in the top view."
    },
    "triage": {
      "verdict": "R",
      "confidence": "high",
      "what": "the top view shows four corner circles, but the 45° down view shows a single boss standing at the back-left corner while the visible floor at the front-left and back-right corners is bare — at most two corners could hide a boss behind the near walls, so there are not four",
      "decidingView": "45° down, top",
      "resolvedBy": "views as they are (candidate counted floor circles as bosses)"
    }
  },
  {
    "id": "4890e064-3",
    "exampleId": "4890e064-0c18-4676-a4c1-dd84633264ce",
    "category": "Hinges",
    "prompt": "A concealed barrel hinge: two 12mm-diameter cylindrical halves, each 40mm long, connected by an internal 4mm pivot pin. Each half has a 10mm-long flat mounting tab extending radially, 15mm wide x 2mm thick, with a single 4mm screw hole.",
    "itemIndex": 2,
    "question": "Is a pivot pin visible at the axis connecting the two halves?",
    "ref": {
      "state": "pass",
      "detail": "Front, back, and 45° down views: a cylindrical pin is clearly visible running vertically at the center of the assembly, connecting the two halves"
    },
    "cand": {
      "state": "fail",
      "detail": "A central spine is visible, but it is segmented and does not appear to be a single solid pivot pin of the correct length."
    },
    "triage": {
      "verdict": "C",
      "confidence": "medium",
      "what": "along the hinge axis there are five separate knuckle segments with visible gaps and nothing running through them (left, right); the rod Sonnet credits rises perpendicular to the leaves — a vertical line in front and back, a dot in the top view — so it is not on the axis and connects nothing",
      "decidingView": "left, right, front, top",
      "resolvedBy": "views as they are (Sonnet credited a perpendicular rod as the axial pin; the candidate's 'segmented spine' is the right reading)"
    }
  },
  {
    "id": "4963f2df-2",
    "exampleId": "4963f2df-259c-4f4d-ac0c-8b7706a14a2c",
    "category": "Hinges",
    "prompt": "A double-action saloon-door hinge that allows 180-degree swing in both directions: two 90mm x 45mm x 2.5mm leaves connected by a central barrel assembly with two independent pivot axes offset by 8mm. Each pivot has a 3.5mm pin. The assembly allows the leaves to swing past center in either direction. Four 4mm holes per leaf.",
    "itemIndex": 1,
    "question": "Is there a central barrel/link assembly connecting the two leaves between their inner edges?",
    "ref": {
      "state": "pass",
      "detail": "[2x zoom] 45° down view: shows two cylindrical barrels with through-bores standing vertically, connected by a flat rectangular link plate between them, positioned at the inner edge of the single visible leaf — confirming the central barrel/link assembly is present connecting the leaves at their inner edges."
    },
    "cand": {
      "state": "fail",
      "detail": "The central assembly is fragmented into short segments and does not form a continuous link or barrel structure connecting the leaves."
    },
    "triage": {
      "verdict": "C",
      "confidence": "high",
      "what": "only one leaf is in the scene — a single plate with one hole; the two barrels stand at one corner, perpendicular to the leaf, joined by a small base link and connected to nothing else, and the edge carries three loose knuckle segments; there is no second leaf for any assembly to connect",
      "decidingView": "45° down, top, front",
      "resolvedBy": "views as they are (Sonnet noted 'the single visible leaf' and passed a connection to a leaf that does not exist)"
    }
  },
  {
    "id": "4963f2df-3",
    "exampleId": "4963f2df-259c-4f4d-ac0c-8b7706a14a2c",
    "category": "Hinges",
    "prompt": "A double-action saloon-door hinge that allows 180-degree swing in both directions: two 90mm x 45mm x 2.5mm leaves connected by a central barrel assembly with two independent pivot axes offset by 8mm. Each pivot has a 3.5mm pin. The assembly allows the leaves to swing past center in either direction. Four 4mm holes per leaf.",
    "itemIndex": 2,
    "question": "Are there two distinct cylindrical pin barrels visible in the central assembly, visibly offset from each other?",
    "ref": {
      "state": "pass",
      "detail": "Top view and 45° down view: Two separate cylindrical barrels with visible through-bores (hollow circles) are clearly shown side by side at the inner edge of the leaf, offset from each other."
    },
    "cand": {
      "state": "fail",
      "detail": "While two offset axes are suggested by the top/bottom stubs, they are not full-height barrels as required; they are short disconnected pieces."
    },
    "triage": {
      "verdict": "R",
      "confidence": "medium",
      "what": "two distinct tall tubes with through-bores stand side by side, offset by about their own diameter — the top view shows two hollow circles at the corner, 45° down two full-height barrels; the candidate's 'short disconnected pieces' are the knuckle segments along the edge, not these barrels (which stand perpendicular to the leaf, a separate defect the item does not ask about)",
      "decidingView": "top, 45° down",
      "resolvedBy": "views as they are (candidate read the wrong feature)"
    }
  },
  {
    "id": "4e3686ec-2",
    "exampleId": "4e3686ec-b26f-40d3-a574-f0d3afba1f8b",
    "category": "PCB Cases",
    "prompt": "A Odroid case: rectangular box 98mm x 65mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: USB cutout (12mm x 7mm), Ethernet cutout (17mm x 15mm), HDMI cutout (16mm x 6mm). Flat lid 98mm x 65mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).",
    "itemIndex": 1,
    "question": "Are there exactly three cutouts visible on one short wall of the box?",
    "ref": {
      "state": "fail",
      "detail": "45° down view and left view: cutouts are visible on the short wall, but only one clearly defined rectangular opening is distinguishable; a second smaller feature may be present but three distinct cutouts (USB, Ethernet, HDMI) cannot be confirmed"
    },
    "cand": {
      "state": "pass",
      "detail": "Left view and 45° down view show three distinct rectangular cutouts on the short wall of the case."
    },
    "triage": {
      "verdict": "C",
      "confidence": "medium",
      "what": "the full-size left view shows three rectangular features on the short wall — a faint outlined rectangle at the left, a larger opening in the middle seen through to the shaded interior, and a dark rectangle at the right — two unambiguously through, the third an outline; 45° down shows two of them on the far short wall beside the one standoff",
      "decidingView": "left (full size), 45° down",
      "resolvedBy": "views as they are, with a caveat on the faint third cutout"
    }
  },
  {
    "id": "4e3686ec-3",
    "exampleId": "4e3686ec-b26f-40d3-a574-f0d3afba1f8b",
    "category": "PCB Cases",
    "prompt": "A Odroid case: rectangular box 98mm x 65mm x 25mm with 2mm walls. Four M2.5 standoffs (5mm tall) inside at the corners. Port cutouts on one short side: USB cutout (12mm x 7mm), Ethernet cutout (17mm x 15mm), HDMI cutout (16mm x 6mm). Flat lid 98mm x 65mm x 3mm. Display both parts placed side by side on the same flat surface, separated by a 20mm gap. The case sits upright (open side up) and the lid sits next to it upside down (flat top facing down).",
    "itemIndex": 2,
    "question": "Are there four cylindrical standoff posts visible at the interior corners of the box?",
    "ref": {
      "state": "fail",
      "detail": "45° down view: only one small cylindrical standoff post is visible near one interior corner; the other three corner positions show no standoff posts; top view shows faint circular hints at corners but only 2 are marginally visible"
    },
    "cand": {
      "state": "pass",
      "detail": "Top view and 45° down view show four small cylindrical posts at the corners of the interior floor."
    },
    "triage": {
      "verdict": "R",
      "confidence": "medium",
      "what": "the top view shows rings at all four corners, but the full-size 45° down view shows a single post at the back-left corner while the floor at the back-right corner is bare — the same pattern as example 485cf1ba, where the corner rings are floor features and not 5 mm posts",
      "decidingView": "45° down (full size), top",
      "resolvedBy": "views as they are (candidate counted the top-view rings as posts)"
    }
  }
];
