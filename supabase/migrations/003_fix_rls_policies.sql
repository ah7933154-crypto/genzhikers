-- ============================================================
-- GenZ Hikers — Fix RLS Policies (Run this in Supabase SQL Editor)
-- This fixes the "violates row-level security" errors
-- ============================================================

-- ── Helper: check if current user is admin ───────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'senior_member')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- ELECTIONS
-- ============================================================
DROP POLICY IF EXISTS "Elections viewable by all" ON elections;
DROP POLICY IF EXISTS "Admins manage elections" ON elections;

CREATE POLICY "Elections viewable by all" ON elections
  FOR SELECT USING (status != 'draft' OR is_admin());

CREATE POLICY "Admins insert elections" ON elections
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins update elections" ON elections
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins delete elections" ON elections
  FOR DELETE USING (is_admin());


-- ============================================================
-- ELECTION POSITIONS
-- ============================================================
DROP POLICY IF EXISTS "Positions viewable by all" ON election_positions;
ALTER TABLE election_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Positions viewable by all" ON election_positions
  FOR SELECT USING (true);

CREATE POLICY "Admins manage positions" ON election_positions
  FOR ALL USING (is_admin());


-- ============================================================
-- ELECTION CANDIDATES
-- ============================================================
DROP POLICY IF EXISTS "Candidates viewable by all" ON election_candidates;
DROP POLICY IF EXISTS "Admins manage candidates" ON election_candidates;

CREATE POLICY "Candidates viewable when approved or admin" ON election_candidates
  FOR SELECT USING (is_approved = true OR is_admin() OR auth.uid() = user_id);

CREATE POLICY "Members can self-nominate" ON election_candidates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage candidates" ON election_candidates
  FOR ALL USING (is_admin());


-- ============================================================
-- ELECTION VOTES
-- ============================================================
DROP POLICY IF EXISTS "Voters see own votes" ON election_votes;
DROP POLICY IF EXISTS "Voters insert votes" ON election_votes;

CREATE POLICY "Voters see own votes" ON election_votes
  FOR SELECT USING (auth.uid() = voter_id OR is_admin());

CREATE POLICY "Eligible members can vote" ON election_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Admins view all votes" ON election_votes
  FOR SELECT USING (is_admin());


-- ============================================================
-- HIKE EVENTS
-- ============================================================
DROP POLICY IF EXISTS "Published events viewable by all" ON hike_events;
DROP POLICY IF EXISTS "Admins manage hikes" ON hike_events;

CREATE POLICY "Events viewable" ON hike_events
  FOR SELECT USING (status != 'draft' OR is_admin());

CREATE POLICY "Admins insert hikes" ON hike_events
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins update hikes" ON hike_events
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins delete hikes" ON hike_events
  FOR DELETE USING (is_admin());


-- ============================================================
-- EVENT REGISTRATIONS
-- ============================================================
DROP POLICY IF EXISTS "Users view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;

CREATE POLICY "View registrations" ON event_registrations
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Members can register" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins delete registrations" ON event_registrations
  FOR DELETE USING (is_admin());


-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
DROP POLICY IF EXISTS "Published announcements viewable" ON announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;

CREATE POLICY "Announcements viewable" ON announcements
  FOR SELECT USING (is_published = true OR is_admin());

CREATE POLICY "Admins insert announcements" ON announcements
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins update announcements" ON announcements
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins delete announcements" ON announcements
  FOR DELETE USING (is_admin());


-- ============================================================
-- GALLERY
-- ============================================================
DROP POLICY IF EXISTS "Gallery viewable by all" ON gallery_albums;
DROP POLICY IF EXISTS "Gallery media viewable by all" ON gallery_media;

CREATE POLICY "Albums viewable by all" ON gallery_albums
  FOR SELECT USING (true);

CREATE POLICY "Admins manage albums" ON gallery_albums
  FOR ALL USING (is_admin());

CREATE POLICY "Media viewable by all" ON gallery_media
  FOR SELECT USING (true);

CREATE POLICY "Admins manage media" ON gallery_media
  FOR ALL USING (is_admin());


-- ============================================================
-- FEEDBACK
-- ============================================================
DROP POLICY IF EXISTS "Approved feedback viewable" ON feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;

CREATE POLICY "Feedback viewable" ON feedback
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Members can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage feedback" ON feedback
  FOR ALL USING (is_admin());


-- ============================================================
-- AUTHORITIES
-- ============================================================
DROP POLICY IF EXISTS "Authorities viewable by all" ON authorities;
DROP POLICY IF EXISTS "Admins manage authorities" ON authorities;

CREATE POLICY "Active authorities viewable" ON authorities
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins manage authorities" ON authorities
  FOR ALL USING (is_admin());


-- ============================================================
-- PROFILES — Admin can update any profile
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin update profiles" ON profiles;

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE USING (is_admin());


-- ============================================================
-- NOTIFICATIONS — Admins can insert for any user
-- ============================================================
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;

CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() = user_id);


-- ============================================================
-- SAFETY INCIDENTS — Admins see all
-- ============================================================
DROP POLICY IF EXISTS "Users view own incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Users can create incidents" ON safety_incidents;

CREATE POLICY "View incidents" ON safety_incidents
  FOR SELECT USING (auth.uid() = reported_by OR is_admin());

CREATE POLICY "Members report incidents" ON safety_incidents
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins update incidents" ON safety_incidents
  FOR UPDATE USING (is_admin());


-- ============================================================
-- MEMBER ACHIEVEMENTS — Admins can award
-- ============================================================
DROP POLICY IF EXISTS "Achievements viewable by all" ON member_achievements;

CREATE POLICY "Achievements viewable by all" ON member_achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins award achievements" ON member_achievements
  FOR INSERT WITH CHECK (is_admin());


-- ============================================================
-- USER ROLES table (from migration 002)
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

CREATE POLICY "View roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage user roles" ON user_roles
  FOR ALL USING (is_admin());


-- ============================================================
-- Verify
-- ============================================================
SELECT 'RLS policies updated successfully' AS status;
