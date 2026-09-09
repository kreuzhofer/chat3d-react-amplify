#!/bin/zsh
# PROTOTYPE (wayfinder #91) — one sitting on corpus rows, one subcommand per step; each writes its record next to
# this file, keyed by the seed. Run from anywhere.
#
#   sitting91.sh sample <seed>     the 125 from the corpus's current rows, outside the held-out 125 and every earlier
#                                  sample (#63, #87, and every sample91-*.txt) → sample91-<seed>.txt, draw91-<seed>.txt
#   sitting91.sh reference <seed>  the Sonnet arm on exactly those rows: one experiment with `exampleIds`, started
#                                  → exp91-<seed>.txt, start91-<seed>.txt
#   sitting91.sh status <seed>     the experiment's run status
#   sitting91.sh sitting <seed>    the sitting in the app: the corpus's rows as candidate, the Sonnet run as reference
#                                  → sitting91-<seed>.txt (its id); open it at /admin/adjudication/<id>
#   sitting91.sh triage <seed>     Kimi K3 reads every item before Daniel sits (issue #93) → triage91-<seed>.txt (job id)
setopt null_glob
S=$(cd "$(dirname "$0")" && pwd); cd "$S/../../../.."
TOKEN=$(cat /tmp/chat3d-token.txt)
H="Authorization: Bearer $TOKEN"
SONNET=fcb82143-a38d-4e6a-9946-a21ca0aba0bc   # Claude Sonnet 4.6 (Anthropic API, thinking off): the reference recipe of 6f6bb5c0 (#64)
SEED=$2; [ -z "$SEED" ] && { echo "seed required"; exit 1; }

case "$1" in
sample)
  EX=()
  for f in "$S/../63-spot-check/sample63.txt" "$S/../87-batch/sample87.txt" "$S"/sample91-*.txt; do
    [ -f "$f" ] && [ "$f" != "$S/sample91-$SEED.txt" ] && EX+=(--exclude "$f")
  done
  python3 "$S/sample91.py" "$SEED" "${EX[@]}" | tee "$S/draw91-$SEED.txt"
  ;;
reference)
  BODY=$(python3 -c "
import json
ids=[l.strip() for l in open('$S/sample91-$SEED.txt') if l.strip()]
print(json.dumps({'name': 'issue #91 gold sitting (seed $SEED): Claude Sonnet 4.6 (thinking off) on %d corpus rows, production@4892d8d1b160' % len(ids), 'exampleIds': ids, 'modelIds': ['$SONNET']}))")
  curl -s http://localhost/api/admin/vlm-experiments -H "$H" -H "Content-Type: application/json" -d "$BODY" > "$S/exp91-$SEED.json"
  EXP=$(python3 -c "import json; d=json.load(open('$S/exp91-$SEED.json')); print(d.get('id') or d)"); echo "$EXP" | tee "$S/exp91-$SEED.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ | tee "$S/start91-$SEED.txt"
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "$H"; echo
  ;;
status)
  curl -s "http://localhost/api/admin/vlm-experiments/$(cat "$S/exp91-$SEED.txt")/status" -H "$H"; echo ;;
sitting)
  EXP=$(cat "$S/exp91-$SEED.txt")
  RUN=$(curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "$H" | python3 -c "import sys,json; print(json.load(sys.stdin)['runs'][0]['runId'])")
  echo "$RUN" > "$S/run91-$SEED-sonnet.txt"
  curl -s -X POST http://localhost/api/admin/workbench/adjudication/sittings -H "$H" -H "Content-Type: application/json" \
    -d "{\"productionExperimentId\":\"$EXP\",\"referenceRunId\":\"$RUN\",\"title\":\"#91 gold sitting, seed $SEED — corpus rows\",\"notes\":\"issue #91: the corpus's own ratings (qwen3.8-27b-nvfp4, thinking off) against Sonnet 4.6 run $RUN on the seed-$SEED sample of 125 corpus rows outside the held-out 125 and earlier samples; draw in prototypes/91-gold/draw91-$SEED.txt\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d); print('items', d.get('itemCount'), 'examples', d.get('exampleCount'), 'error', d.get('error'), file=sys.stderr)" | tee "$S/sitting91-$SEED.txt"
  ;;
triage)
  curl -s -X POST "http://localhost/api/admin/workbench/adjudication/sittings/$(cat "$S/sitting91-$SEED.txt")/triage" -H "$H" -H "Content-Type: application/json" -d '{}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('jobId') or d); print('items', d.get('total'), 'error', d.get('error'), file=sys.stderr)" | tee "$S/triage91-$SEED.txt"
  ;;
*) echo "usage: sitting91.sh sample|reference|status|sitting|triage <seed>"; exit 1 ;;
esac
