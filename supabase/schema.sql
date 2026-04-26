-- ═══════════════════════════════════════════════════════════
-- Kesher Ivrit — Supabase Schema
--
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New query → paste & run
-- ═══════════════════════════════════════════════════════════

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name   TEXT        NOT NULL,
  last_initial CHAR(1)     NOT NULL,
  school       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  -- One row per student (same name + initial + school = same person)
  CONSTRAINT users_unique UNIQUE (first_name, last_initial, school)
);

-- ── Scores ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points        INTEGER     NOT NULL DEFAULT 0,
  streak        INTEGER     NOT NULL DEFAULT 0,
  words_learned INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT scores_user_unique UNIQUE (user_id)
);

-- ── Leaderboard view ───────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id,
  u.first_name,
  u.last_initial,
  u.school,
  u.created_at,
  COALESCE(s.points,        0) AS points,
  COALESCE(s.streak,        0) AS streak,
  COALESCE(s.words_learned, 0) AS words_learned,
  s.updated_at,
  RANK() OVER (ORDER BY COALESCE(s.points, 0) DESC) AS rank
FROM  public.users  u
LEFT JOIN public.scores s ON s.user_id = u.id
ORDER BY points DESC;

-- ── Row-Level Security ─────────────────────────────────────
-- We route all writes through our server, but the anon key
-- must be allowed to SELECT (leaderboard) and INSERT/UPDATE
-- (registration & score sync).

ALTER TABLE public.users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public leaderboard)
CREATE POLICY "anon_read_users"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "anon_read_scores"
  ON public.scores FOR SELECT USING (true);

-- Server (anon key) can insert new students
CREATE POLICY "anon_insert_users"
  ON public.users FOR INSERT WITH CHECK (true);

-- Server (anon key) can insert & update scores
CREATE POLICY "anon_insert_scores"
  ON public.scores FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_scores"
  ON public.scores FOR UPDATE USING (true);
