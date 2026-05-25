-- ============================================================
-- M'ATELIER — Schema additions
-- Add to Supabase SQL Editor (safe to run alongside existing schema)
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
