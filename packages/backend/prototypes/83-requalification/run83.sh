#!/bin/zsh
# PROTOTYPE (wayfinder #83) — the re-qualification on the 125 under production@4892d8d1b160,
# the three-view follow-up adopted. One subcommand per step; each writes its record next to this file.
#
#   run83.sh arm <name>     one experiment on the fixed 125 with <judge>, started → exp83-<name>.txt, start83-<name>.txt
#   run83.sh status <name>  the run's status
#   run83.sh runid <name>   the run id → run83-<name>.txt
#   run83.sh screen         the qualification screen: candidate pair + reference, and the disagreement dump
#   run83.sh tenancy <from> <to>   who else was on the pool in the window (must be judge-only)
S=$(cd "$(dirname "$0")" && pwd); cd /Users/daniel/src/github/kreuzhofer/chat3d-app
TOKEN=$(cat /tmp/chat3d-token.txt)
QWEN=98d284fe-0993-462a-9991-df15442531cb   # the vlm_eval owner: qwen3.8-27b-nvfp4 (thinking off, 3-node pool)
SONNET=fcb82143-a38d-4e6a-9946-a21ca0aba0bc # Claude Sonnet 4.6 (Anthropic API, thinking off), the recipe of 6f6bb5c0 (#64)
psql() { docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "$1"; }

case "$1" in
arm)
  NAME=$2
  case "$NAME" in
    qwen-a|qwen-b) MODEL=$QWEN; LABEL="qwen3.8-27b-nvfp4 (thinking off)" ;;
    sonnet)        MODEL=$SONNET; LABEL="Claude Sonnet 4.6 (thinking off)" ;;
    *) echo "arm must be qwen-a | qwen-b | sonnet"; exit 1 ;;
  esac
  BODY=$(python3 -c "
import json
ids=[l.strip() for l in open('$S/examples125.txt') if l.strip()]
print(json.dumps({'name': 'issue #83 re-qualification ($NAME): $LABEL on the fixed 125, production@4892d8d1b160 (three-view follow-up)',
                  'exampleIds': ids, 'modelIds': ['$MODEL']}))")
  curl -s http://localhost/api/admin/vlm-experiments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" > "$S/exp83-$NAME.json"
  EXP=$(python3 -c "import json; d=json.load(open('$S/exp83-$NAME.json')); print(d.get('id') or d)"); echo "$EXP" | tee "$S/exp83-$NAME.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ | tee "$S/start83-$NAME.txt"
  curl -s -X POST "http://localhost/api/admin/vlm-experiments/$EXP/start" -H "Authorization: Bearer $TOKEN"; echo
  ;;
status)
  EXP=$(cat "$S/exp83-$2.txt"); curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN"; echo ;;
runid)
  EXP=$(cat "$S/exp83-$2.txt")
  curl -s "http://localhost/api/admin/vlm-experiments/$EXP/status" -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['runs'][0]['runId'])" | tee "$S/run83-$2.txt" ;;
screen)
  A=$(cat "$S/run83-qwen-a.txt"); B=$(cat "$S/run83-qwen-b.txt"); REF=$(cat "$S/run83-sonnet.txt")
  docker compose exec -T backend npx tsx scripts/qualification-screen.ts --candidate "$A" --candidate "$B" --reference "$REF" --dump /tmp/disagreements83.md 2>&1 \
    | grep -v '^{"level"' | grep -v '^◇' | tee "$S/screen83.txt"
  docker cp chat3d-backend:/tmp/disagreements83.md "$S/disagreements-qwen-vs-sonnet.md" && echo "dump → $S/disagreements-qwen-vs-sonnet.md"
  ;;
tenancy)
  psql "select date_trunc('minute', created_at) - (extract(minute from created_at)::int % 3 || ' minutes')::interval as bucket,
          count(*) filter (where purpose='vlm_evaluation') as judge_calls,
          count(*) filter (where purpose<>'vlm_evaluation') as other_tenants,
          string_agg(distinct purpose, ',') filter (where purpose<>'vlm_evaluation') as others
        from llm_usage_events
        where provider_name='vllm-dgx-14' and model_name like 'qwen3.8-27b-nvfp4%'
          and created_at between '$2' and '$3'
        group by 1 order by 1" ;;
*) echo "usage: run83.sh arm <qwen-a|qwen-b|sonnet> | status <name> | runid <name> | screen | tenancy <from> <to>"; exit 1 ;;
esac
