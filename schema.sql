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
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_match   TEXT        NOT NULL,
  answers     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
      SELECT top_match AS value, COUNT(*)::int AS n
      FROM neighborhood_results
      WHERE top_match IS NOT NULL
      GROUP BY top_match
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

-- ============================================================
-- PHASE 2 — SOCIAL INFRASTRUCTURE
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: friendships (bidirectional friend connections)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own friendships" ON friendships;
CREATE POLICY "Users manage own friendships" ON friendships FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: groups
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  cover_emoji  TEXT        DEFAULT '✦',
  privacy      TEXT        NOT NULL DEFAULT 'private' CHECK (privacy IN ('public','private','invite_only')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can read groups" ON groups;
DROP POLICY IF EXISTS "Group admins manage groups" ON groups;
CREATE POLICY "Group members can read groups" ON groups FOR SELECT
  USING (
    privacy = 'public'
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.status = 'active')
  );
CREATE POLICY "Group admins manage groups" ON groups FOR ALL
  USING (created_by = auth.uid());
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- ─────────────────────────────────────────────────────────────
-- TABLE: group_members
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','banned')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read group membership" ON group_members;
DROP POLICY IF EXISTS "Admins manage group membership" ON group_members;
CREATE POLICY "Members read group membership" ON group_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid() AND gm2.status = 'active'
  ));
CREATE POLICY "Admins manage group membership" ON group_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin','moderator')
  ) OR user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON group_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: activity_feed
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_feed (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name   TEXT,
  event_type   TEXT        NOT NULL,
  -- event_type values: quiz_completed | fire_milestone | look_saved |
  --   style_result | neighborhood_match | friend_joined | group_created |
  --   challenge_completed | badge_earned
  payload      JSONB       DEFAULT '{}',
  visibility   TEXT        NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public','friends','group','private')),
  group_id     UUID        REFERENCES groups(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own and friends feed" ON activity_feed;
DROP POLICY IF EXISTS "Users write own activity" ON activity_feed;
CREATE POLICY "Users write own activity" ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own and friends feed" ON activity_feed FOR SELECT
  USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.addressee_id = user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = user_id))
    ))
    OR (visibility = 'group' AND group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = activity_feed.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
    ))
  );
CREATE INDEX IF NOT EXISTS idx_activity_feed_user    ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- TABLE: notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  -- type values: friend_request | friend_accepted | group_invite |
  --   challenge_invite | badge_earned | milestone_reached
  title        TEXT        NOT NULL,
  body         TEXT,
  payload      JSONB       DEFAULT '{}',
  read         BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ─────────────────────────────────────────────────────────────
-- TABLE: privacy_settings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility  TEXT DEFAULT 'friends' CHECK (profile_visibility IN ('public','friends','private')),
  fire_visibility     TEXT DEFAULT 'private' CHECK (fire_visibility IN ('public','friends','private')),
  style_visibility    TEXT DEFAULT 'friends' CHECK (style_visibility IN ('public','friends','private')),
  activity_visibility TEXT DEFAULT 'friends' CHECK (activity_visibility IN ('public','friends','private')),
  searchable          BOOLEAN DEFAULT TRUE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own privacy" ON privacy_settings;
CREATE POLICY "Users manage own privacy" ON privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: shared_buckets (group savings goals)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_buckets (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     UUID        REFERENCES groups(id) ON DELETE CASCADE,
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  goal_amount  NUMERIC(12,2),
  deadline     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shared_buckets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members read shared buckets" ON shared_buckets;
DROP POLICY IF EXISTS "Bucket creator manages bucket" ON shared_buckets;
CREATE POLICY "Group members read shared buckets" ON shared_buckets FOR SELECT
  USING (
    created_by = auth.uid()
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = shared_buckets.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
    ))
  );
CREATE POLICY "Bucket creator manages bucket" ON shared_buckets FOR ALL
  USING (created_by = auth.uid());
CREATE INDEX IF NOT EXISTS idx_shared_buckets_group ON shared_buckets(group_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: shared_bucket_contributions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_bucket_contributions (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id  UUID          NOT NULL REFERENCES shared_buckets(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  note       TEXT,
  logged_at  TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE shared_bucket_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members log own contributions" ON shared_bucket_contributions;
DROP POLICY IF EXISTS "Members read bucket contributions" ON shared_bucket_contributions;
CREATE POLICY "Members log own contributions" ON shared_bucket_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members read bucket contributions" ON shared_bucket_contributions FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_buckets sb
      JOIN group_members gm ON gm.group_id = sb.group_id
      WHERE sb.id = bucket_id AND gm.user_id = auth.uid() AND gm.status = 'active'
    )
  );
CREATE INDEX IF NOT EXISTS idx_contributions_bucket ON shared_bucket_contributions(bucket_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: group_challenges
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_challenges (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID        REFERENCES groups(id) ON DELETE CASCADE,
  created_by      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  challenge_type  TEXT        DEFAULT 'savings' CHECK (challenge_type IN ('savings','style','habit','fire','custom')),
  target_value    NUMERIC(12,2),
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members read challenges" ON group_challenges;
DROP POLICY IF EXISTS "Challenge creator manages challenge" ON group_challenges;
CREATE POLICY "Group members read challenges" ON group_challenges FOR SELECT
  USING (
    created_by = auth.uid()
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_challenges.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
    ))
  );
CREATE POLICY "Challenge creator manages challenge" ON group_challenges FOR ALL
  USING (created_by = auth.uid());
CREATE INDEX IF NOT EXISTS idx_challenges_group ON group_challenges(group_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: challenge_participants
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_participants (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id   UUID          NOT NULL REFERENCES group_challenges(id) ON DELETE CASCADE,
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_value NUMERIC(12,2) DEFAULT 0,
  completed      BOOLEAN       DEFAULT FALSE,
  joined_at      TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants manage own progress" ON challenge_participants;
DROP POLICY IF EXISTS "Challenge members read participants" ON challenge_participants;
CREATE POLICY "Participants manage own progress" ON challenge_participants FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Challenge members read participants" ON challenge_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_challenges gc
    JOIN group_members gm ON gm.group_id = gc.group_id
    WHERE gc.id = challenge_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  ) OR user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user      ON challenge_participants(user_id);

-- ─────────────────────────────────────────────────────────────
-- RPC: get_friend_feed(p_limit, p_offset)
-- Returns signed-in user's feed + accepted friends' public/friends posts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_friend_feed(p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
RETURNS TABLE (
  id          UUID,
  user_id     UUID,
  actor_name  TEXT,
  event_type  TEXT,
  payload     JSONB,
  visibility  TEXT,
  group_id    UUID,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT af.id, af.user_id, af.actor_name, af.event_type,
         af.payload, af.visibility, af.group_id, af.created_at
  FROM activity_feed af
  WHERE
    af.user_id = auth.uid()
    OR af.visibility = 'public'
    OR (af.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.addressee_id = af.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = af.user_id))
    ))
  ORDER BY af.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: send_friend_request(target_id UUID)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_friend_request(target_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing friendships%ROWTYPE;
BEGIN
  IF target_id = auth.uid() THEN
    RETURN '{"error":"cannot add yourself"}'::json;
  END IF;
  SELECT * INTO existing FROM friendships
  WHERE (requester_id = auth.uid() AND addressee_id = target_id)
     OR (requester_id = target_id AND addressee_id = auth.uid());
  IF FOUND THEN
    RETURN json_build_object('status', existing.status);
  END IF;
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (auth.uid(), target_id, 'pending');
  INSERT INTO notifications (user_id, type, title, body, payload)
  VALUES (target_id, 'friend_request', 'New connection request',
    'Someone wants to connect with you on Ritualware.',
    json_build_object('from_user_id', auth.uid())::jsonb);
  RETURN '{"status":"pending"}'::json;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: accept_friend_request(requester UUID)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION accept_friend_request(requester UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE friendships SET status = 'accepted', updated_at = NOW()
  WHERE requester_id = requester AND addressee_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN
    RETURN '{"error":"request not found"}'::json;
  END IF;
  INSERT INTO notifications (user_id, type, title, body, payload)
  VALUES (requester, 'friend_accepted', 'Connection accepted',
    'Your connection request was accepted.',
    json_build_object('from_user_id', auth.uid())::jsonb);
  RETURN '{"status":"accepted"}'::json;
END;
$$;

-- ============================================================
-- PHASE 3 — GAMIFICATION
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: badges (badge definitions)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  description  TEXT,
  emoji        TEXT    DEFAULT '🏅',
  app          TEXT    NOT NULL DEFAULT 'cross'
    CHECK (app IN ('ritualwear','glowup','ritualwhere','ritualwealth','matelier','cross')),
  trigger_type TEXT    NOT NULL DEFAULT 'manual',
  -- trigger_type values: manual | quiz_completed | milestone | challenge_completed |
  --   friend_joined | group_created | streak | full_sync
  trigger_meta JSONB   DEFAULT '{}',
  points_value INT     DEFAULT 0,
  is_secret    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges are public" ON badges;
CREATE POLICY "Badges are public" ON badges FOR SELECT USING (TRUE);

-- Seed badge definitions
INSERT INTO badges (slug, name, description, emoji, app, trigger_type, points_value) VALUES
  ('synced_squad',        'Synced Squad',         'Coordinate outfits with your group',                     '👗', 'ritualwear',   'group_created',       25),
  ('runway_ready',        'Runway Ready',          'Complete a group style challenge',                        '✨', 'ritualwear',   'challenge_completed', 50),
  ('glow_up_gang',        'Glow Up Gang',          'Start a group Glow Up audit',                             '🔺', 'glowup',       'group_created',       25),
  ('product_pals',        'Product Pals',          'Complete a 30-day product testing challenge',              '🧴', 'glowup',       'challenge_completed', 50),
  ('neighborhood_nine',   'Neighborhood Nine',     'Run a group neighborhood match',                          '📍', 'ritualwhere',  'challenge_completed', 25),
  ('rent_split_ready',    'Rent Split Ready',      'Set up a shared address with your group',                 '🏠', 'ritualwhere',  'milestone',           50),
  ('fire_family',         'FIRE Family',           'Create a Team FIRE hub',                                  '🔥', 'ritualwealth', 'group_created',       25),
  ('enclave_architects',  'Enclave Architects',    'Hit a shared savings milestone',                          '🏛',  'ritualwealth', 'milestone',           50),
  ('debt_destroyers',     'Debt Destroyers',       'Your team reaches collective debt $0',                    '💥', 'ritualwealth', 'milestone',           100),
  ('full_sync',           'Full Sync',             'Complete all 5 Ritualware apps',                          '⬡',  'cross',        'full_sync',           100),
  ('cheerleader_supreme', 'Cheerleader Supreme',   'Cheer on 50 friends across the platform',                 '📣', 'cross',        'milestone',           75),
  ('quiz_taker',          'Quiz Taker',            'Complete your first Ritualwealth quiz',                   '🧠', 'ritualwealth', 'quiz_completed',      10),
  ('fire_mapped',         'FIRE Mapped',           'Complete all 5 Ritualwealth quizzes',                     '🗺',  'ritualwealth', 'quiz_completed',      50),
  ('style_unlocked',      'Style Unlocked',        'Complete your Style Bible',                                '💄', 'ritualwear',   'quiz_completed',      25),
  ('neighbor_found',      'Neighbor Found',        'Get your first neighborhood match',                       '🏙',  'ritualwhere',  'quiz_completed',      25),
  ('glow_scored',         'Glow Scored',           'Complete your first Glow Up audit',                       '✦',  'glowup',       'quiz_completed',      25)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- TABLE: user_badges (earned badges)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   UUID        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  context    JSONB       DEFAULT '{}',
  UNIQUE (user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own badges" ON user_badges;
DROP POLICY IF EXISTS "Users read friends badges" ON user_badges;
DROP POLICY IF EXISTS "System awards badges" ON user_badges;
CREATE POLICY "Users read own badges" ON user_badges FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users read friends badges" ON user_badges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM friendships f WHERE f.status = 'accepted'
      AND ((f.requester_id = auth.uid() AND f.addressee_id = user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = user_id))
  ));
CREATE POLICY "System awards badges" ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: points_transactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS points_transactions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points       INT         NOT NULL,
  -- positive = earn, negative = spend
  reason       TEXT        NOT NULL,
  -- reason values: cheer | challenge_complete | milestone | badge_earned |
  --   quiz_completed | friend_joined | group_created | streak | manual
  reference_id UUID,
  -- optional FK to the thing that caused the points (challenge, badge, etc.)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own points" ON points_transactions;
DROP POLICY IF EXISTS "Users earn own points" ON points_transactions;
CREATE POLICY "Users read own points" ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users earn own points" ON points_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_points_user    ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON points_transactions(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- RPC: award_badge(p_badge_slug TEXT, p_context JSONB)
-- Awards a badge + points to the signed-in user (idempotent)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_badge(p_badge_slug TEXT, p_context JSONB DEFAULT '{}')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge badges%ROWTYPE;
  v_existing user_badges%ROWTYPE;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE slug = p_badge_slug;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'badge not found');
  END IF;

  SELECT * INTO v_existing FROM user_badges
  WHERE user_id = auth.uid() AND badge_id = v_badge.id;
  IF FOUND THEN
    RETURN json_build_object('status', 'already_earned', 'badge', v_badge.name);
  END IF;

  INSERT INTO user_badges (user_id, badge_id, context)
  VALUES (auth.uid(), v_badge.id, p_context);

  IF v_badge.points_value > 0 THEN
    INSERT INTO points_transactions (user_id, points, reason, reference_id)
    VALUES (auth.uid(), v_badge.points_value, 'badge_earned', v_badge.id);
  END IF;

  INSERT INTO notifications (user_id, type, title, body, payload)
  VALUES (auth.uid(), 'badge_earned',
    'Badge earned: ' || v_badge.emoji || ' ' || v_badge.name,
    v_badge.description,
    json_build_object('badge_slug', p_badge_slug, 'points', v_badge.points_value)::jsonb);

  INSERT INTO activity_feed (user_id, event_type, payload, visibility)
  VALUES (auth.uid(), 'badge_earned',
    json_build_object('badge_slug', p_badge_slug, 'badge_name', v_badge.name, 'emoji', v_badge.emoji)::jsonb,
    'friends');

  RETURN json_build_object('status', 'awarded', 'badge', v_badge.name, 'points', v_badge.points_value);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: add_points(p_points INT, p_reason TEXT, p_reference_id UUID)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_points(p_points INT, p_reason TEXT, p_reference_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO points_transactions (user_id, points, reason, reference_id)
  VALUES (auth.uid(), p_points, p_reason, p_reference_id);
  RETURN json_build_object('status', 'ok', 'points', p_points);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_leaderboard(p_group_id UUID, p_period TEXT)
-- Returns ranked points totals for a group (weekly/monthly/all_time)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_leaderboard(p_group_id UUID DEFAULT NULL, p_period TEXT DEFAULT 'all_time')
RETURNS TABLE (
  user_id    UUID,
  total_pts  BIGINT,
  badge_count BIGINT,
  rank       BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH period_filter AS (
    SELECT CASE p_period
      WHEN 'weekly'  THEN NOW() - INTERVAL '7 days'
      WHEN 'monthly' THEN NOW() - INTERVAL '30 days'
      ELSE '1970-01-01'::TIMESTAMPTZ
    END AS since
  ),
  eligible_users AS (
    SELECT DISTINCT gm.user_id FROM group_members gm
    WHERE p_group_id IS NOT NULL AND gm.group_id = p_group_id AND gm.status = 'active'
    UNION
    SELECT auth.uid() WHERE p_group_id IS NULL
    UNION
    SELECT f.addressee_id FROM friendships f WHERE p_group_id IS NULL AND f.requester_id = auth.uid() AND f.status = 'accepted'
    UNION
    SELECT f.requester_id FROM friendships f WHERE p_group_id IS NULL AND f.addressee_id = auth.uid() AND f.status = 'accepted'
  ),
  totals AS (
    SELECT pt.user_id,
      COALESCE(SUM(pt.points), 0) AS total_pts
    FROM points_transactions pt
    JOIN eligible_users eu ON eu.user_id = pt.user_id
    WHERE pt.created_at >= (SELECT since FROM period_filter) AND pt.points > 0
    GROUP BY pt.user_id
  ),
  badge_counts AS (
    SELECT ub.user_id, COUNT(*) AS badge_count
    FROM user_badges ub
    JOIN eligible_users eu ON eu.user_id = ub.user_id
    GROUP BY ub.user_id
  )
  SELECT t.user_id, t.total_pts,
    COALESCE(bc.badge_count, 0) AS badge_count,
    RANK() OVER (ORDER BY t.total_pts DESC) AS rank
  FROM totals t
  LEFT JOIN badge_counts bc ON bc.user_id = t.user_id
  ORDER BY rank;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_my_points_total()
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_points_total()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(points), 0)::INT FROM points_transactions WHERE user_id = auth.uid();
$$;
