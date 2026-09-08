#!/bin/zsh
# Issue #86 stage 2 acceptance test: spark-01 (tuned the profile) against spark-02 (inherited it),
# both reading the identical shared autotune cache b0b4504442de5b87…. One experiment at a time.
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
psql() { docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "$1"; }
for A in 01 02c; do
  "$S/probe83.sh" arm "$A" >/dev/null 2>&1
  EXP=$(cat "$S/probe83-$A.txt")
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN" >/dev/null
  echo "started $A ($EXP) $(date -u +%H:%M:%SZ)"
  while curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN" | grep -qE '"status":"(pending|running)"'; do sleep 20; done
  "$S/probe83.sh" runid "$A" >/dev/null
  RUN=$(cat "$S/proberun83-$A.txt")
  # Guard on the OUTPUT, not on a field the failure path also fills: a failed evaluation
  # is stored as a score-1.0 row, so count non-empty checklist arrays instead.
  OK=$(psql "select count(*) from vlm_experiment_results where run_id='$RUN' and jsonb_typeof(checklist_results)='array' and jsonb_array_length(checklist_results) > 0")
  echo "done $A $(date -u +%H:%M:%SZ) with_items=$OK"
  if [ "$OK" -lt 40 ]; then echo "ABORT: $A produced $OK of 40"; exit 1; fi
done
echo "ACCEPTANCE ARMS DONE $(date -u +%H:%M:%SZ)"
