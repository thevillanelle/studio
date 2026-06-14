-- ============================================================
-- RITUALWARE — Master Platform Schema
-- Covers all apps: m'atelier, Ritualwear, Ritualwhere, Glow Up
-- Run in Supabase SQL Editor — all statements are idempotent
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: atelier_projects (user-scoped projects)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atelier_projects (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  status      TEXT        DEFAULT 'active' CHECK (status IN ('active','planning','wrap','complete','cancelled')),
  objective   TEXT,
  task_1      TEXT,
  task_2      TEXT,
  task_3      TEXT,
  end_date    DATE,
  link        TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atelier_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own projects" ON atelier_projects;
CREATE POLICY "Users manage own projects" ON atelier_projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_atelier_projects_user_id ON atelier_projects(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: atelier_circle (people in your life)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atelier_circle (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  role        TEXT,
  email       TEXT,
  notes       TEXT,
  work_skills TEXT[]      DEFAULT '{}',
  non_work    TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atelier_circle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own circle" ON atelier_circle;
CREATE POLICY "Users manage own circle" ON atelier_circle FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_atelier_circle_user_id ON atelier_circle(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: atelier_skills (what you know)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atelier_skills (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  category    TEXT        DEFAULT 'Other',
  level       TEXT        DEFAULT 'Familiar' CHECK (level IN ('Learning','Familiar','Proficient','Expert')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atelier_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own skills" ON atelier_skills;
CREATE POLICY "Users manage own skills" ON atelier_skills FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_atelier_skills_user_id ON atelier_skills(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: atelier_goals (where you're going)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atelier_goals (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  category    TEXT        DEFAULT 'Personal',
  timeframe   TEXT        DEFAULT 'This quarter',
  description TEXT,
  is_complete BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atelier_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own goals" ON atelier_goals;
CREATE POLICY "Users manage own goals" ON atelier_goals FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_atelier_goals_user_id ON atelier_goals(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: style_profiles (Ritualwear — Style Bible)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS style_profiles (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kibbe_type            TEXT,
  color_season          TEXT,
  undertone             TEXT,
  metal_preference      TEXT,
  body_notes            JSONB       DEFAULT '{"emphasize":[],"minimize":[]}',
  current_rules         TEXT[]      DEFAULT '{}',
  palette_loves         TEXT[]      DEFAULT '{}',
  palette_avoids        TEXT[]      DEFAULT '{}',
  fabric_loves          TEXT[]      DEFAULT '{}',
  fabric_avoids         TEXT[]      DEFAULT '{}',
  style_words           TEXT[]      DEFAULT '{}',
  designers_loved       TEXT[]      DEFAULT '{}',
  lifestyle_formality   SMALLINT    DEFAULT 3 CHECK (lifestyle_formality BETWEEN 1 AND 5),
  climate_base          TEXT,
  preferred_output      TEXT        DEFAULT 'text',
  last_updated          TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE style_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile"   ON style_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON style_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON style_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON style_profiles;
CREATE POLICY "Users can view own profile"   ON style_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON style_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON style_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON style_profiles FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_style_profiles_last_updated ON style_profiles(last_updated);

-- ─────────────────────────────────────────────────────────────
-- TABLE: style_rules (Ritualwear — custom style rules)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS style_rules (
  rule_id     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type   TEXT        NOT NULL DEFAULT 'outfit',
  rule_text   TEXT        NOT NULL,
  conditions  JSONB       DEFAULT '{}',
  source      TEXT        DEFAULT 'user-added',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE style_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own rules" ON style_rules;
CREATE POLICY "Users can manage own rules" ON style_rules FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_style_rules_user_id ON style_rules(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: inspo_images (Ritualwear — Gemini Vision uploads)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspo_images (
  image_id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url       TEXT        NOT NULL,
  extracted_tags  JSONB       DEFAULT '{}',
  added_to_bible  BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inspo_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own inspo images" ON inspo_images;
CREATE POLICY "Users can manage own inspo images" ON inspo_images FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_inspo_images_user_id ON inspo_images(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: saved_looks (Ritualwear — Oracle results)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_looks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion         TEXT        NOT NULL,
  recommendation   TEXT        NOT NULL,
  weather_summary  TEXT,
  is_favourite     BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saved_looks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own saved looks" ON saved_looks;
CREATE POLICY "Users can manage own saved looks" ON saved_looks FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_saved_looks_user_id ON saved_looks(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: neighborhood_results (Ritualwhere — quiz saves)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS neighborhood_results (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_neighborhood   TEXT        NOT NULL,
  score              INTEGER,
  all_results        JSONB,
  city               TEXT        DEFAULT 'NYC',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE neighborhood_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own neighborhood results" ON neighborhood_results;
CREATE POLICY "Users can manage own neighborhood results" ON neighborhood_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_neighborhood_results_user_id ON neighborhood_results(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: burnout_results (Ritualwhere — Burnout Audit)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS burnout_results (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  burnout_type TEXT        NOT NULL,
  severity     INTEGER,
  is_chronic   BOOLEAN     DEFAULT FALSE,
  protocol     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE burnout_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own burnout results" ON burnout_results;
CREATE POLICY "Users can manage own burnout results" ON burnout_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_burnout_results_user_id ON burnout_results(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: reinvention_plans (Ritualwhere — Quarterly Reinvention)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reinvention_plans (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_area TEXT        NOT NULL,
  moves         JSONB,
  answers       JSONB,
  quarter       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reinvention_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reinvention plans" ON reinvention_plans;
CREATE POLICY "Users can manage own reinvention plans" ON reinvention_plans FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_reinvention_plans_user_id ON reinvention_plans(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: glow_up_results (Glow Up — audit results)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS glow_up_results (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers     JSONB,
  result      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE glow_up_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own glow up results" ON glow_up_results;
CREATE POLICY "Users can manage own glow up results" ON glow_up_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_glow_up_results_user_id ON glow_up_results(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: dating_profiles (Ritualwhere — Dating strategy)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dating_profiles (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dating_goal      TEXT,
  dominant_type    TEXT,
  main_strategy    TEXT,
  pattern          TEXT,
  answers          JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dating_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own dating profiles" ON dating_profiles;
CREATE POLICY "Users can manage own dating profiles" ON dating_profiles FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dating_profiles_user_id ON dating_profiles(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: style_profiles — add missing quiz answer columns
-- All 32 quiz questions now persist; previously only 15 were saved.
-- Safe to run repeatedly (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS era_references       TEXT[]  DEFAULT '{}';
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS trend_stance         TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS statement_vs_cohesive TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS matching_philosophy  TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS social_contexts      TEXT[]  DEFAULT '{}';
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS heel_preference      TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS skin_showing_stance  TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS lip_preference       TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS lip_logic            TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS lip_custom           TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS nail_shape           TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS fragrance_family     TEXT[]  DEFAULT '{}';
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS jewelry_default      TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS default_reach        TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS never_wears          TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS style_uniform        TEXT;
ALTER TABLE style_profiles ADD COLUMN IF NOT EXISTS style_mistake        TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: style_finder_results (Glow Up — Style Finder quiz saves)
-- Written by glow-up/src/pages/StyleFinder.jsx but was missing from schema.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS style_finder_results (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype   TEXT        NOT NULL,
  answers     JSONB       DEFAULT '{}',
  result      JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE style_finder_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own style finder results" ON style_finder_results;
CREATE POLICY "Users can manage own style finder results" ON style_finder_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_style_finder_results_user_id ON style_finder_results(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: ritual_narratives (marketing site — AI-generated case study prose)
-- Generated by Gemini from all quiz data; stored so it's never regenerated.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ritual_narratives (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  narrative    TEXT        NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  input_hash   TEXT,
  UNIQUE (user_id)
);
ALTER TABLE ritual_narratives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own narrative" ON ritual_narratives;
CREATE POLICY "Users can manage own narrative" ON ritual_narratives FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RITUALWEALTH + M'ATELIER: FIRE Planning Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_fire_plans (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fire_type         TEXT,       -- lean_fire | regular_fire | fat_fire | barista_fire | coast_fire
  target_number     NUMERIC,
  target_age        SMALLINT,
  current_age       SMALLINT,
  monthly_surplus   NUMERIC,
  monthly_income    NUMERIC,
  monthly_expenses  NUMERIC,
  current_net_worth NUMERIC,
  notes             TEXT,
  source            TEXT        DEFAULT 'quiz', -- 'quiz' | 'manual'
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE user_fire_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own fire plan" ON user_fire_plans;
CREATE POLICY "Users manage own fire plan" ON user_fire_plans FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_career_tracks (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  salary_min    NUMERIC,
  salary_max    NUMERIC,
  currency      TEXT        DEFAULT 'USD',
  readiness_pct SMALLINT    DEFAULT 0 CHECK (readiness_pct BETWEEN 0 AND 100),
  status        TEXT        DEFAULT 'active', -- active | paused | complete
  notes         TEXT,
  sort_order    SMALLINT    DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_career_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own career tracks" ON user_career_tracks;
CREATE POLICY "Users manage own career tracks" ON user_career_tracks FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_career_tracks_user ON user_career_tracks(user_id);

CREATE TABLE IF NOT EXISTS user_home_plan (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_city           TEXT,
  neighborhood          TEXT,
  property_type         TEXT,
  target_price          NUMERIC,
  down_payment_target   NUMERIC,
  down_payment_current  NUMERIC    DEFAULT 0,
  artist_enclave        BOOLEAN    DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE user_home_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own home plan" ON user_home_plan;
CREATE POLICY "Users manage own home plan" ON user_home_plan FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_skills (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  current_level TEXT,       -- beginner | a1 | a2 | b1 | b2 | c1 | c2 | intermediate | advanced | expert
  target_level  TEXT,
  practice_note TEXT,
  sort_order    SMALLINT    DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own skills" ON user_skills;
CREATE POLICY "Users manage own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON user_skills(user_id);

CREATE TABLE IF NOT EXISTS user_savings_buckets (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  target        NUMERIC     NOT NULL,
  current       NUMERIC     DEFAULT 0,
  do_not_touch  BOOLEAN     DEFAULT FALSE,
  notes         TEXT,
  sort_order    SMALLINT    DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_savings_buckets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own savings buckets" ON user_savings_buckets;
CREATE POLICY "Users manage own savings buckets" ON user_savings_buckets FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_savings_buckets_user ON user_savings_buckets(user_id);

CREATE TABLE IF NOT EXISTS user_contingency_rules (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger     TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  enabled     BOOLEAN     DEFAULT TRUE,
  sort_order  SMALLINT    DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_contingency_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own contingency rules" ON user_contingency_rules;
CREATE POLICY "Users manage own contingency rules" ON user_contingency_rules FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_contingency_rules_user ON user_contingency_rules(user_id);

-- Quiz results from Ritualwealth (raw answers + derived plan snapshot)
CREATE TABLE IF NOT EXISTS fire_quiz_results (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_slug   TEXT        NOT NULL, -- fire_type | career | home | creative | risk
  answers     JSONB       DEFAULT '{}',
  result      JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fire_quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own quiz results" ON fire_quiz_results;
CREATE POLICY "Users manage own quiz results" ON fire_quiz_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_fire_quiz_results_user ON fire_quiz_results(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROBIN: Internal analytics RPC functions
-- All run as SECURITY DEFINER (service role) and return only aggregates.
-- Admin gate: caller must be the registered admin email.
-- Min cohort: any bucket with < 50 members is suppressed before returning.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: verify caller is admin (replace email if yours changes)
CREATE OR REPLACE FUNCTION robin_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'krystine.hall@gmail.com'
  )
$$;

-- Overview: total users, completion rates per quiz, avg formality
CREATE OR REPLACE FUNCTION robin_overview()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN NOT robin_is_admin() THEN '{"error":"unauthorized"}'::json ELSE
  json_build_object(
    'total_users',           (SELECT COUNT(DISTINCT user_id) FROM style_profiles),
    'with_style_profile',    (SELECT COUNT(*) FROM style_profiles WHERE kibbe_type IS NOT NULL),
    'with_glow_up',          (SELECT COUNT(DISTINCT user_id) FROM glow_up_results),
    'with_style_finder',     (SELECT COUNT(DISTINCT user_id) FROM style_finder_results),
    'with_neighborhood',     (SELECT COUNT(DISTINCT user_id) FROM neighborhood_results),
    'with_dating_profile',   (SELECT COUNT(DISTINCT user_id) FROM dating_profiles),
    'with_narrative',        (SELECT COUNT(*) FROM ritual_narratives),
    'avg_lifestyle_formality',(SELECT ROUND(AVG(lifestyle_formality)::numeric, 1) FROM style_profiles WHERE lifestyle_formality IS NOT NULL),
    'total_saved_looks',     (SELECT COUNT(*) FROM saved_looks),
    'total_style_rules',     (SELECT COUNT(*) FROM style_rules)
  ) END
$$;

-- Distribution: any TEXT column on style_profiles, suppresses buckets < 50
CREATE OR REPLACE FUNCTION robin_distribution(col_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  min_cohort INT := 50;
BEGIN
  IF NOT robin_is_admin() THEN RETURN '{"error":"unauthorized"}'::json; END IF;
  IF col_name NOT IN (
    'kibbe_type','color_season','undertone','metal_preference',
    'trend_stance','statement_vs_cohesive','matching_philosophy',
    'heel_preference','skin_showing_stance','lip_preference','lip_logic',
    'nail_shape','jewelry_default','default_reach','lifestyle_formality',
    'preferred_output'
  ) THEN RETURN '{"error":"invalid column"}'::json; END IF;

  EXECUTE format(
    'SELECT json_agg(row_to_json(t)) FROM (
       SELECT %I AS value, COUNT(*)::int AS n
       FROM style_profiles
       WHERE %I IS NOT NULL
       GROUP BY %I
       HAVING COUNT(*) >= $1
       ORDER BY COUNT(*) DESC
     ) t',
    col_name, col_name, col_name
  ) USING min_cohort INTO result;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Array column distribution (unnests TEXT[] columns)
CREATE OR REPLACE FUNCTION robin_array_distribution(col_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  min_cohort INT := 50;
BEGIN
  IF NOT robin_is_admin() THEN RETURN '{"error":"unauthorized"}'::json; END IF;
  IF col_name NOT IN (
    'era_references','palette_loves','palette_avoids','fabric_loves',
    'fabric_avoids','style_words','designers_loved','fragrance_family',
    'social_contexts'
  ) THEN RETURN '{"error":"invalid column"}'::json; END IF;

  EXECUTE format(
    'SELECT json_agg(row_to_json(t)) FROM (
       SELECT val AS value, COUNT(DISTINCT user_id)::int AS n
       FROM style_profiles, unnest(%I) AS val
       GROUP BY val
       HAVING COUNT(DISTINCT user_id) >= $1
       ORDER BY COUNT(DISTINCT user_id) DESC
       LIMIT 20
     ) t',
    col_name
  ) USING min_cohort INTO result;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Glow Up tier distribution
CREATE OR REPLACE FUNCTION robin_glow_tiers()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN NOT robin_is_admin() THEN '{"error":"unauthorized"}'::json ELSE (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT result->>'overall_tier' AS tier, COUNT(*)::int AS n
      FROM glow_up_results
      WHERE result->>'overall_tier' IS NOT NULL
      GROUP BY result->>'overall_tier'
      HAVING COUNT(*) >= 50
      ORDER BY COUNT(*) DESC
    ) t
  ) END
$$;

-- Style Finder archetype distribution
CREATE OR REPLACE FUNCTION robin_archetypes()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN NOT robin_is_admin() THEN '{"error":"unauthorized"}'::json ELSE (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT result->>'persona_name' AS archetype, COUNT(*)::int AS n
      FROM style_finder_results
      WHERE result->>'persona_name' IS NOT NULL
      GROUP BY result->>'persona_name'
      HAVING COUNT(*) >= 50
      ORDER BY COUNT(*) DESC
    ) t
  ) END
$$;

-- Top neighborhoods
CREATE OR REPLACE FUNCTION robin_neighborhoods()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN NOT robin_is_admin() THEN '{"error":"unauthorized"}'::json ELSE (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT top_neighborhood AS value, COUNT(*)::int AS n
      FROM neighborhood_results
      WHERE top_neighborhood IS NOT NULL
      GROUP BY top_neighborhood
      HAVING COUNT(*) >= 50
      ORDER BY COUNT(*) DESC
      LIMIT 15
    ) t
  ) END
$$;

-- Weekly new users (last 12 weeks)
CREATE OR REPLACE FUNCTION robin_growth()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN NOT robin_is_admin() THEN '{"error":"unauthorized"}'::json ELSE (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.week), '[]'::json) FROM (
      SELECT DATE_TRUNC('week', created_at)::date AS week, COUNT(*)::int AS n
      FROM style_profiles
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week
    ) t
  ) END
$$;
