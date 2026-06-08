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
