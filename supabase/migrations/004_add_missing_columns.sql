-- ============================================================
-- GenZ Hikers — Add Missing Columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── elections table: missing columns ─────────────────────────
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS results_announce_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_published_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allow_all_members     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_hikes_to_vote     INTEGER NOT NULL DEFAULT 0;

-- ── profiles table: missing columns ──────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS executive_designation TEXT,
  ADD COLUMN IF NOT EXISTS election_won_at       TIMESTAMPTZ;

-- ── user_roles table (if not created by migration 002) ───────
CREATE TABLE IF NOT EXISTS user_roles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  granted_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist, recreate cleanly
DO $$
BEGIN
  DROP POLICY IF EXISTS "View roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins manage user roles" ON user_roles;
  DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

CREATE POLICY "View roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage user roles" ON user_roles
  FOR ALL USING (is_admin());

-- ── Auto-increment vote count trigger (idempotent) ────────────
CREATE OR REPLACE FUNCTION increment_candidate_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE election_candidates
  SET vote_count = vote_count + 1
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_vote_count ON election_votes;
CREATE TRIGGER trg_increment_vote_count
  AFTER INSERT ON election_votes
  FOR EACH ROW EXECUTE FUNCTION increment_candidate_vote_count();

-- ── Verify ────────────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'elections'
ORDER BY ordinal_position;
