-- GenZ Hikers Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' 
    CHECK (role IN ('super_admin','admin','executive','organizer','moderator','verified_member','member')),
  membership_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (membership_status IN ('pending','active','suspended','rejected')),
  membership_id TEXT UNIQUE,
  membership_card_url TEXT,
  card_requested_at TIMESTAMPTZ,
  card_approved_at TIMESTAMPTZ,
  card_approved_by UUID REFERENCES profiles(id),
  completed_hikes_count INTEGER NOT NULL DEFAULT 0,
  total_distance_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_senior_member BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTHORITIES / LEADERSHIP TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS authorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT,
  city TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  instagram_handle TEXT,
  whatsapp TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HIKING EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hike_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  starting_point TEXT NOT NULL,
  meeting_time TIME NOT NULL,
  estimated_return_time TIME,
  event_date DATE NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'moderate'
    CHECK (difficulty IN ('easy','moderate','difficult','extreme')),
  distance_km DECIMAL(8,2),
  elevation_gain_m INTEGER,
  max_participants INTEGER NOT NULL DEFAULT 30,
  registered_count INTEGER NOT NULL DEFAULT 0,
  attended_count INTEGER NOT NULL DEFAULT 0,
  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('draft','upcoming','ongoing','completed','postponed','cancelled')),
  cover_image_url TEXT,
  route_map_url TEXT,
  required_equipment TEXT[],
  safety_instructions TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organizer_name TEXT,
  organizer_contact TEXT,
  notes TEXT,
  cancellation_policy TEXT,
  weather_info TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENT REGISTRATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES hike_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','confirmed','waitlisted','cancelled','attended')),
  payment_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required','pending','paid','refunded')),
  payment_amount DECIMAL(10,2),
  payment_proof_url TEXT,
  payment_notes TEXT,
  notes TEXT,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- EVENT CHECKPOINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS event_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES hike_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkpoint_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id UUID NOT NULL REFERENCES event_checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(checkpoint_id, user_id)
);

-- ============================================================
-- GALLERY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES hike_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date DATE,
  location TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photographer_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('upcoming_hikes','important_notices','elections','membership','events','general')),
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY FEEDBACK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES hike_events(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general','destination','organization','safety','suggestions','other')),
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  admin_response TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ELECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  nomination_start TIMESTAMPTZ NOT NULL,
  nomination_end TIMESTAMPTZ NOT NULL,
  voting_start TIMESTAMPTZ NOT NULL,
  voting_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','nominations_open','nominations_closed','voting_open','closed','results_published')),
  results_published_at TIMESTAMPTZ,
  eligibility_note TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS election_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS election_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES election_positions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manifesto TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, position_id, user_id)
);

CREATE TABLE IF NOT EXISTS election_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES election_positions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, position_id, voter_id)
);

-- ============================================================
-- ACHIEVEMENTS / BADGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS achievement_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  badge_image_url TEXT,
  requirement_type TEXT NOT NULL 
    CHECK (requirement_type IN ('hike_count','distance','streak','special')),
  requirement_value INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_types(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- SAFETY / INCIDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES hike_events(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL
    CHECK (incident_type IN ('injury','missing_person','unsafe_conditions','other')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','resolved','closed')),
  location_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general'
    CHECK (type IN ('general','registration','event','membership','election','announcement','safety')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS community_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_hike_events_status ON hike_events(status);
CREATE INDEX IF NOT EXISTS idx_hike_events_event_date ON hike_events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_album_id ON gallery_media(album_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_election_votes_election ON election_votes(election_id, position_id, voter_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hike_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin full access via service role (handled server-side)

-- Authorities: public read
CREATE POLICY "Authorities viewable by all" ON authorities
  FOR SELECT USING (is_active = true);

-- Hike events: public read for published
CREATE POLICY "Published events viewable by all" ON hike_events
  FOR SELECT USING (status != 'draft');

-- Registrations: users see own
CREATE POLICY "Users view own registrations" ON event_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Gallery: public read
CREATE POLICY "Gallery viewable by all" ON gallery_albums
  FOR SELECT USING (true);

CREATE POLICY "Gallery media viewable by all" ON gallery_media
  FOR SELECT USING (true);

-- Announcements: public read for published
CREATE POLICY "Published announcements viewable" ON announcements
  FOR SELECT USING (is_published = true);

-- Feedback: users see own + approved
CREATE POLICY "Approved feedback viewable" ON feedback
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Elections: public read for active
CREATE POLICY "Elections viewable by all" ON elections
  FOR SELECT USING (status != 'draft');

CREATE POLICY "Candidates viewable by all" ON election_candidates
  FOR SELECT USING (is_approved = true);

-- Notifications: users see own
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: public read
CREATE POLICY "Achievements viewable by all" ON member_achievements
  FOR SELECT USING (true);

-- Safety incidents: users see own
CREATE POLICY "Users view own incidents" ON safety_incidents
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Users can create incidents" ON safety_incidents
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'username', NULL)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update profile updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hike_events_updated_at BEFORE UPDATE ON hike_events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- SEED DATA - Default achievement types
-- ============================================================
INSERT INTO achievement_types (name, description, icon, requirement_type, requirement_value, sort_order)
VALUES
  ('First Steps', 'Completed your first GenZ Hikers hike', 'footprints', 'hike_count', 1, 1),
  ('Trail Blazer', 'Completed 5 hikes with GenZ Hikers', 'mountain', 'hike_count', 5, 2),
  ('Peak Seeker', 'Completed 10 hikes with GenZ Hikers', 'triangle', 'hike_count', 10, 3),
  ('Summit Master', 'Completed 25 hikes with GenZ Hikers', 'star', 'hike_count', 25, 4),
  ('Legend', 'Completed 50 hikes with GenZ Hikers', 'award', 'hike_count', 50, 5),
  ('Explorer 50K', 'Covered 50 KM of trails', 'map-pin', 'distance', 50, 6),
  ('Explorer 100K', 'Covered 100 KM of trails', 'navigation', 'distance', 100, 7)
ON CONFLICT DO NOTHING;

-- Seed community settings
INSERT INTO community_settings (key, value, description)
VALUES
  ('mission', 'To inspire the next generation of Pakistanis to explore the natural beauty of their country, build meaningful friendships, protect the environment, and live adventurously.', 'Community mission statement'),
  ('vision', 'A Pakistan where every young person has experienced the transformative power of hiking in nature, and where outdoor adventure is a cornerstone of youth culture.', 'Community vision statement'),
  ('founded_year', '2023', 'Year the community was founded'),
  ('instagram_url', 'https://www.instagram.com/genz_hikers/', 'Official Instagram URL'),
  ('whatsapp_channel_url', 'https://whatsapp.com/channel/0029VbDl4tzEFeXfMtxJVu08', 'WhatsApp channel URL'),
  ('instagram_group_url', 'https://ig.me/j/xz3NB6N_9dQB81gG', 'Instagram chat group URL')
ON CONFLICT (key) DO NOTHING;

-- Seed leadership/authorities
INSERT INTO authorities (name, designation, department, city, bio, sort_order, is_active, is_founding_member)
VALUES
  ('Talat Hussain', 'Head / Founder', 'Leadership', 'Gilgit', 'The visionary founder and head of GenZ Hikers. Talat leads the community with passion for mountains, environmental conservation, and building friendships through adventure.', 1, true, true),
  ('Rizwan Ali', 'Instagram Manager', 'Media & Communications', 'Gilgit', 'Managing the GenZ Hikers Instagram presence, capturing adventures, and sharing the community story with the world.', 2, true, true),
  ('Ali Haider', 'Senior Member', 'Operations', 'Multan', 'A dedicated senior member contributing to event planning, member engagement, and community growth.', 3, true, true),
  ('Saad', 'Senior Member', 'Community', 'Buner', 'An active senior member known for enthusiasm, team spirit, and unwavering commitment to every hike.', 4, true, true),
  ('M. Qaswar', 'Senior Member', 'Operations', 'Pakistan', 'A valued senior member helping to organize and coordinate GenZ Hikers activities.', 5, true, true),
  ('Raheel Ahmed Khan', 'Senior Member', 'Community', 'Pakistan', 'A dependable senior member contributing to the community culture and member experiences.', 6, true, true),
  ('Muhammad Azan', 'Senior Member', 'Community', 'Pakistan', 'An enthusiastic senior member bringing energy and positivity to every GenZ Hikers adventure.', 7, true, true),
  ('Aqsa', 'Senior Member', 'Community', 'Pakistan', 'A pioneering female senior member inspiring inclusivity and adventure within GenZ Hikers.', 8, true, true)
ON CONFLICT DO NOTHING;
