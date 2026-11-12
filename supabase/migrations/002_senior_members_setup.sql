-- ============================================================
-- GenZ Hikers — Senior Members, Multi-Role & Auto-Designation
-- Run in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- ── 1. Add user_roles junction table (multiple roles per user) ──
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  granted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,  -- permanent = cannot be revoked by admins
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin','admin','senior_member')
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);


-- ── 2. Expand the allowed role values ─────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'super_admin',
    'admin',
    'senior_member',
    'executive',        -- elected executive council member
    'organizer',
    'moderator',
    'verified_member',
    'member'
  ));


-- ── 3. Add executive_designation column to profiles ───────────
-- Stores the elected position title after an election closes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS executive_designation TEXT,
  ADD COLUMN IF NOT EXISTS election_won_at TIMESTAMPTZ;


-- ── 4. Function: check if a user has a specific role ──────────
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check primary role on profiles
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = p_role) THEN
    RETURN TRUE;
  END IF;
  -- Check secondary roles in user_roles
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 5. AUTO-DESIGNATION: Function called when election closes ──
-- When an election moves to 'results_published', this function:
--   a) Finds the winner (most votes) per position
--   b) Sets their executive_designation on profiles
--   c) Grants them the 'executive' role
--   d) Records when they won
CREATE OR REPLACE FUNCTION publish_election_results(p_election_id UUID)
RETURNS TABLE(position_title TEXT, winner_name TEXT, vote_count INT) AS $$
DECLARE
  pos RECORD;
  winner RECORD;
BEGIN
  -- Loop over all positions in this election
  FOR pos IN
    SELECT id, title FROM election_positions WHERE election_id = p_election_id
  LOOP
    -- Find candidate with most votes for this position
    SELECT
      ec.user_id,
      ec.vote_count,
      p.full_name
    INTO winner
    FROM election_candidates ec
    JOIN profiles p ON p.id = ec.user_id
    WHERE ec.election_id = p_election_id
      AND ec.position_id = pos.id
      AND ec.is_approved = TRUE
    ORDER BY ec.vote_count DESC
    LIMIT 1;

    IF winner IS NOT NULL AND winner.vote_count > 0 THEN
      -- Update the winner's profile with their new designation
      UPDATE profiles SET
        executive_designation = pos.title,
        election_won_at       = NOW(),
        role                  = CASE
                                  WHEN role = 'super_admin' THEN 'super_admin'  -- preserve super_admin
                                  WHEN role = 'senior_member' THEN 'senior_member' -- preserve senior
                                  ELSE 'executive'
                                END
      WHERE id = winner.user_id;

      -- Also insert into user_roles so they keep it permanently
      INSERT INTO user_roles (user_id, role, is_permanent)
      VALUES (winner.user_id, 'executive', TRUE)
      ON CONFLICT (user_id, role) DO UPDATE SET is_permanent = TRUE;

      position_title := pos.title;
      winner_name    := winner.full_name;
      vote_count     := winner.vote_count;
      RETURN NEXT;
    END IF;
  END LOOP;

  -- Mark election as results published
  UPDATE elections
  SET status = 'results_published', results_published_at = NOW()
  WHERE id = p_election_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 6. Auto-publish results trigger when status changes ───────
CREATE OR REPLACE FUNCTION auto_publish_results_on_close()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'results_published' AND OLD.status != 'results_published' THEN
    PERFORM publish_election_results(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_publish_results ON elections;
CREATE TRIGGER trg_auto_publish_results
  AFTER UPDATE OF status ON elections
  FOR EACH ROW EXECUTE FUNCTION auto_publish_results_on_close();


-- ── 7. Protect senior/super_admin roles from downgrade ────────
CREATE OR REPLACE FUNCTION protect_privileged_roles()
RETURNS TRIGGER AS $$
DECLARE
  actor_role TEXT;
BEGIN
  SELECT role INTO actor_role FROM profiles WHERE id = auth.uid();

  -- Prevent non-super_admin from changing super_admin or senior_member roles
  IF OLD.role IN ('super_admin', 'senior_member') THEN
    IF actor_role != 'super_admin' THEN
      -- Silently keep the old role instead of throwing error
      NEW.role := OLD.role;
    END IF;
  END IF;

  -- Prevent anyone from removing their own super_admin role
  IF OLD.id = auth.uid() AND OLD.role = 'super_admin' THEN
    NEW.role := 'super_admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_privileged_roles ON profiles;
CREATE TRIGGER trg_protect_privileged_roles
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_roles();


-- ── 8. Voting eligibility: ANY registered member can vote ─────
-- Remove the 2-hike requirement from RLS — it's now enforced
-- in application logic based on admin configuration per election.
-- The election table gets a new 'min_hikes_to_vote' column.

ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS min_hikes_to_vote INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_all_members  BOOLEAN NOT NULL DEFAULT TRUE;

-- Default: all members can vote (min 0 hikes)
UPDATE elections SET min_hikes_to_vote = 0, allow_all_members = TRUE
WHERE min_hikes_to_vote IS NULL;


-- ── 9. Update vote count automatically when a vote is cast ────
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


-- ── 10. Grant initial roles to known senior members ───────────
-- Run AFTER members have registered via /auth/register

-- Talat Hussain — Head → super_admin + senior_member
-- (replace email with actual)
-- UPDATE profiles SET role = 'super_admin', is_senior_member = TRUE, membership_status = 'active'
-- WHERE email = 'talat@example.com';
-- INSERT INTO user_roles(user_id, role, is_permanent)
-- SELECT id, 'senior_member', TRUE FROM profiles WHERE email = 'talat@example.com'
-- ON CONFLICT DO NOTHING;

-- Template for any member — copy & repeat:
-- UPDATE profiles SET
--   role = 'senior_member',          -- primary role
--   is_senior_member = TRUE,
--   membership_status = 'active'
-- WHERE email = 'member@example.com';
-- INSERT INTO user_roles(user_id, role, is_permanent)
-- SELECT id, 'senior_member', TRUE FROM profiles WHERE email = 'member@example.com'
-- ON CONFLICT DO NOTHING;

-- To give someone BOTH admin AND senior_member:
-- UPDATE profiles SET role = 'admin', is_senior_member = TRUE WHERE email = 'you@example.com';
-- INSERT INTO user_roles(user_id, role, is_permanent)
-- SELECT id, 'senior_member', TRUE FROM profiles WHERE email = 'you@example.com'
-- ON CONFLICT DO NOTHING;


-- ── 11. Useful helper views ────────────────────────────────────

-- View: all roles a user holds (primary + secondary)
CREATE OR REPLACE VIEW v_user_all_roles AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role AS primary_role,
  p.is_senior_member,
  p.executive_designation,
  ARRAY(
    SELECT ur.role FROM user_roles ur WHERE ur.user_id = p.id
  ) AS additional_roles
FROM profiles p;

-- View: election results with winner per position
CREATE OR REPLACE VIEW v_election_results AS
SELECT
  e.id   AS election_id,
  e.title AS election_title,
  ep.title AS position,
  p.full_name AS winner,
  ec.vote_count,
  e.results_published_at
FROM elections e
JOIN election_positions ep ON ep.election_id = e.id
JOIN election_candidates ec ON ec.election_id = e.id AND ec.position_id = ep.id
JOIN profiles p ON p.id = ec.user_id
WHERE e.status = 'results_published'
AND ec.vote_count = (
  SELECT MAX(ec2.vote_count)
  FROM election_candidates ec2
  WHERE ec2.election_id = e.id AND ec2.position_id = ep.id
)
ORDER BY e.results_published_at DESC, ep.sort_order;


-- ── VERIFICATION QUERY (run to confirm setup) ─────────────────
SELECT
  'Schema updated successfully' AS status,
  COUNT(*) AS total_members
FROM profiles;
