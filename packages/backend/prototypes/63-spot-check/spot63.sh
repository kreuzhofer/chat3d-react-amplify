#!/bin/zsh
# PROTOTYPE (wayfinder #63) — the spot check after the re-rating batch, one subcommand per step; each writes its
# record next to this file. The batch itself: POST /api/admin/workbench/re-rate-stale/batch {"limit":5000,"concurrency":3}
# with gateway-poll.py (prototypes/59-one-instrument) writing gateway-pool63.tsv, start63.txt / end63.txt the window.
#
#   spot63.sh audit            tenancy per 3-min bucket (other tenants must be 0), two-on-one overlap from the poll,
#                              and the rows whose judge call had another tenant within ±60 s → overlap63-flagged.txt
#   spot63.sh sample <seed>    the 125 from the batch's rows (sample63.py) → sample63.txt
#   spot63.sh reference        the Sonnet arm on exactly those rows: one experiment with `exampleIds` → exp63.txt, started
#   spot63.sh status           the experiment's run status
#   spot63.sh screen           the qualification screen, the corpus's rows against the Sonnet run, and the dump
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
START=$(cat "$S/start63.txt"); END=$(cat "$S/end63.txt" 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
SONNET=fcb82143-a38d-4e6a-9946-a21ca0aba0bc   # Claude Sonnet 4.6 (Anthropic API, thinking off): the reference recipe of 6f6bb5c0 (#64)
psql() { docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "$1"; }

case "$1" in
audit)
  "$S/tenancy63.sh" batch "$START" "$END" | tee "$S/tenancy63.txt"
  python3 "$S/overlap63.py" "$S/gateway-pool63.tsv" "$START" "$END" "$S/overlap63-flagged.txt" | tee "$S/overlap63.txt"
  echo "--- rows whose judge call had another tenant on the served name within ±60 s (appended to the flagged list) ---"
  psql "select distinct u.workbench_example_id from llm_usage_events u
    where u.provider_name='vllm-dgx-14' and u.model_name like 'qwen3.8-27b-nvfp4%' and u.purpose='vlm_evaluation'
      and u.source='workbench' and u.source_label like 'Re-eval:%' and u.created_at between '$START' and '$END'
      and exists (select 1 from llm_usage_events o where o.provider_name='vllm-dgx-14' and o.model_name like 'qwen3.8-27b-nvfp4%'
        and not (o.source='workbench' and o.source_label like 'Re-eval:%')
        and o.created_at between u.created_at - (coalesce(u.duration_ms,0)::text||' milliseconds')::interval - interval '60 seconds' and u.created_at + interval '60 seconds')" \
    | tee -a "$S/overlap63-flagged.txt" | wc -l | sed 's/^/co-tenant rows: /'
  sort -u "$S/overlap63-flagged.txt" -o "$S/overlap63-flagged.txt"; echo "flagged total: $(wc -l < "$S/overlap63-flagged.txt")"
  ;;
sample)
  python3 "$S/sample63.py" "$2" "$START" "$END" --exclude "$S/overlap63-flagged.txt" --out "$S/sample63.txt" | tee "$S/sample63-draw.txt"
  ;;
reference)
  BODY=$(python3 -c "
import json
ids=[l.strip() for l in open('$S/sample63.txt') if l.strip()]
print(json.dumps({'name': 'issue #63 spot check: Claude Sonnet 4.6 (thinking off) on %d rows of the first re-rating batch, production instrument + zoom, concurrency 3' % len(ids), 'exampleIds': ids, 'modelIds': ['$SONNET']}))")
  curl -s http://localhost/api/admin/vlm-experiments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" > "$S/exp63.json"
  EXP=$(python3 -c "import json; d=json.load(open('$S/exp63.json')); print(d.get('id') or d)"); echo "$EXP" | tee "$S/exp63.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ | tee "$S/start63-sonnet.txt"
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN"; echo
  ;;
status)
  EXP=$(cat "$S/exp63.txt"); curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN"; echo ;;
screen)
  EXP=$(cat "$S/exp63.txt")
  RUN=$(curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['runs'][0]['runId'])")
  echo "$RUN" | tee "$S/run63-sonnet-ref.txt"
  docker compose exec -T backend npx tsx scripts/qualification-screen.ts --candidate-production "$EXP" --reference "$RUN" --dump /tmp/disagreements63.md 2>&1 \
    | grep -v '^{"level"' | grep -v '^◇' | tee "$S/screen-batch-vs-sonnet.txt"
  docker cp chat3d-backend:/tmp/disagreements63.md "$S/disagreements-batch-vs-sonnet.md" && echo "dump → $S/disagreements-batch-vs-sonnet.md"
  ;;
*) echo "usage: spot63.sh audit | sample <seed> | reference | status | screen"; exit 1 ;;
esac
