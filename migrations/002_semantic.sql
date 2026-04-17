-- ============================================================================
-- Migration: 002_semantic.sql
-- Intent : Enable pgvector semantic search + hybrid retrieval on
--          knowledge_base.
--          - ivfflat index for fast cosine-distance lookups at scale
--          - match_knowledge_hybrid RPC: combines semantic + full-text with
--            weighted rerank
--
-- Idempotent: every statement is safe to run repeatedly.
-- Prereq    : supabase-schema.sql (knowledge_base + embedding column)
-- Prereq    : 001_hardening.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Index on the embedding column. ivfflat is fastest for >10k rows but works
-- fine for smaller sets. Cosine distance matches OpenAI + Voyage defaults.
-- ---------------------------------------------------------------------------
create index if not exists idx_kb_embedding_ivfflat
  on public.knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------------------------------------------------------------------------
-- match_knowledge_hybrid: hybrid semantic + full-text retrieval with a
-- weighted rerank. Returns top N rows ordered by blended score.
--
-- Weights:
--   semantic_weight  (default 0.6) — cosine similarity of query_embedding
--   fulltext_weight  (default 0.4) — ts_rank_cd on websearch_to_tsquery
--
-- Both component scores are normalized to [0,1] before blending so a
-- strong semantic hit can't be drowned out by a very-high ts_rank.
-- ---------------------------------------------------------------------------
create or replace function public.match_knowledge_hybrid(
  query_embedding     vector(1536),
  query_text          text,
  match_count         int    default 8,
  semantic_weight     float  default 0.6,
  fulltext_weight     float  default 0.4,
  category_filter     text   default null
)
returns table (
  id              bigint,
  category        text,
  title           text,
  content         text,
  metadata        jsonb,
  semantic_score  float,
  fulltext_score  float,
  combined_score  float
)
language sql stable
as $$
with candidates as (
  select
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.metadata,
    -- Cosine similarity in [0,1]: 1 = identical, 0 = opposite
    case when kb.embedding is not null
      then 1 - (kb.embedding <=> query_embedding)
      else 0
    end as semantic_raw,
    coalesce(
      ts_rank_cd(kb.search_text, websearch_to_tsquery('english', query_text)),
      0
    ) as fulltext_raw
  from public.knowledge_base kb
  where category_filter is null or kb.category = category_filter
),
normed as (
  select
    c.*,
    -- Normalize fulltext_raw across this result set to [0,1]
    case
      when max(c.fulltext_raw) over () > 0
        then c.fulltext_raw / max(c.fulltext_raw) over ()
      else 0
    end as fulltext_score
  from candidates c
)
select
  id,
  category,
  title,
  content,
  metadata,
  semantic_raw         as semantic_score,
  fulltext_score,
  (semantic_weight * semantic_raw + fulltext_weight * fulltext_score) as combined_score
from normed
order by combined_score desc, id asc
limit match_count;
$$;

grant execute on function public.match_knowledge_hybrid(
  vector, text, int, float, float, text
) to anon, authenticated, service_role;

commit;

-- ============================================================================
-- ROLLBACK — uncomment to undo
-- ============================================================================
-- begin;
-- drop function if exists public.match_knowledge_hybrid(vector, text, int, float, float, text);
-- drop index if exists public.idx_kb_embedding_ivfflat;
-- commit;
-- ============================================================================
