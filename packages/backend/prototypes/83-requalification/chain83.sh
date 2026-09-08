#!/bin/zsh
# Waits for any running experiment, then starts the next probe arm; repeats. One experiment at a time is a
# harness rule, so the four pinned arms run back to back.
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
wait_idle() {
  while curl -s "http://localhost/api/admin/vlm-experiments/$1/status" -H "Authorization: Bearer $TOKEN" \
        | grep -qE '"status":"(pending|running)"'; do sleep 20; done
}
# Sonnet already landed
true
echo "sonnet done $(date -u +%H:%M:%SZ)"
for A in 02a 02b 03 04; do
  EXP=$(cat "$S/probe83-$A.txt" 2>/dev/null)
  if [ -z "$EXP" ]; then "$S/probe83.sh" arm "$A" >/dev/null 2>&1; EXP=$(cat "$S/probe83-$A.txt"); fi
  date -u +%Y-%m-%dT%H:%M:%SZ > "$S/probestart83-$A.txt"
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "started $A ($EXP) $(date -u +%H:%M:%SZ)"
  wait_idle "$EXP"
  "$S/probe83.sh" runid "$A" > /dev/null
  RUN=$(cat "$S/proberun83-$A.txt")
  SCORED=$(docker compose exec -T postgres psql -U chat3d -d chat3d -Atc \
    "select count(*) from vlm_experiment_results where run_id='$RUN' and visual_score is not null")
  echo "done $A $(date -u +%H:%M:%SZ) scored=$SCORED"
  # A run whose every example errored still reports "completed"; refuse to build on empty arms.
  if [ "$SCORED" -lt 40 ]; then echo "ABORT: $A scored $SCORED of 40"; exit 1; fi
done
echo "ALL PROBE ARMS DONE $(date -u +%H:%M:%SZ)"
