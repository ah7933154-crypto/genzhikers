-- ============================================================
-- GenZ Hikers — COMPLETE SETUP (Run this AFTER 001_initial_schema.sql)
-- This file replaces migrations 002, 003, and 004
-- Run the ENTIRE file at once in Supabase SQL Editor
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 1: ADD MISSING COLUMNS                            ║
-- ╚══════════════════════════════════════════════════════════╝

-- Elections
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS results_announce_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allow_all_members    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_hikes_to_vote    INTEGER NOT NULL DEFAULT 0;

-- Profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS executive_designation TEXT,
  ADD COLUMN IF NOT EXISTS election_won_at       TIMESTAMPTZ;

-- Expand allowed roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'super_admin','admin','senior_member',
    'executive','organizer','moderator','verified_member','member'
  ));


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 2: USER_ROLES TABLE (multiple roles per user)     ║
-- ╚══════════════════════════════════════════════════════════╝

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


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 3: HELPER FUNCTIONS (must be created FIRST)       ║
-- ╚══════════════════════════════════════════════════════════╝

-- is_admin(): returns true if current user is admin/senior_member/super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'senior_member')
  );
END;
$$;

-- is_super_admin(): returns true only for super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$;

-- user_has_role(): check if user holds a specific role (primary or secondary)
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = p_role) THEN
    RETURN TRUE;
  END IF;
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 4: TRIGGERS                                       ║
-- ╚══════════════════════════════════════════════════════════╝

-- Auto-increment vote count when a vote is cast
CREATE OR REPLACE FUNCTION increment_candidate_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE election_candidates
  SET vote_count = vote_count + 1
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_vote_count ON election_votes;
CREATE TRIGGER trg_increment_vote_count
  AFTER INSERT ON election_votes
  FOR EACH ROW EXECUTE FUNCTION increment_candidate_vote_count();

-- Protect senior/super_admin roles from being downgraded
CREATE OR REPLACE FUNCTION protect_privileged_roles()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  actor_role TEXT;
BEGIN
  SELECT role INTO actor_role FROM profiles WHERE id = auth.uid();
  -- Non-super_admin cannot change super_admin or senior_member roles
  IF OLD.role IN ('super_admin', 'senior_member') AND actor_role != 'super_admin' THEN
    NEW.role := OLD.role;  -- silently keep old role
  END IF;
  -- Nobody can remove their own super_admin status
  IF OLD.id = auth.uid() AND OLD.role = 'super_admin' THEN
    NEW.role := 'super_admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_roles ON profiles;
CREATE TRIGGER trg_protect_privileged_roles
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_roles();


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 5: RLS POLICIES (uses is_admin() from step 3)     ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── user_roles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "View roles" ON user_roles;
DROP POLICY IF EXISTS "Admins manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

CREATE POLICY "View roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage user roles" ON user_roles
  FOR ALL USING (is_admin());

-- ── elections ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Elections viewable by all" ON elections;
DROP POLICY IF EXISTS "Admins insert elections" ON elections;
DROP POLICY IF EXISTS "Admins update elections" ON elections;
DROP POLICY IF EXISTS "Admins delete elections" ON elections;

CREATE POLICY "Elections viewable" ON elections
  FOR SELECT USING (status != 'draft' OR is_admin());
CREATE POLICY "Admins insert elections" ON elections
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins update elections" ON elections
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete elections" ON elections
  FOR DELETE USING (is_admin());

-- ── election_positions ──────────────────────────────────────
ALTER TABLE election_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Positions viewable by all" ON election_positions;
DROP POLICY IF EXISTS "Admins manage positions" ON election_positions;
DROP POLICY IF EXISTS "Positions viewable" ON election_positions;

CREATE POLICY "Positions viewable" ON election_positions
  FOR SELECT USING (true);
CREATE POLICY "Admins manage positions" ON election_positions
  FOR ALL USING (is_admin());

-- ── election_candidates ─────────────────────────────────────
DROP POLICY IF EXISTS "Candidates viewable by all" ON election_candidates;
DROP POLICY IF EXISTS "Candidates viewable when approved or admin" ON election_candidates;
DROP POLICY IF EXISTS "Members can self-nominate" ON election_candidates;
DROP POLICY IF EXISTS "Admins manage candidates" ON election_candidates;

CREATE POLICY "Candidates viewable" ON election_candidates
  FOR SELECT USING (is_approved = true OR is_admin() OR auth.uid() = user_id);
CREATE POLICY "Members self-nominate" ON election_candidates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage candidates" ON election_candidates
  FOR ALL USING (is_admin());

-- ── election_votes ──────────────────────────────────────────
DROP POLICY IF EXISTS "Voters see own votes" ON election_votes;
DROP POLICY IF EXISTS "Eligible members can vote" ON election_votes;
DROP POLICY IF EXISTS "Admins view all votes" ON election_votes;

CREATE POLICY "View own votes" ON election_votes
  FOR SELECT USING (auth.uid() = voter_id OR is_admin());
CREATE POLICY "Members can vote" ON election_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ── hike_events ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Published events viewable by all" ON hike_events;
DROP POLICY IF EXISTS "Events viewable" ON hike_events;
DROP POLICY IF EXISTS "Admins insert hikes" ON hike_events;
DROP POLICY IF EXISTS "Admins update hikes" ON hike_events;
DROP POLICY IF EXISTS "Admins delete hikes" ON hike_events;

CREATE POLICY "Events viewable" ON hike_events
  FOR SELECT USING (status != 'draft' OR is_admin());
CREATE POLICY "Admins insert hikes" ON hike_events
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins update hikes" ON hike_events
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete hikes" ON hike_events
  FOR DELETE USING (is_admin());

-- ── event_registrations ─────────────────────────────────────
DROP POLICY IF EXISTS "Users view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "View registrations" ON event_registrations;
DROP POLICY IF EXISTS "Members can register" ON event_registrations;
DROP POLICY IF EXISTS "Members update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins delete registrations" ON event_registrations;

CREATE POLICY "View registrations" ON event_registrations
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Members register" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members update own" ON event_registrations
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins delete" ON event_registrations
  FOR DELETE USING (is_admin());

-- ── announcements ───────────────────────────────────────────
DROP POLICY IF EXISTS "Published announcements viewable" ON announcements;
DROP POLICY IF EXISTS "Announcements viewable" ON announcements;
DROP POLICY IF EXISTS "Admins insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins delete announcements" ON announcements;

CREATE POLICY "Announcements viewable" ON announcements
  FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admins insert announcements" ON announcements
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins update announcements" ON announcements
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete announcements" ON announcements
  FOR DELETE USING (is_admin());

-- ── gallery ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Gallery viewable by all" ON gallery_albums;
DROP POLICY IF EXISTS "Albums viewable by all" ON gallery_albums;
DROP POLICY IF EXISTS "Admins manage albums" ON gallery_albums;
DROP POLICY IF EXISTS "Gallery media viewable by all" ON gallery_media;
DROP POLICY IF EXISTS "Media viewable by all" ON gallery_media;
DROP POLICY IF EXISTS "Admins manage media" ON gallery_media;

CREATE POLICY "Albums viewable" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "Admins manage albums" ON gallery_albums FOR ALL USING (is_admin());
CREATE POLICY "Media viewable" ON gallery_media FOR SELECT USING (true);
CREATE POLICY "Admins manage media" ON gallery_media FOR ALL USING (is_admin());

-- ── feedback ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Approved feedback viewable" ON feedback;
DROP POLICY IF EXISTS "Feedback viewable" ON feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Members can create feedback" ON feedback;
DROP POLICY IF EXISTS "Admins manage feedback" ON feedback;

CREATE POLICY "Feedback viewable" ON feedback
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR is_admin());
CREATE POLICY "Members create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage feedback" ON feedback
  FOR ALL USING (is_admin());

-- ── authorities ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Authorities viewable by all" ON authorities;
DROP POLICY IF EXISTS "Active authorities viewable" ON authorities;
DROP POLICY IF EXISTS "Admins manage authorities" ON authorities;

CREATE POLICY "Authorities viewable" ON authorities
  FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins manage authorities" ON authorities
  FOR ALL USING (is_admin());

-- ── profiles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE USING (is_admin());

-- ── notifications ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "View own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins insert notifications" ON notifications;

CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() = user_id);

-- ── safety_incidents ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own incidents" ON safety_incidents;
DROP POLICY IF EXISTS "View incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Users can create incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Members report incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Admins update incidents" ON safety_incidents;

CREATE POLICY "View incidents" ON safety_incidents
  FOR SELECT USING (auth.uid() = reported_by OR is_admin());
CREATE POLICY "Members report incidents" ON safety_incidents
  FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins update incidents" ON safety_incidents
  FOR UPDATE USING (is_admin());

-- ── member_achievements ──────────────────────────────────────
DROP POLICY IF EXISTS "Achievements viewable by all" ON member_achievements;

CREATE POLICY "Achievements viewable" ON member_achievements
  FOR SELECT USING (true);
CREATE POLICY "Admins award achievements" ON member_achievements
  FOR INSERT WITH CHECK (is_admin());


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 6: VIEWS                                          ║
-- ╚══════════════════════════════════════════════════════════╝

-- All roles a user holds
CREATE OR REPLACE VIEW v_user_all_roles AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role AS primary_role,
  p.is_senior_member,
  p.executive_designation,
  ARRAY(SELECT ur.role FROM user_roles ur WHERE ur.user_id = p.id) AS additional_roles
FROM profiles p;

-- Election results
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


-- ╔══════════════════════════════════════════════════════════╗
-- ║  STEP 7: YOUR ADMIN ACCOUNT                             ║
-- ╚══════════════════════════════════════════════════════════╝
-- After registering at /auth/register, run the line below
-- replacing the email with YOUR email address:
--
-- UPDATE profiles
-- SET role = 'super_admin', membership_status = 'active', is_senior_member = true
-- WHERE email = 'your@email.com';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  VERIFICATION                                           ║
-- ╚══════════════════════════════════════════════════════════╝
SELECT
  'Setup complete!' AS status,
  (SELECT COUNT(*) FROM profiles)          AS total_profiles,
  (SELECT COUNT(*) FROM hike_events)       AS total_hikes,
  (SELECT COUNT(*) FROM elections)         AS total_elections,
  (SELECT proname FROM pg_proc WHERE proname = 'is_admin' LIMIT 1) AS is_admin_function;
