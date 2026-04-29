-- ============================================================
-- Kesher Ivrit — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS and CREATE OR REPLACE
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name   TEXT        NOT NULL,
  last_initial CHAR(1)     NOT NULL,
  school       TEXT        NOT NULL DEFAULT 'Independent Learner',
  level        TEXT,                          -- e.g. 'complete_beginner', 'intermediate'
  goal         TEXT,                          -- e.g. 'conversation', 'bar_mitzvah'
  secret_hash  TEXT,                          -- bcrypt hash of the student's secret word
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (first_name, last_initial, school)
);

-- If the table already exists, add the column safely:
ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_hash TEXT;

-- ── SCORES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points        INT         NOT NULL DEFAULT 0,
  streak        INT         NOT NULL DEFAULT 0,
  words_learned INT         NOT NULL DEFAULT 0,
  words_data    JSONB,                        -- full words list for cross-device restore
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- If the table already exists, add the column safely:
ALTER TABLE scores ADD COLUMN IF NOT EXISTS words_data JSONB;

-- ── CLANS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clans (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  school     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEACHERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  school      TEXT        NOT NULL,
  secret_hash TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, school)
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_manage_teachers" ON teachers;
CREATE POLICY "anon_manage_teachers" ON teachers FOR ALL USING (true);

-- ── CLAN MEMBERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clan_members (
  clan_id   UUID        NOT NULL REFERENCES clans(id)  ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (clan_id, user_id)
);

-- ── LEADERBOARD VIEW (joins users + scores) ──────────────────
-- The /api/leaderboard endpoint queries this view by name.
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.first_name,
  u.last_initial,
  u.school,
  u.level,
  COALESCE(s.points, 0)        AS points,
  COALESCE(s.streak, 0)        AS streak,
  COALESCE(s.words_learned, 0) AS words_learned,
  s.updated_at
FROM   users u
LEFT   JOIN scores s ON s.user_id = u.id
ORDER  BY points DESC;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- The app uses the anon key for all operations, so policies must
-- allow public read and authenticated write via anon role.

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;

-- Public read (leaderboard, clan list)
DROP POLICY IF EXISTS "public_read_users"        ON users;
DROP POLICY IF EXISTS "public_read_scores"       ON scores;
DROP POLICY IF EXISTS "public_read_clans"        ON clans;
DROP POLICY IF EXISTS "public_read_clan_members" ON clan_members;

CREATE POLICY "public_read_users"        ON users        FOR SELECT USING (true);
CREATE POLICY "public_read_scores"       ON scores       FOR SELECT USING (true);
CREATE POLICY "public_read_clans"        ON clans        FOR SELECT USING (true);
CREATE POLICY "public_read_clan_members" ON clan_members FOR SELECT USING (true);

-- Anon write (registration, score sync, clan creation/joining)
DROP POLICY IF EXISTS "anon_insert_users"         ON users;
DROP POLICY IF EXISTS "anon_upsert_scores"        ON scores;
DROP POLICY IF EXISTS "anon_manage_clans"         ON clans;
DROP POLICY IF EXISTS "anon_manage_clan_members"  ON clan_members;

CREATE POLICY "anon_insert_users"        ON users        FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_upsert_scores"       ON scores       FOR ALL    USING (true);
CREATE POLICY "anon_manage_clans"        ON clans        FOR ALL    USING (true);
CREATE POLICY "anon_manage_clan_members" ON clan_members FOR ALL    USING (true);
