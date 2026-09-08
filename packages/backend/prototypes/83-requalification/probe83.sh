#!/bin/zsh
# PROTOTYPE (wayfinder #83) — the replica-heterogeneity probe (dgx-manager's test).
# The pool's gateway keeps ONE rotation counter per published name that PERSISTS across runs, so two runs of the
# same set are served by different replicas. That is only harmless if the replicas are numerically interchangeable.
# This pins each node directly at :8000, bypassing the gateway, and asks two questions:
#   02a vs 02b        does one node reproduce against itself?
#   02a vs 03 vs 04   do the nodes agree with each other?
# 40 examples at N=1 (R=1 per node, so N<=R). ~160 items — 20 would give ~82 and an expected ~2 flips, too thin.
#
#   probe83.sh arm <01|02a|02b|02c|03|04>   start one pinned run
#   probe83.sh runid <name>          its run id
#   probe83.sh compare <A> <B>       item-level identity and hard flips between two pinned runs
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
psql() { docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "$1"; }
case "$1" in
arm)
  NAME=$2
  case "$NAME" in
    02a|02b|02c|02d) MODEL=e581e03d-7cb7-49b3-887c-7a81107609fa; NODE=spark-02 ;;
    03)      MODEL=25d01f5a-34e3-4aef-bbde-b00be1b029a4; NODE=spark-03 ;;
    04)      MODEL=c7bd148d-f786-4b4d-bdb2-21fb040d2658; NODE=spark-04 ;;
    # Issue #86 stage 2: spark-01 publishes a DISTINCT name (qwen38-nvfp4-cachetest) so the
    # test deployment does not join the production pool. Same recipe, same TP, shared autotune cache.
    01|01b)  MODEL=6b3bb6a6-b7c7-428c-b97e-b6d6e12d1271; NODE=spark-01-cachetest ;;
    *) echo "arm must be 01 | 02a | 02b | 02c | 03 | 04"; exit 1 ;;
  esac
  BODY=$(python3 -c "
import json
ids=[l.strip() for l in open('$S/examples40.txt') if l.strip()]
print(json.dumps({'name': 'issue #83 replica probe ($NAME): qwen3.8-27b-nvfp4 pinned to $NODE, 40 of the 125, N=1',
                  'exampleIds': ids, 'modelIds': ['$MODEL']}))")
  curl -s http://localhost/api/admin/vlm-experiments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" > "$S/probe83-$NAME.json"
  EXP=$(python3 -c "import json; d=json.load(open('$S/probe83-$NAME.json')); print(d.get('id') or d)"); echo "$EXP" | tee "$S/probe83-$NAME.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN"; echo ;;
runid)
  EXP=$(cat "$S/probe83-$2.txt")
  curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['runs'][0]['runId'])" | tee "$S/proberun83-$2.txt" ;;
compare)
  A=$(cat "$S/proberun83-$2.txt"); B=$(cat "$S/proberun83-$3.txt")
  psql "with a as (select r.example_id, it.ord, it.v->>'pass' p, it.v->>'detail' d
                   from vlm_experiment_results r, jsonb_array_elements(r.checklist_results) with ordinality it(v,ord)
                   where r.run_id='$A'),
             b as (select r.example_id, it.ord, it.v->>'pass' p, it.v->>'detail' d
                   from vlm_experiment_results r, jsonb_array_elements(r.checklist_results) with ordinality it(v,ord)
                   where r.run_id='$B')
        select '$2 vs $3' as pair, count(*) items,
               count(*) filter (where a.p is not distinct from b.p) same_verdict,
               count(*) filter (where a.p in ('true','false') and b.p in ('true','false') and a.p<>b.p) hard_flips,
               count(*) filter (where a.d is not distinct from b.d) identical_detail
        from a join b on a.example_id=b.example_id and a.ord=b.ord" ;;
*) echo "usage: probe83.sh arm <02a|02b|03|04> | runid <name> | compare <A> <B>"; exit 1 ;;
esac
