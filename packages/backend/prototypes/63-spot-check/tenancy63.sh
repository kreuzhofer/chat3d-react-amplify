#!/bin/zsh
# Who was on the qwen pool while the re-rating batch ran (issue #63, the sole-tenancy rule of #65 / ADR 0004).
# One row per 3-minute bucket: the batch's own judge calls, the batch's own code-review calls (the re-evaluation
# pipeline runs code review before the judge, on the same served name), and every other tenant. `other_calls`
# must be 0 for the window; the rows rated inside a non-zero bucket are not trusted for the spot check.
# Usage: tenancy63.sh <label> <from ISO> <to ISO>   e.g. tenancy63.sh batch 2026-09-06T19:00:00Z 2026-09-07T02:00:00Z
cd /Users/daniel/src/github/kreuzhofer/chat3d-app
docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "
select '$1' label, to_char(date_trunc('minute', u.created_at) - (extract(minute from u.created_at)::int % 3) * interval '1 minute','MM-DD HH24:MI') bucket3,
 count(*) filter (where u.purpose='vlm_evaluation' and u.source='workbench' and u.source_label like 'Re-eval:%') judge_calls,
 count(*) filter (where u.purpose='code_evaluation' and u.source='workbench' and u.source_label like 'Re-eval:%') batch_code_review,
 count(*) filter (where not (u.source='workbench' and u.source_label like 'Re-eval:%')) other_calls,
 string_agg(distinct case when not (u.source='workbench' and u.source_label like 'Re-eval:%') then coalesce(u.source_label,u.source,'?')||'/'||u.purpose end, ', ') other_sources
from llm_usage_events u
where u.provider_name='vllm-dgx-14' and u.model_name like 'qwen3.8-27b-nvfp4%' and u.created_at between '$2' and '$3'
group by 1,2 order by 1,2"
echo "--- window total ---"
docker compose exec -T postgres psql -U chat3d -d chat3d -Atc "
select count(*) filter (where u.purpose='vlm_evaluation' and u.source='workbench' and u.source_label like 'Re-eval:%') judge_calls,
 count(*) filter (where u.purpose='code_evaluation' and u.source='workbench' and u.source_label like 'Re-eval:%') batch_code_review,
 count(*) filter (where not (u.source='workbench' and u.source_label like 'Re-eval:%')) other_calls
from llm_usage_events u where u.provider_name='vllm-dgx-14' and u.model_name like 'qwen3.8-27b-nvfp4%' and u.created_at between '$2' and '$3'"
