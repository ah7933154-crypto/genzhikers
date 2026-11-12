-- ============================================================
-- GenZ Hikers — nominated_by fix + 10 test members
-- Run this in Supabase SQL Editor
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PART 1: ADD nominated_by TO election_candidates        ║
-- ╚══════════════════════════════════════════════════════════╝

ALTER TABLE election_candidates
  ADD COLUMN IF NOT EXISTS nominated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_election_candidates_nominated_by
  ON election_candidates(nominated_by);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PART 2: 10 TEST MEMBERS                                ║
-- ║  Password for all: TestPass123!                         ║
-- ╚══════════════════════════════════════════════════════════╝

DO $$
DECLARE
  members JSONB := '[
    {"id":"11111111-0000-0000-0000-000000000001","name":"Ahmed Khan",   "email":"ahmed.test@genz.pk",  "city":"Islamabad"},
    {"id":"11111111-0000-0000-0000-000000000002","name":"Sara Malik",   "email":"sara.test@genz.pk",   "city":"Lahore"},
    {"id":"11111111-0000-0000-0000-000000000003","name":"Usman Ali",    "email":"usman.test@genz.pk",  "city":"Rawalpindi"},
    {"id":"11111111-0000-0000-0000-000000000004","name":"Fatima Noor",  "email":"fatima.test@genz.pk", "city":"Karachi"},
    {"id":"11111111-0000-0000-0000-000000000005","name":"Bilal Hassan", "email":"bilal.test@genz.pk",  "city":"Peshawar"},
    {"id":"11111111-0000-0000-0000-000000000006","name":"Zara Sheikh",  "email":"zara.test@genz.pk",   "city":"Lahore"},
    {"id":"11111111-0000-0000-0000-000000000007","name":"Hamza Raza",   "email":"hamza.test@genz.pk",  "city":"Islamabad"},
    {"id":"11111111-0000-0000-0000-000000000008","name":"Ayesha Butt",  "email":"ayesha.test@genz.pk", "city":"Murree"},
    {"id":"11111111-0000-0000-0000-000000000009","name":"Owais Javed",  "email":"owais.test@genz.pk",  "city":"Abbottabad"},
    {"id":"11111111-0000-0000-0000-000000000010","name":"Hina Qureshi", "email":"hina.test@genz.pk",   "city":"Nathia Gali"}
  ]';
  m    JSONB;
  uid  UUID;
  now_ TIMESTAMPTZ := NOW();
BEGIN
  FOR m IN SELECT * FROM jsonb_array_elements(members)
  LOOP
    uid := (m->>'id')::UUID;

    -- 1. auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      role,
      aud,
      is_sso_user,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      m->>'email',
      crypt('TestPass123!', gen_salt('bf')),
      now_,          -- email already confirmed
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated',
      FALSE,
      now_,
      now_,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', m->>'name')
    )
    ON CONFLICT (id) DO UPDATE SET
      encrypted_password  = crypt('TestPass123!', gen_salt('bf')),
      email_confirmed_at  = now_,
      updated_at          = now_;

    -- 2. auth.identities  (required for email/password sign-in)
    INSERT INTO auth.identities (
      id,
      user_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      uid,                 -- identity id (UUID)
      uid,
      'email',
      jsonb_build_object(
        'sub',   uid::TEXT,
        'email', m->>'email'
      ),
      now_,
      now_,
      now_
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. profiles
    INSERT INTO profiles (
      id,
      full_name,
      email,
      city,
      role,
      membership_status,
      completed_hikes_count,
      is_senior_member,
      membership_id,
      card_approved_at,
      card_requested_at
    )
    VALUES (
      uid,
      m->>'name',
      m->>'email',
      m->>'city',
      'member',
      'active',
      2,
      FALSE,
      'GZH26' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),
      now_ - INTERVAL '2 days',
      now_ - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name             = EXCLUDED.full_name,
      email                 = EXCLUDED.email,
      city                  = EXCLUDED.city,
      membership_status     = 'active',
      completed_hikes_count = 2,
      card_approved_at      = now_ - INTERVAL '2 days',
      card_requested_at     = now_ - INTERVAL '3 days';

  END LOOP;
END;
$$;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  VERIFICATION — should return 10 rows                   ║
-- ╚══════════════════════════════════════════════════════════╝

SELECT
  p.full_name,
  p.email,
  p.city,
  p.membership_status,
  p.completed_hikes_count  AS hikes,
  p.membership_id,
  p.card_approved_at IS NOT NULL AS card_ready,
  i.provider               AS auth_provider
FROM profiles p
JOIN auth.identities i ON i.user_id = p.id
WHERE p.email LIKE '%@genz.pk'
ORDER BY p.full_name;
