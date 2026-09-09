#!/bin/zsh
# PROTOTYPE (wayfinder #87) — the spot check after the re-rating batch, one subcommand per step; each writes its
# record next to this file. The batch itself: POST /api/admin/workbench/re-rate-stale/batch {"limit":5000,"concurrency":3}
# with gateway-poll.py (prototypes/59-one-instrument) writing gateway-pool87.tsv, start87.txt / end87.txt the window.
#
#   spot87.sh audit            tenancy per 3-min bucket (other tenants must be 0), two-on-one overlap from the poll,
#                              and the rows whose judge call had another tenant within ±60 s → overlap87-flagged.txt
#   spot87.sh sample <seed>    the 125 from the batch's rows (sample63.py) → sample87.txt
#   spot87.sh reference        the Sonnet arm on exactly those rows: one experiment with `exampleIds` → exp87.txt, started
#   spot87.sh status           the experiment's run status
#   spot87.sh screen           the qualification screen, the corpus's rows against the Sonnet run, and the dump
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
START=$(cat "$S/start87.txt"); END=$(cat "$S/end87.txt" 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
SONNET=fcb82143-a38d-4e6a-9946-a21ca0aba0bc   # Claude Sonnet 4.6 (Anthropic API, thinking off): the reference recipe of 6f6bb5c0 (#64)
psql() { docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "$1"; }

case "$1" in
audit)
  "$S/../63-spot-check/tenancy63.sh" batch "$START" "$END" | tee "$S/tenancy87.txt"
  python3 "$S/../63-spot-check/overlap63.py" "$S/gateway-pool87.tsv" "$START" "$END" "$S/overlap87-flagged.txt" | tee "$S/overlap87.txt"
  echo "--- rows whose judge call had another tenant on the served name within ±60 s (appended to the flagged list) ---"
  psql "select distinct u.workbench_example_id from llm_usage_events u
    where u.provider_name='vllm-dgx-14' and u.model_name like 'qwen3.8-27b-nvfp4%' and u.purpose='vlm_evaluation'
      and u.source='workbench' and u.source_label like 'Re-eval:%' and u.created_at between '$START' and '$END'
      and exists (select 1 from llm_usage_events o where o.provider_name='vllm-dgx-14' and o.model_name like 'qwen3.8-27b-nvfp4%'
        and not (o.source='workbench' and o.source_label like 'Re-eval:%')
        and o.created_at between u.created_at - (coalesce(u.duration_ms,0)::text||' milliseconds')::interval - interval '60 seconds' and u.created_at + interval '60 seconds')" \
    | tee -a "$S/overlap87-flagged.txt" | wc -l | sed 's/^/co-tenant rows: /'
  sort -u "$S/overlap87-flagged.txt" -o "$S/overlap87-flagged.txt"; echo "flagged total: $(wc -l < "$S/overlap87-flagged.txt")"
  ;;
sample)
  python3 "$S/../63-spot-check/sample63.py" "$2" "$START" "$END" --exclude "$S/overlap87-flagged.txt" --out "$S/sample87.txt" | tee "$S/sample87-draw.txt"
  ;;
reference)
  BODY=$(python3 -c "
import json
ids=[l.strip() for l in open('$S/sample87.txt') if l.strip()]
print(json.dumps({'name': 'issue #87 spot check: Claude Sonnet 4.6 (thinking off) on %d rows of the second re-rating batch, production@4892d8d1b160, concurrency 3' % len(ids), 'exampleIds': ids, 'modelIds': ['$SONNET']}))")
  curl -s http://localhost/api/admin/vlm-experiments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" > "$S/exp87.json"
  EXP=$(python3 -c "import json; d=json.load(open('$S/exp87.json')); print(d.get('id') or d)"); echo "$EXP" | tee "$S/exp87.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ | tee "$S/start87-sonnet.txt"
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN"; echo
  ;;
status)
  EXP=$(cat "$S/exp87.txt"); curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN"; echo ;;
screen)
  EXP=$(cat "$S/exp87.txt")
  RUN=$(curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['runs'][0]['runId'])")
  echo "$RUN" | tee "$S/run87-sonnet-ref.txt"
  docker compose exec -T backend npx tsx scripts/qualification-screen.ts --candidate-production "$EXP" --reference "$RUN" --dump /tmp/disagreements87.md 2>&1 \
    | grep -v '^{"level"' | grep -v '^◇' | tee "$S/screen87-batch-vs-sonnet.txt"
  docker cp chat3d-backend:/tmp/disagreements87.md "$S/disagreements87-batch-vs-sonnet.md" && echo "dump → $S/disagreements87-batch-vs-sonnet.md"
  ;;
*) echo "usage: spot87.sh audit | sample <seed> | reference | status | screen"; exit 1 ;;
esac
