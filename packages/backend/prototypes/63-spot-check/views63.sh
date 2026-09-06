#!/bin/zsh
# PROTOTYPE (wayfinder #63) — export the eight stored views of every example in items63.json for the reading.
# Usage: views63.sh items63.json VIEWS_DIR   → VIEWS_DIR/views.json ({id, front..ortho_45_bottom: relative path}) and the PNGs,
# copied out of the backend container's /data/storage with the storage-relative paths kept (as #57's build.py expects).
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
ITEMS=$1; OUT=$2; mkdir -p "$OUT"
IDS=$(python3 -c "import json; print(','.join(\"'%s'\" % i for i in sorted({r['example_id'] for r in json.load(open('$ITEMS'))})))")
docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "select json_agg(json_build_object('id', id, 'front', screenshot_front, 'back', screenshot_back, 'left', screenshot_left, 'right', screenshot_right, 'top', screenshot_top, 'bottom', screenshot_bottom, 'ortho_45', screenshot_ortho_45, 'ortho_45_bottom', screenshot_ortho_45_bottom) order by id) from workbench_examples where id in ($IDS)" > "$OUT/views.json"
python3 -c "
import json; v=json.load(open('$OUT/views.json')); paths=[e[k] for e in v for k in ('front','back','left','right','top','bottom','ortho_45','ortho_45_bottom')]
open('$OUT/paths.txt','w').write('\n'.join(paths)+'\n'); print(len(v), 'examples,', len(paths), 'views')"
docker exec -i chat3d-backend sh -c "cd /data/storage && tar -cf - -T -" < "$OUT/paths.txt" | tar -x -C "$OUT" && echo "views → $OUT"
