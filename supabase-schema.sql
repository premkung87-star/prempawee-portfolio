-- ============================================
-- PREMPAWEE PORTFOLIO — DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- Enable pgvector for future semantic search
create extension if not exists vector with schema extensions;

-- Full-text search configuration for Thai + English
create extension if not exists unaccent with schema extensions;

-- ============================================
-- KNOWLEDGE BASE: Single source of truth
-- ============================================
create table knowledge_base (
  id bigint primary key generated always as identity,
  category text not null,        -- 'project', 'skill', 'bio', 'faq', 'package', 'testimonial'
  title text not null,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536),        -- Ready for OpenAI embeddings when needed
  search_text tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_kb_category on knowledge_base (category);
create index idx_kb_search on knowledge_base using gin (search_text);

-- ============================================
-- LEADS: Visitor contact captures
-- ============================================
create table leads (
  id bigint primary key generated always as identity,
  name text,
  email text,
  line_id text,
  business_type text,
  package_interest text,
  message text,
  source text default 'portfolio_chat', -- where the lead came from
  created_at timestamptz default now()
);

-- ============================================
-- CONVERSATIONS: Chat session logs
-- ============================================
create table conversations (
  id bigint primary key generated always as identity,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tokens_used int,
  created_at timestamptz default now()
);

create index idx_conv_session on conversations (session_id);
create index idx_conv_created on conversations (created_at);

-- ============================================
-- ANALYTICS: Simple visitor tracking
-- ============================================
create table analytics (
  id bigint primary key generated always as identity,
  event_type text not null,      -- 'page_view', 'chat_start', 'tool_used', 'lead_captured'
  event_data jsonb default '{}',
  session_id text,
  created_at timestamptz default now()
);

create index idx_analytics_type on analytics (event_type);
create index idx_analytics_created on analytics (created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table knowledge_base enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table analytics enable row level security;

-- Knowledge base: public read
create policy "Public read knowledge_base" on knowledge_base
  for select using (true);

-- Leads: public insert, service role read
create policy "Public insert leads" on leads
  for insert with check (true);
create policy "Service read leads" on leads
  for select using (auth.role() = 'service_role');

-- Conversations: public insert, service role read
create policy "Public insert conversations" on conversations
  for insert with check (true);
create policy "Service read conversations" on conversations
  for select using (auth.role() = 'service_role');

-- Analytics: public insert, service role read
create policy "Public insert analytics" on analytics
  for insert with check (true);
create policy "Service read analytics" on analytics
  for select using (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Search knowledge base by keyword (used until vector search is enabled)
create or replace function search_knowledge(
  search_query text,
  category_filter text default null,
  result_limit int default 10
)
returns table (
  id bigint,
  category text,
  title text,
  content text,
  metadata jsonb,
  rank real
)
language sql stable
as $$
  select
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.metadata,
    ts_rank(kb.search_text, websearch_to_tsquery('english', search_query)) as rank
  from knowledge_base kb
  where
    (category_filter is null or kb.category = category_filter)
    and (
      kb.search_text @@ websearch_to_tsquery('english', search_query)
      or kb.title ilike '%' || search_query || '%'
      or kb.content ilike '%' || search_query || '%'
    )
  order by rank desc
  limit result_limit;
$$;

-- Vector search function (ready for when embeddings are added)
create or replace function match_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  id bigint,
  category text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;
